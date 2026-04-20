import express from 'express';
import { query } from '../db.js';
import { authenticateToken, permit } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    
    const filters = [];
    const values = [];
    let index = 1;

    if (req.query.action) {
      filters.push(`action = $${index++}`);
      values.push(req.query.action);
    }

    if (req.query.entity_type) {
      filters.push(`entity_type = $${index++}`);
      values.push(req.query.entity_type);
    }

    if (req.query.admin_username) {
      filters.push(`admin_username ILIKE $${index++}`);
      values.push(`%${req.query.admin_username}%`);
    }

    if (req.query.date_from) {
      filters.push(`DATE(created_at) >= $${index++}`);
      values.push(req.query.date_from);
    }

    if (req.query.date_to) {
      filters.push(`DATE(created_at) <= $${index++}`);
      values.push(req.query.date_to);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const listQuery = `
      SELECT * FROM admin_logs 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${index++} OFFSET $${index++}
    `;

    const countQuery = `SELECT COUNT(*) AS total FROM admin_logs ${whereClause}`;

    const [list, count] = await Promise.all([
      query(listQuery, [...values, limit, offset]),
      query(countQuery, values),
    ]);

    res.json({ 
      data: list.rows, 
      total: Number(count.rows[0].total), 
      page, 
      limit 
    });
  } catch (err) {
    next(err);
  }
});

router.get('/stats', authenticateToken, permit('super_admin'), async (req, res, next) => {
  try {
    const stats = await Promise.all([
      query('SELECT COUNT(*) as total_logs FROM admin_logs'),
      query('SELECT action, COUNT(*) as count FROM admin_logs GROUP BY action'),
      query('SELECT entity_type, COUNT(*) as count FROM admin_logs GROUP BY entity_type'),
      query('SELECT admin_username, COUNT(*) as count FROM admin_logs GROUP BY admin_username ORDER BY count DESC LIMIT 5'),
      query('SELECT DATE(created_at) as date, COUNT(*) as count FROM admin_logs WHERE created_at >= NOW() - INTERVAL \'7 days\' GROUP BY DATE(created_at) ORDER BY date'),
    ]);

    res.json({
      total_logs: Number(stats[0].rows[0].total_logs),
      actions: stats[1].rows,
      entities: stats[2].rows,
      top_admins: stats[3].rows,
      weekly_activity: stats[4].rows,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
