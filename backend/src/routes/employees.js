import express from 'express';
import { query } from '../db.js';
import { initializeDatabase } from '../initDb.js';
import { authenticateToken, optionalAuthenticateToken, permit, permitPermission } from '../middleware/auth.js';
import { employeeSchema } from '../validators.js';
import { logAdminAction, getEntityName, getClientInfo } from '../utils/logger.js';
import { hasPermission, PERMISSIONS } from '../permissions.js';

const router = express.Router();
function normalizeScore(value) {
  // Handle empty string, null, or undefined as "not taken"
  if (value === '' || value === null || value === undefined) return 0;
  const score = Number(value);
  if (!Number.isFinite(score) || score < 0) return 0;
  return Math.round(score);
}

function distributeWeights(count) {
  if (!count || count <= 0) return [];
  const base = Math.floor(100 / count);
  const remainder = 100 - base * count;
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}

async function buildExamPayload(value) {
  const payload = { scores: {}, chosen_sections: {} };
  let criteriaRows = [];
  try {
    const collegeId = value.college_id ? Number(value.college_id) : null;
    const collegeFilter = Number.isInteger(collegeId)
      ? 'INNER JOIN college_criteria cc ON cc.criterion_id = c.id AND cc.college_id = $1'
      : '';
    const params = Number.isInteger(collegeId) ? [collegeId] : [];
    const result = await query(`
      SELECT c.key AS criterion_key, s.key AS section_key
      FROM criteria c
      ${collegeFilter}
      LEFT JOIN criterion_sections s ON s.criterion_id = c.id
      ORDER BY c.sort_order, c.id, s.sort_order, s.id
    `, params);
    criteriaRows = result.rows;
  } catch (e) {
    // fallback to legacy scoring when sections/criteria table is missing
  }

  const criteriaMap = new Map();
  criteriaRows.forEach((row) => {
    if (!criteriaMap.has(row.criterion_key)) {
      criteriaMap.set(row.criterion_key, []);
    }
    if (row.section_key) {
      criteriaMap.get(row.criterion_key).push(row.section_key);
    }
  });

  if (!criteriaMap.size) {
    // Legacy behavior when criteria / sections aren't defined yet
    const criteriaKeys = Object.keys(value.scores || {});
    const scoreValues = [];
    criteriaKeys.forEach((key) => {
      const raw = value.scores && typeof value.scores === 'object' ? value.scores[key] : undefined;
      const s = normalizeScore(raw);
      payload.scores[key] = s;
      scoreValues.push(s);
    });
    payload.score = scoreValues.length
      ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
      : 0;
    return payload;
  }

  const scoreValues = [];
  criteriaMap.forEach((sections, criterionKey) => {
    let score = 0;
    if (sections.length) {
      const rawSelected = value.chosen_sections && typeof value.chosen_sections === 'object'
        ? value.chosen_sections[criterionKey]
        : undefined;
      const selectedSections = Array.isArray(rawSelected)
        ? rawSelected
        : rawSelected ? [rawSelected] : [];
      const validSelected = selectedSections.filter((item) => typeof item === 'string' && sections.includes(item));
      const weights = distributeWeights(sections.length);
      score = validSelected.reduce((sum, sectionKey) => {
        const index = sections.indexOf(sectionKey);
        return index >= 0 ? sum + weights[index] : sum;
      }, 0);
      payload.chosen_sections[criterionKey] = validSelected;
      payload.scores[criterionKey] = score;
    } else {
      const raw = value.scores && typeof value.scores === 'object' ? value.scores[criterionKey] : undefined;
      score = normalizeScore(raw);
      payload.scores[criterionKey] = score;
    }
    scoreValues.push(score);
  });

  payload.score = scoreValues.length
    ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
    : 0;

  return payload;
}

