import express from 'express';
import { query } from '../db.js';
import { initializeDatabase } from '../initDb.js';
import { authenticateToken, optionalAuthenticateToken, permit } from '../middleware/auth.js';
import { employeeSchema } from '../validators.js';
import { logAdminAction, getEntityName, getClientInfo } from '../utils/logger.js';

const router = express.Router();
const examScoreKeys = [
  'konstitutsiya_score',
  'kodeks_score',
  'protsessual_kodeks_score',
  'akt_sohasi_score',
  'odob_axloq_score',
];

function normalizeScore(value) {
  // Handle empty string, null, or undefined as "not taken"
  if (value === '' || value === null || value === undefined) return 0;
  const score = Number(value);
  if (!Number.isFinite(score) || score < 0) return 0;
  return Math.round(score);
}

function buildExamPayload(value) {
  const payload = {
    scores: {},
    legacyScores: {},
  };
  const activeScores = [];

  if (value.scores && typeof value.scores === 'object') {
    Object.entries(value.scores).forEach(([key, raw]) => {
      const score = normalizeScore(raw);
      payload.scores[key] = score;
      payload.legacyScores[`${key}_score`] = score;
      payload.legacyScores[`${key}_status`] = score > 0 ? 'topshirdi' : 'topshirmadi';
      if (score > 0) activeScores.push(score);
    });
  } else {
    examScoreKeys.forEach((key) => {
      const score = normalizeScore(value[key]);
      const scoreKey = key.replace('_score', '');
      payload.scores[scoreKey] = score;
      payload.legacyScores[key] = score;
      const statusKey = `${scoreKey}_status`;
      payload.legacyScores[statusKey] = score > 0 ? 'topshirdi' : 'topshirmadi';
      if (score > 0) activeScores.push(score);
    });
  }

  payload.score = activeScores.length
    ? Math.round(activeScores.reduce((sum, current) => sum + current, 0) / activeScores.length)
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
      filters.push(`employees.region_id = ANY($${index++})`);
      values.push(assigned);
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
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const filter = buildFilters(req.query, req.user || null);

    const listQuery = `
      SELECT employees.*, regions.name AS region_name, districts.name AS district_name
      FROM employees
      LEFT JOIN regions ON employees.region_id = regions.id
      LEFT JOIN districts ON employees.district_id = districts.id
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
    let accessClause = '';
    const values = [req.params.id];

    if (req.user?.role === 'admin') {
      const assigned = Array.isArray(req.user.assigned_regions) ? req.user.assigned_regions : [];
      if (!assigned.length) return res.status(404).json({ error: 'Xodim topilmadi' });
      accessClause = ' AND employees.region_id = ANY($2)';
      values.push(assigned);
    }

    const result = await safeQuery(
      `SELECT employees.*, regions.name AS region_name, districts.name AS district_name
       FROM employees
       LEFT JOIN regions ON employees.region_id = regions.id
       LEFT JOIN districts ON employees.district_id = districts.id
       WHERE employees.id = $1${accessClause}`,
      values
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Xodim topilmadi' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticateToken, permit('super_admin', 'admin'), async (req, res, next) => {
  try {
    const { error, value } = employeeSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    if (req.user.role === 'admin' && !req.user.assigned_regions.includes(value.region_id)) {
      return res.status(403).json({ error: 'Siz faqat belgilangan viloyatlar bo‘yicha xodim qo‘sha olasiz' });
    }

    const examPayload = buildExamPayload(value);

    const insert = await safeQuery(
      `INSERT INTO employees (
         full_name, position, region_id, district_id, score, scores
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        value.full_name,
        value.position,
        value.region_id,
        value.district_id,
        examPayload.score,
        JSON.stringify(examPayload.scores),
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

router.put('/:id', authenticateToken, permit('super_admin', 'admin'), async (req, res, next) => {
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

    const examPayload = buildExamPayload(value);

    const update = await safeQuery(
      `UPDATE employees
       SET full_name = $1, position = $2, region_id = $3, district_id = $4, score = $5, scores = $6,
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        value.full_name,
        value.position,
        value.region_id,
        value.district_id,
        examPayload.score,
        JSON.stringify(examPayload.scores),
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

router.delete('/:id', authenticateToken, permit('super_admin', 'admin'), async (req, res, next) => {
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
