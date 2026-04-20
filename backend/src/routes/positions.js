import express from 'express';
import { query } from '../db.js';
import { authenticateToken, permit } from '../middleware/auth.js';
import { positionSchema } from '../validators.js';
import { logAdminAction, getEntityName, getClientInfo } from '../utils/logger.js';

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
    // Log the action
    const clientInfo = getClientInfo(req);
    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'CREATE',
      entityType: 'position',
      entityId: result.rows[0].id,
      entityName: getEntityName('position', result.rows[0]),
      newData: result.rows[0],
      ...clientInfo,
    });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    const { error, value } = positionSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const oldData = await query('SELECT * FROM positions WHERE id = $1', [req.params.id]);
    const result = await query('UPDATE positions SET name = $1 WHERE id = $2 RETURNING *', [value.name, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Lavozim topilmadi' });
    // Log the action
    const clientInfo = getClientInfo(req);
    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'UPDATE',
      entityType: 'position',
      entityId: result.rows[0].id,
      entityName: getEntityName('position', result.rows[0]),
      oldData: oldData.rows[0],
      newData: result.rows[0],
      ...clientInfo,
    });

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    // Get position data for logging before deletion
    const positionResult = await query('SELECT * FROM positions WHERE id = $1', [req.params.id]);
    const positionData = positionResult.rows[0];
    if (!positionData) return res.status(404).json({ error: 'Lavozim topilmadi' });

    await query('DELETE FROM positions WHERE id = $1', [req.params.id]);

    // Log the action
    const clientInfo = getClientInfo(req);
    await logAdminAction({
      adminId: req.user.id,
      adminUsername: req.user.username,
      action: 'DELETE',
      entityType: 'position',
      entityId: positionData.id,
      entityName: getEntityName('position', positionData),
      oldData: positionData,
      ...clientInfo,
    });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
