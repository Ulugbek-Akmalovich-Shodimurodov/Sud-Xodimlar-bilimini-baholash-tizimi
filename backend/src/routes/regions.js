import express from 'express';
import { query } from '../db.js';
import { authenticateToken, optionalAuthenticateToken, permit } from '../middleware/auth.js';
import { regionSchema } from '../validators.js';
import { logAdminAction, getEntityName, getClientInfo } from '../utils/logger.js';

const router = express.Router();

router.get('/', optionalAuthenticateToken, async (req, res, next) => {
  try {
    if (req.user?.role === 'admin') {
      const assigned = Array.isArray(req.user.assigned_regions) ? req.user.assigned_regions : [];
      if (!assigned.length) return res.json([]);
      const result = await query('SELECT * FROM regions WHERE id = ANY($1) ORDER BY name', [assigned]);
      // Log the action
      const clientInfo = getClientInfo(req);
      await logAdminAction({
        adminId: req.user?.id,
        adminUsername: req.user?.username,
        action: 'READ',
        entityType: 'region',
        entityId: null,
        entityName: 'Regions',
        ...clientInfo,
      });
      return res.json(result.rows);
    }

    const result = await query('SELECT * FROM regions ORDER BY name');
    // Log the action
    const clientInfo = getClientInfo(req);
    await logAdminAction({
      adminId: req.user?.id,
      adminUsername: req.user?.username,
      action: 'READ',
      entityType: 'region',
      entityId: null,
      entityName: 'Regions',
      ...clientInfo,
    });
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    const { error, value } = regionSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const insert = await query('INSERT INTO regions (name) VALUES ($1) RETURNING *', [value.name]);
    // Log the action
    const clientInfo = getClientInfo(req);
    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'CREATE',
      entityType: 'region',
      entityId: insert.rows[0].id,
      entityName: getEntityName('region', insert.rows[0]),
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
    const { error, value } = regionSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const regionId = Number(req.params.id);
    const oldRegionResult = await query('SELECT * FROM regions WHERE id = $1', [regionId]);
    const oldRegionData = oldRegionResult.rows[0];
    if (!oldRegionData) return res.status(404).json({ error: 'Viloyat topilmadi' });

    const update = await query('UPDATE regions SET name = $1 WHERE id = $2 RETURNING *', [value.name, req.params.id]);
    // Log the action
    const clientInfo = getClientInfo(req);
    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'UPDATE',
      entityType: 'region',
      entityId: update.rows[0].id,
      entityName: getEntityName('region', update.rows[0]),
      oldData: oldRegionData,
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
    const regionId = Number(req.params.id);
    if (!Number.isInteger(regionId) || regionId <= 0) {
      return res.status(400).json({ error: 'Noto`g`ri viloyat identifikatori' });
    }

    const [districtCount, employeeCount] = await Promise.all([
      query('SELECT COUNT(*) AS total FROM districts WHERE region_id = $1', [regionId]),
      query('SELECT COUNT(*) AS total FROM employees WHERE region_id = $1', [regionId]),
    ]);

    if (Number(districtCount.rows[0].total) > 0 || Number(employeeCount.rows[0].total) > 0) {
      return res.status(400).json({
        error: 'Bu viloyatda bog`liq tumanlar yoki xodimlar mavjud. Avval ularni o`chiring yoki boshqa viloyatga ko`chiring.',
      });
    }

    const deleted = await query('DELETE FROM regions WHERE id = $1 RETURNING id', [regionId]);
    if (!deleted.rows.length) {
      return res.status(404).json({ error: 'Viloyat topilmadi' });
    }

    res.status(204).end();
  } catch (err) {
    if (err.code === '23502' || err.code === '23503') {
      return res.status(400).json({
        error: 'Bu viloyatda bog`liq tumanlar yoki xodimlar mavjud. Avval ularni o`chiring yoki boshqa viloyatga ko`chiring.',
      });
    }
    next(err);
  }
});

export default router;
