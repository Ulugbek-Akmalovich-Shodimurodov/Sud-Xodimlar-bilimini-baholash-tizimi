import express from 'express';
import { query } from '../db.js';
import { authenticateToken, optionalAuthenticateToken, permit } from '../middleware/auth.js';
import { districtSchema } from '../validators.js';
import { logAdminAction, getEntityName, getClientInfo } from '../utils/logger.js';

const router = express.Router();

router.get('/', optionalAuthenticateToken, async (req, res, next) => {
  try {
    const filters = [];
    const values = [];
    let index = 1;

    if (req.query.region_id) {
      filters.push(`region_id = $${index++}`);
      values.push(req.query.region_id);
    }

    if (req.user?.role === 'admin') {
      const assigned = Array.isArray(req.user.assigned_regions) ? req.user.assigned_regions : [];
      if (!assigned.length) return res.json([]);
      filters.push(`region_id = ANY($${index++})`);
      values.push(assigned);
    }

    const result = await query(
      `SELECT * FROM districts ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''} ORDER BY name`,
      values
    );
    // Log the action
    const clientInfo = getClientInfo(req);
    await logAdminAction({
      adminId: req.user?.id,
      adminUsername: req.user?.username,
      action: 'READ',
      entityType: 'district',
      entityId: null,
      entityName: null,
      oldData: null,
      newData: null,
      ...clientInfo,
    });

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    const { error, value } = districtSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const insert = await query('INSERT INTO districts (name, region_id) VALUES ($1, $2) RETURNING *', [value.name, value.region_id]);
    // Log the action
    const clientInfo = getClientInfo(req);
    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'CREATE',
      entityType: 'district',
      entityId: insert.rows[0].id,
      entityName: getEntityName('district', insert.rows[0]),
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
    const { error, value } = districtSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const oldData = await query('SELECT * FROM districts WHERE id = $1', [req.params.id]);
    const update = await query(
      'UPDATE districts SET name = $1, region_id = $2 WHERE id = $3 RETURNING *',
      [value.name, value.region_id, req.params.id]
    );
    if (!update.rows.length) return res.status(404).json({ error: 'Tuman topilmadi' });
    // Log the action
    const clientInfo = getClientInfo(req);
    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'UPDATE',
      entityType: 'district',
      entityId: update.rows[0].id,
      entityName: getEntityName('district', update.rows[0]),
      oldData: oldData.rows[0],
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
    const employeeCount = await query('SELECT COUNT(*) AS total FROM employees WHERE district_id = $1', [req.params.id]);
    if (Number(employeeCount.rows[0].total) > 0) {
      return res.status(400).json({ error: 'Bu tumanda hali xodimlar mavjud. Avval ularni boshqa tumanga o‘tkazing yoki o‘chiring.' });
    }

    // Get district data for logging before deletion
    const districtResult = await query('SELECT * FROM districts WHERE id = $1', [req.params.id]);
    const districtData = districtResult.rows[0];
    if (!districtData) return res.status(404).json({ error: 'Tuman topilmadi' });

    await query('DELETE FROM districts WHERE id = $1', [req.params.id]);

    // Log the action
    const clientInfo = getClientInfo(req);
    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'DELETE',
      entityType: 'district',
      entityId: districtData.id,
      entityName: getEntityName('district', districtData),
      oldData: districtData,
      ...clientInfo,
    });

    res.status(204).end();
  } catch (err) {
    if (err.code === '23503' || err.message?.includes('NULL v stolbce "district_id"') || err.message?.includes('district_id')) {
      return res.status(400).json({ error: 'Bu tumanda hali xodimlar mavjud. Avval ularni boshqa tumanga o‘tkazing yoki o‘chiring.' });
    }
    next(err);
  }
});

export default router;
