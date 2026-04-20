import express from 'express';
import { query } from '../db.js';
import { authenticateToken, optionalAuthenticateToken, permit } from '../middleware/auth.js';
import { employeeSchema } from '../validators.js';

const router = express.Router();
const examScoreKeys = [
  'konstitutsiya_score',
  'kodeks_score',
  'protsessual_kodeks_score',
  'akt_sohasi_score',
  'odob_axloq_score',
];

function normalizeScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score) || score <= 0) return 0;
  return Math.round(score);
}

function buildExamPayload(value) {
  const payload = {};
  const activeScores = [];

  examScoreKeys.forEach((key) => {
    const score = normalizeScore(value[key]);
    const statusKey = key.replace('_score', '_status');
    payload[key] = score;
    payload[statusKey] = score > 0 ? 'topshirdi' : 'topshirmadi';
    if (score > 0) activeScores.push(score);
  });

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
      query(listQuery, [...filter.values, limit, offset]),
      query(countQuery, filter.values),
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

    const result = await query(
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

    const insert = await query(
      `INSERT INTO employees (
         full_name, position, region_id, district_id, score,
         konstitutsiya_score, kodeks_score, protsessual_kodeks_score, akt_sohasi_score, odob_axloq_score,
         konstitutsiya_status, kodeks_status, protsessual_kodeks_status, akt_sohasi_status, odob_axloq_status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        value.full_name,
        value.position,
        value.region_id,
        value.district_id,
        examPayload.score,
        examPayload.konstitutsiya_score,
        examPayload.kodeks_score,
        examPayload.protsessual_kodeks_score,
        examPayload.akt_sohasi_score,
        examPayload.odob_axloq_score,
        examPayload.konstitutsiya_status,
        examPayload.kodeks_status,
        examPayload.protsessual_kodeks_status,
        examPayload.akt_sohasi_status,
        examPayload.odob_axloq_status,
      ]
    );

    res.status(201).json(insert.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticateToken, permit('super_admin', 'admin'), async (req, res, next) => {
  try {
    const { error, value } = employeeSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const employeeResult = await query('SELECT region_id FROM employees WHERE id = $1', [req.params.id]);
    if (!employeeResult.rows.length) return res.status(404).json({ error: 'Xodim topilmadi' });

    const currentRegion = employeeResult.rows[0].region_id;
    const newRegion = value.region_id;

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

    const update = await query(
      `UPDATE employees
       SET full_name = $1, position = $2, region_id = $3, district_id = $4, score = $5,
           konstitutsiya_score = $6, kodeks_score = $7, protsessual_kodeks_score = $8, akt_sohasi_score = $9, odob_axloq_score = $10,
           konstitutsiya_status = $11, kodeks_status = $12, protsessual_kodeks_status = $13, akt_sohasi_status = $14, odob_axloq_status = $15,
           updated_at = NOW()
       WHERE id = $16
       RETURNING *`,
      [
        value.full_name,
        value.position,
        value.region_id,
        value.district_id,
        examPayload.score,
        examPayload.konstitutsiya_score,
        examPayload.kodeks_score,
        examPayload.protsessual_kodeks_score,
        examPayload.akt_sohasi_score,
        examPayload.odob_axloq_score,
        examPayload.konstitutsiya_status,
        examPayload.kodeks_status,
        examPayload.protsessual_kodeks_status,
        examPayload.akt_sohasi_status,
        examPayload.odob_axloq_status,
        req.params.id,
      ]
    );

    res.json(update.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticateToken, permit('super_admin', 'admin'), async (req, res, next) => {
  try {
    const employeeResult = await query('SELECT region_id FROM employees WHERE id = $1', [req.params.id]);
    if (!employeeResult.rows.length) return res.status(404).json({ error: 'Xodim topilmadi' });

    if (req.user.role === 'admin' && !req.user.assigned_regions.includes(employeeResult.rows[0].region_id)) {
      return res.status(403).json({ error: 'Siz bu xodimni o‘chira olmaysiz' });
    }

    await query('DELETE FROM employees WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
