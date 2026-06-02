import express from 'express';
import { query } from '../db.js';
import { authenticateToken, permit } from '../middleware/auth.js';
import { criteriaSchema } from '../validators.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const result = await query('SELECT id, key, label, short_label, sort_order FROM criteria ORDER BY sort_order, id');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    const { error, value } = criteriaSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const insert = await query(
      'INSERT INTO criteria (key, label, short_label, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [value.key, value.label, value.short_label, value.sort_order]
    );

    res.status(201).json(insert.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    const { error, value } = criteriaSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const update = await query(
      `UPDATE criteria SET key = $1, label = $2, short_label = $3, sort_order = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [value.key, value.label, value.short_label, value.sort_order, req.params.id]
    );

    if (!update.rows.length) return res.status(404).json({ error: 'Kriteriya topilmadi' });
    res.json(update.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    const del = await query('DELETE FROM criteria WHERE id = $1 RETURNING *', [req.params.id]);
    if (!del.rows.length) return res.status(404).json({ error: 'Kriteriya topilmadi' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
