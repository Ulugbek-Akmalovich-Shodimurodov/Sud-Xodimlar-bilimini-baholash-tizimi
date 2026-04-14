import express from 'express';
import { query } from '../db.js';
import { authenticateToken, permit } from '../middleware/auth.js';
import { positionSchema } from '../validators.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM positions ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    const { error, value } = positionSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const result = await query('INSERT INTO positions (name) VALUES ($1) RETURNING *', [value.name]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    const { error, value } = positionSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const result = await query('UPDATE positions SET name = $1 WHERE id = $2 RETURNING *', [value.name, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Lavozim topilmadi' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    await query('DELETE FROM positions WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
