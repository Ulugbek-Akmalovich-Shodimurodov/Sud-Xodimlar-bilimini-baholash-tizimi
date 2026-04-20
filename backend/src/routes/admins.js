import express from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db.js';
import { authenticateToken, permit } from '../middleware/auth.js';
import { adminSchema, adminUpdateSchema } from '../validators.js';
import { logAdminAction, getEntityName, getClientInfo } from '../utils/logger.js';

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

    // Log the action
    const clientInfo = getClientInfo(req);
    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'CREATE',
      entityType: 'admin',
      entityId: insert.rows[0].id,
      entityName: getEntityName('admin', insert.rows[0]),
      newData: insert.rows[0],
      ...clientInfo,
    });

    res.status(201).json(insert.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    // Get old data for logging
    const oldAdminResult = await query('SELECT id, username, role, assigned_regions FROM admins WHERE id = $1', [req.params.id]);
    const oldData = oldAdminResult.rows[0];
    if (!oldData) return res.status(404).json({ error: 'Admin topilmadi' });

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
    // Log the action
    const clientInfo = getClientInfo(req);
    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'UPDATE',
      entityType: 'admin',
      entityId: update.rows[0].id,
      entityName: getEntityName('admin', update.rows[0]),
      oldData,
      newData: update.rows[0],
      ...clientInfo,
    });

    res.json(update.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    // Get admin data for logging before deletion
    const adminResult = await query('SELECT id, username, role, assigned_regions FROM admins WHERE id = $1', [req.params.id]);
    const adminData = adminResult.rows[0];
    if (!adminData) return res.status(404).json({ error: 'Admin topilmadi' });

    await query('DELETE FROM admins WHERE id = $1', [req.params.id]);

    // Log the action
    const clientInfo = getClientInfo(req);
    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'DELETE',
      entityType: 'admin',
      entityId: adminData.id,
      entityName: getEntityName('admin', adminData),
      oldData: adminData,
      ...clientInfo,
    });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