function buildFilters(queryParams, user) {
  const filters = [];
  const values = [];
  let index = 1;

  if (queryParams.region_id) {
    filters.push(`employees.region_id = $${index++}`);
    values.push(queryParams.region_id);
  }
  if (queryParams.district_id) {
    filters.push(`employees.district_id = $${index++}`);
    values.push(queryParams.district_id);
  }
  if (queryParams.college_id) {
    filters.push(`employees.college_id = $${index++}`);
    values.push(queryParams.college_id);
  }
  if (queryParams.min_score) {
    filters.push(`employees.score >= $${index++}`);
    values.push(queryParams.min_score);
  }
  if (queryParams.max_score) {
    filters.push(`employees.score <= $${index++}`);
    values.push(queryParams.max_score);
  }
  if (queryParams.search) {
    filters.push(`LOWER(employees.full_name) LIKE $${index++}`);
    values.push(`%${queryParams.search.toLowerCase()}%`);
  }

  if (user && user.role === 'admin') {
    const assigned = Array.isArray(user.assigned_regions) ? user.assigned_regions : [];
    if (!assigned.length) {
      filters.push('1 = 0');
    } else {
      filters.push(`employees.region_id = ANY($${index++}::int[])`);
      values.push(assigned.map((r) => Number(r)));
    }
  }

  return { clause: filters.length ? `WHERE ${filters.join(' AND ')}` : '', values };
}

async function safeQuery(text, params) {
  try {
    return await query(text, params);
  } catch (err) {
    const msg = String(err?.message || err);
    if (msg.includes("column \"scores\"") || msg.includes("relation \"criteria\"") || msg.includes('does not exist')) {
      try {
        console.warn('Detected missing schema element, running initializeDatabase and retrying query');
        await initializeDatabase();
        return await query(text, params);
      } catch (innerErr) {
        throw innerErr;
      }
    }
    throw err;
  }
}

