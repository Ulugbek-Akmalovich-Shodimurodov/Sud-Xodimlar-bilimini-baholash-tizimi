import express from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db.js';
import { authenticateToken, permit } from '../middleware/auth.js';
import { adminSchema, adminUpdateSchema } from '../validators.js';
import { logAdminAction, getEntityName, getClientInfo } from '../utils/logger.js';

const router = express.Router();
const SALT_ROUNDS = 10;

async function activeSuperAdminCount(excludeId = null) {
  const result = excludeId
    ? await query(
      "SELECT COUNT(*) AS total FROM admins WHERE role = 'super_admin' AND status = 'active' AND id <> $1",
      [excludeId]
    )
    : await query("SELECT COUNT(*) AS total FROM admins WHERE role = 'super_admin' AND status = 'active'");
  return Number(result.rows[0]?.total || 0);
}

function normalizeRegions(value, role) {
  if (role === 'super_admin') return [];
  return Array.isArray(value)
    ? [...new Set(value.map((item) => Number(item)).filter((item) => Number.isFinite(item)))]
    : [];
}

async function assertSuperAdminSafety({ targetId, actorId, nextRole, nextStatus, operation }) {
  const current = await query('SELECT id, username, role, status FROM admins WHERE id = $1', [targetId]);
  const admin = current.rows[0];
  if (!admin) return null;

  if (operation === 'delete' && Number(targetId) === Number(actorId)) {
    const err = new Error("O'zingizni o'chira olmaysiz");
    err.status = 400;
    throw err;
  }

  if (Number(targetId) === Number(actorId) && nextStatus === 'blocked') {
    const err = new Error("O'zingizni bloklay olmaysiz");
    err.status = 400;
    throw err;
  }

  const removesActiveSuperAdmin = admin.role === 'super_admin'
    && admin.status === 'active'
    && (
      operation === 'delete'
      || nextRole !== 'super_admin'
      || nextStatus === 'blocked'
    );

  if (removesActiveSuperAdmin && await activeSuperAdminCount(targetId) === 0) {
    const err = new Error("Oxirgi faol super adminni o'chirish, bloklash yoki oddiy admin qilish mumkin emas");
    err.status = 400;
    throw err;
  }

  return admin;
}

router.get('/', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        admins.id,
        admins.username,
        admins.role,
        admins.assigned_regions,
        admins.status,
        admins.last_login_at,
        admins.created_at,
        admins.updated_at,
        COUNT(admin_logs.id) AS activity_count
      FROM admins
      LEFT JOIN admin_logs ON admin_logs.admin_id = admins.id
      GROUP BY admins.id
      ORDER BY admins.id
    `);

    res.json(result.rows.map((admin) => ({
      ...admin,
      activity_count: Number(admin.activity_count || 0),
    })));
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    const { error, value } = adminSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const assignedRegions = normalizeRegions(value.assigned_regions, value.role);
    const hashedPassword = await bcrypt.hash(value.password, SALT_ROUNDS);
    const insert = await query(
      `INSERT INTO admins (username, password, role, assigned_regions, status)
       VALUES ($1, $2, $3, $4::jsonb, $5)
       RETURNING id, username, role, assigned_regions, status, last_login_at, created_at, updated_at`,
      [value.username, hashedPassword, value.role, JSON.stringify(assignedRegions), value.status || 'active']
    );

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
    const oldAdminResult = await query(
      'SELECT id, username, role, assigned_regions, status, last_login_at, created_at, updated_at FROM admins WHERE id = $1',
      [req.params.id]
    );
    const oldData = oldAdminResult.rows[0];
    if (!oldData) return res.status(404).json({ error: 'Admin topilmadi' });

    const { error, value } = adminUpdateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    await assertSuperAdminSafety({
      targetId: req.params.id,
      actorId: req.user.id,
      nextRole: value.role,
      nextStatus: value.status || 'active',
      operation: 'update',
    });

    const assignedRegions = normalizeRegions(value.assigned_regions, value.role);
    const passwordToSave = value.password
      ? await bcrypt.hash(value.password, SALT_ROUNDS)
      : (await query('SELECT password FROM admins WHERE id = $1', [req.params.id])).rows[0]?.password;

    const update = await query(
      `UPDATE admins
       SET username = $1, password = $2, role = $3, assigned_regions = $4::jsonb, status = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING id, username, role, assigned_regions, status, last_login_at, created_at, updated_at`,
      [
        value.username,
        passwordToSave,
        value.role,
        JSON.stringify(assignedRegions),
        value.status || 'active',
        req.params.id,
      ]
    );
    if (!update.rows.length) return res.status(404).json({ error: 'Admin topilmadi' });

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

router.put('/:id/password', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    const password = String(req.body?.password || '');
    if (password.length < 6) {
      return res.status(400).json({ error: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' });
    }

    const oldAdminResult = await query(
      'SELECT id, username, role, assigned_regions, status FROM admins WHERE id = $1',
      [req.params.id]
    );
    const oldData = oldAdminResult.rows[0];
    if (!oldData) return res.status(404).json({ error: 'Admin topilmadi' });

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const update = await query(
      `UPDATE admins SET password = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, username, role, assigned_regions, status, last_login_at, created_at, updated_at`,
      [hashedPassword, req.params.id]
    );

    const clientInfo = getClientInfo(req);
    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'UPDATE',
      entityType: 'admin',
      entityId: update.rows[0].id,
      entityName: getEntityName('admin', update.rows[0]),
      changeDescription: 'Parol yangilandi',
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
    const adminData = await assertSuperAdminSafety({
      targetId: req.params.id,
      actorId: req.user.id,
      nextRole: null,
      nextStatus: null,
      operation: 'delete',
    });
    if (!adminData) return res.status(404).json({ error: 'Admin topilmadi' });

    await query('DELETE FROM admins WHERE id = $1', [req.params.id]);

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
