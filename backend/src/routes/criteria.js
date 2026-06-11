import express from 'express';
import { query } from '../db.js';
import { authenticateToken, permit } from '../middleware/auth.js';
import { criteriaSchema } from '../validators.js';

const router = express.Router();

async function ensureCriteriaTable() {
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
}

async function ensureCriterionSectionsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS criterion_sections (
      id SERIAL PRIMARY KEY,
      criterion_id INTEGER NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      label TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
      UNIQUE (criterion_id, key)
    )
  `);
}

function buildCriteriaTree(rows) {
  const tree = [];
  const map = new Map();

  rows.forEach((row) => {
    if (!map.has(row.criterion_id)) {
      const criterion = {
        id: row.criterion_id,
        key: row.criterion_key,
        label: row.criterion_label,
        short_label: row.short_label,
        sort_order: row.criterion_sort,
        sections: [],
      };
      map.set(row.criterion_id, criterion);
      tree.push(criterion);
    }

    if (row.section_id) {
      map.get(row.criterion_id).sections.push({
        id: row.section_id,
        key: row.section_key,
        label: row.section_label,
        sort_order: row.section_sort,
      });
    }
  });

  return tree;
}

function sanitizeSectionKey(label, index) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40) || `section_${index}`;
}

async function insertCriterionSections(criterionId, sections) {
  if (!Array.isArray(sections) || !sections.length) return;

  for (let i = 0; i < sections.length; i += 1) {
    const section = sections[i];
    const key = section.key || sanitizeSectionKey(section.label, i + 1);
    await query(
      'INSERT INTO criterion_sections (criterion_id, key, label, sort_order) VALUES ($1, $2, $3, $4)',
      [criterionId, key, section.label, section.sort_order]
    );
  }
}

router.get('/', async (req, res, next) => {
  try {
    const tableCheck = await query("SELECT to_regclass('public.criteria') AS exists");
    if (!tableCheck.rows[0]?.exists) {
      return res.json([]);
    }

    const result = await query(`
      SELECT c.id AS criterion_id,
             c.key AS criterion_key,
             c.label AS criterion_label,
             c.short_label,
             c.sort_order AS criterion_sort,
             s.id AS section_id,
             s.key AS section_key,
             s.label AS section_label,
             s.sort_order AS section_sort
      FROM criteria c
      LEFT JOIN criterion_sections s ON s.criterion_id = c.id
      ORDER BY c.sort_order, c.id, s.sort_order, s.id
    `);

    res.json(buildCriteriaTree(result.rows));
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    const { error, value } = criteriaSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    await ensureCriteriaTable();
    await ensureCriterionSectionsTable();

    const insert = await query(
      'INSERT INTO criteria (key, label, short_label, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [value.key, value.label, value.short_label, value.sort_order]
    );

    await insertCriterionSections(insert.rows[0].id, value.sections || []);

    const created = await query('SELECT * FROM criteria WHERE id = $1', [insert.rows[0].id]);
    res.status(201).json(created.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    const { error, value } = criteriaSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    await ensureCriteriaTable();
    await ensureCriterionSectionsTable();

    const update = await query(
      `UPDATE criteria SET key = $1, label = $2, short_label = $3, sort_order = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [value.key, value.label, value.short_label, value.sort_order, req.params.id]
    );

    if (!update.rows.length) return res.status(404).json({ error: 'Kriteriya topilmadi' });

    if (Array.isArray(value.sections)) {
      await query('DELETE FROM criterion_sections WHERE criterion_id = $1', [req.params.id]);
      await insertCriterionSections(req.params.id, value.sections);
    }

    res.json(update.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    await ensureCriteriaTable();
    const del = await query('DELETE FROM criteria WHERE id = $1 RETURNING *', [req.params.id]);
    if (!del.rows.length) return res.status(404).json({ error: 'Kriteriya topilmadi' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