router.get('/', optionalAuthenticateToken, async (req, res, next) => {
  try {
    if (req.user && !hasPermission(req.user, PERMISSIONS.EMPLOYEES_VIEW)) {
      return res.status(403).json({ error: "Xodimlarni ko'rish uchun ruxsat yo'q" });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const filter = buildFilters(req.query, req.user || null);

    const listQuery = `
      SELECT employees.*, regions.name AS region_name, districts.name AS district_name, colleges.name AS college_name
      FROM employees
      LEFT JOIN regions ON employees.region_id = regions.id
      LEFT JOIN districts ON employees.district_id = districts.id
      LEFT JOIN colleges ON employees.college_id = colleges.id
      ${filter.clause}
      ORDER BY employees.score DESC, employees.full_name
      LIMIT $${filter.values.length + 1}
      OFFSET $${filter.values.length + 2}`;

    const countQuery = `SELECT COUNT(*) AS total FROM employees ${filter.clause}`;
    const [list, count] = await Promise.all([
      safeQuery(listQuery, [...filter.values, limit, offset]),
      safeQuery(countQuery, filter.values),
    ]);

    res.json({ data: list.rows, total: Number(count.rows[0].total), page, limit });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', optionalAuthenticateToken, async (req, res, next) => {
  try {
    if (req.user && !hasPermission(req.user, PERMISSIONS.EMPLOYEES_VIEW)) {
      return res.status(403).json({ error: "Xodimni ko'rish uchun ruxsat yo'q" });
    }

    let accessClause = '';
    const values = [req.params.id];

    if (req.user?.role === 'admin') {
      const assigned = Array.isArray(req.user.assigned_regions) ? req.user.assigned_regions : [];
      if (!assigned.length) return res.status(404).json({ error: 'Xodim topilmadi' });
      accessClause = ' AND employees.region_id = ANY($2::int[])';
      values.push(assigned.map((r) => Number(r)));
    }

    const result = await safeQuery(
      `SELECT employees.*, regions.name AS region_name, districts.name AS district_name, colleges.name AS college_name
       FROM employees
       LEFT JOIN regions ON employees.region_id = regions.id
       LEFT JOIN districts ON employees.district_id = districts.id
       LEFT JOIN colleges ON employees.college_id = colleges.id
       WHERE employees.id = $1${accessClause}`,
      values
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Xodim topilmadi' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticateToken, permit('super_admin', 'admin'), permitPermission(PERMISSIONS.EMPLOYEES_CREATE), async (req, res, next) => {
  try {
    const { error, value } = employeeSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    if (req.user.role === 'admin' && !req.user.assigned_regions.includes(value.region_id)) {
      return res.status(403).json({ error: 'Siz faqat belgilangan viloyatlar bo‘yicha xodim qo‘sha olasiz' });
    }

    const examPayload = await buildExamPayload(value);

    const insert = await safeQuery(
      `INSERT INTO employees (
         full_name, position, college_id, region_id, district_id, score, scores, chosen_sections
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        value.full_name,
        value.position,
        value.college_id || null,
        value.region_id,
        value.district_id,
        examPayload.score,
        JSON.stringify(examPayload.scores),
        JSON.stringify(examPayload.chosen_sections),
      ]
    );

    // Log the action
    const clientInfo = getClientInfo(req);
    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'CREATE',
      entityType: 'employee',
      entityId: insert.rows[0].id,
      entityName: getEntityName('employee', insert.rows[0]),
      newData: insert.rows[0],
      ...clientInfo,
    });

    res.status(201).json(insert.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticateToken, permit('super_admin', 'admin'), permitPermission(PERMISSIONS.EMPLOYEES_UPDATE), async (req, res, next) => {
  try {
    const { error, value } = employeeSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    // Get old data for logging
    const oldEmployeeResult = await safeQuery('SELECT * FROM employees WHERE id = $1', [req.params.id]);
    const oldData = oldEmployeeResult.rows[0] || null;

    const employeeResult = await safeQuery('SELECT region_id FROM employees WHERE id = $1', [req.params.id]);
    if (!employeeResult.rows.length) return res.status(404).json({ error: 'Xodim topilmadi' });

    const currentRegion = employeeResult.rows[0].region_id;
    const newRegion = Number(value.region_id);

    if (req.user.role === 'admin') {
      const assigned = Array.isArray(req.user.assigned_regions) ? req.user.assigned_regions : [];
      if (!assigned.includes(currentRegion)) {
        return res.status(403).json({ error: 'Siz bu xodimni tahrirlay olmaysiz' });
      }
      if (!assigned.includes(newRegion)) {
        return res.status(403).json({ error: 'Siz faqat o‘z viloyatingizga tegishli xodimlarni tahrirlashingiz mumkin' });
      }
    }

    const examPayload = await buildExamPayload(value);

    const update = await safeQuery(
      `UPDATE employees
       SET full_name = $1, position = $2, college_id = $3, region_id = $4, district_id = $5, score = $6, scores = $7, chosen_sections = $8,
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        value.full_name,
        value.position,
        value.college_id || null,
        value.region_id,
        value.district_id,
        examPayload.score,
        JSON.stringify(examPayload.scores),
        JSON.stringify(examPayload.chosen_sections),
        req.params.id,
      ]
    );

    // Log the action
    const clientInfo = getClientInfo(req);
    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'UPDATE',
      entityType: 'employee',
      entityId: update.rows[0].id,
      entityName: getEntityName('employee', update.rows[0]),
      oldData,
      newData: update.rows[0],
      ...clientInfo,
    });

    res.json(update.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticateToken, permit('super_admin', 'admin'), permitPermission(PERMISSIONS.EMPLOYEES_DELETE), async (req, res, next) => {
  try {
    // Get employee data for logging before deletion
    const employeeResult = await safeQuery('SELECT * FROM employees WHERE id = $1', [req.params.id]);
    if (!employeeResult.rows.length) return res.status(404).json({ error: 'Xodim topilmadi' });

    const employeeData = employeeResult.rows[0];

    if (req.user.role === 'admin' && !req.user.assigned_regions.includes(employeeData.region_id)) {
      return res.status(403).json({ error: 'Siz bu xodimni o\'chira olmaysiz' });
    }

    await safeQuery('DELETE FROM employees WHERE id = $1', [req.params.id]);

    // Log the action
    const clientInfo = getClientInfo(req);
    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'DELETE',
      entityType: 'employee',
      entityId: employeeData.id,
      entityName: getEntityName('employee', employeeData),
      oldData: employeeData,
      ...clientInfo,
    });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
