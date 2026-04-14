import express from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db.js';
import { authenticateToken, permit } from '../middleware/auth.js';
import { adminSchema, adminUpdateSchema } from '../validators.js';

const router = express.Router();
const SALT_ROUNDS = 10;

router.get('/', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    const result = await query('SELECT id, username, role, assigned_regions FROM admins ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    const { error, value } = adminSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const assignedRegions = Array.isArray(value.assigned_regions)
      ? value.assigned_regions.map((item) => Number(item)).filter((item) => Number.isFinite(item))
      : [];

    const hashedPassword = await bcrypt.hash(value.password, SALT_ROUNDS);
    const insert = await query(
      'INSERT INTO admins (username, password, role, assigned_regions) VALUES ($1, $2, $3, $4::jsonb) RETURNING id, username, role, assigned_regions',
      [value.username, hashedPassword, value.role, JSON.stringify(assignedRegions)]
    );

    res.status(201).json(insert.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    const { error, value } = adminUpdateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const assignedRegions = Array.isArray(value.assigned_regions)
      ? value.assigned_regions.map((item) => Number(item)).filter((item) => Number.isFinite(item))
      : [];

    const passwordToSave = value.password
      ? await bcrypt.hash(value.password, SALT_ROUNDS)
      : (await query('SELECT password FROM admins WHERE id = $1', [req.params.id])).rows[0]?.password;

    const update = await query(
      'UPDATE admins SET username = $1, password = $2, role = $3, assigned_regions = $4::jsonb WHERE id = $5 RETURNING id, username, role, assigned_regions',
      [value.username, passwordToSave, value.role, JSON.stringify(assignedRegions), req.params.id]
    );
    if (!update.rows.length) return res.status(404).json({ error: 'Admin topilmadi' });
    res.json(update.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    if (req.user.id === Number(req.params.id)) {
      return res.status(403).json({ error: 'O‘zini o‘chirish mumkin emas' });
    }

    await query('DELETE FROM admins WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
