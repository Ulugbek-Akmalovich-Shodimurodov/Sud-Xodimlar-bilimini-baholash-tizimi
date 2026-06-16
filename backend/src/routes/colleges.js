import express from 'express';
import { query } from '../db.js';
import { authenticateToken, permit } from '../middleware/auth.js';
import { collegeSchema } from '../validators.js';
import { logAdminAction, getEntityName, getClientInfo } from '../utils/logger.js';

const router = express.Router();

async function ensureCollegeTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS criteria (
      id SERIAL PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      short_label TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS colleges (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS college_criteria (
      college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
      criterion_id INTEGER NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
      PRIMARY KEY (college_id, criterion_id)
    )
  `);

  await query('ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS college_id INTEGER REFERENCES colleges(id) ON DELETE SET NULL');
}

function normalizeCriteriaIds(ids) {
  return Array.isArray(ids)
    ? [...new Set(ids.map((item) => Number(item)).filter((item) => Number.isInteger(item)))]
    : [];
}

async function setCollegeCriteria(collegeId, criteriaIds) {
  const normalized = normalizeCriteriaIds(criteriaIds);
  await query('DELETE FROM college_criteria WHERE college_id = $1', [collegeId]);

  for (const criterionId of normalized) {
    await query(
      'INSERT INTO college_criteria (college_id, criterion_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [collegeId, criterionId]
    );
  }
}

async function fetchCollegeById(id) {
  const result = await query(
    `SELECT c.*,
       COALESCE(
         json_agg(cc.criterion_id ORDER BY cr.sort_order, cr.id) FILTER (WHERE cc.criterion_id IS NOT NULL),
         '[]'
       ) AS criteria_ids
     FROM colleges c
     LEFT JOIN college_criteria cc ON cc.college_id = c.id
     LEFT JOIN criteria cr ON cr.id = cc.criterion_id
     WHERE c.id = $1
     GROUP BY c.id`,
    [id]
  );
  return result.rows[0] || null;
}

router.get('/', async (req, res, next) => {
  try {
    await ensureCollegeTables();
    const result = await query(`
      SELECT c.*,
        COALESCE(
          json_agg(cc.criterion_id ORDER BY cr.sort_order, cr.id) FILTER (WHERE cc.criterion_id IS NOT NULL),
          '[]'
        ) AS criteria_ids,
        COUNT(DISTINCT e.id) AS employee_count
      FROM colleges c
      LEFT JOIN college_criteria cc ON cc.college_id = c.id
      LEFT JOIN criteria cr ON cr.id = cc.criterion_id
      LEFT JOIN employees e ON e.college_id = c.id
      GROUP BY c.id
      ORDER BY c.name
    `);

    res.json(result.rows.map((row) => ({
      ...row,
      employee_count: Number(row.employee_count),
    })));
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    const { error, value } = collegeSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    await ensureCollegeTables();

    const insert = await query(
      'INSERT INTO colleges (name, description) VALUES ($1, $2) RETURNING *',
      [value.name, value.description || null]
    );

    await setCollegeCriteria(insert.rows[0].id, value.criteria_ids);
    const created = await fetchCollegeById(insert.rows[0].id);

    const clientInfo = getClientInfo(req);
    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'CREATE',
      entityType: 'college',
      entityId: created.id,
      entityName: getEntityName('college', created),
      newData: created,
      ...clientInfo,
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    const { error, value } = collegeSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    await ensureCollegeTables();
    const oldData = await fetchCollegeById(req.params.id);
    if (!oldData) return res.status(404).json({ error: 'Kollega topilmadi' });

    const update = await query(
      'UPDATE colleges SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [value.name, value.description || null, req.params.id]
    );
    if (!update.rows.length) return res.status(404).json({ error: 'Kollega topilmadi' });

    await setCollegeCriteria(req.params.id, value.criteria_ids);
    const updated = await fetchCollegeById(req.params.id);

    const clientInfo = getClientInfo(req);
    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'UPDATE',
      entityType: 'college',
      entityId: updated.id,
      entityName: getEntityName('college', updated),
      oldData,
      newData: updated,
      ...clientInfo,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    await ensureCollegeTables();
    const oldData = await fetchCollegeById(req.params.id);
    if (!oldData) return res.status(404).json({ error: 'Kollega topilmadi' });

    await query('DELETE FROM colleges WHERE id = $1', [req.params.id]);

    const clientInfo = getClientInfo(req);
    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'DELETE',
      entityType: 'college',
      entityId: oldData.id,
      entityName: getEntityName('college', oldData),
      oldData,
      ...clientInfo,
    });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
