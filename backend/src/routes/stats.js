import express from 'express';
import { query } from '../db.js';
import { optionalAuthenticateToken } from '../middleware/auth.js';

const router = express.Router();

function roundToOneDecimal(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 0;
  return Number(parsed.toFixed(1));
}

function normalizeAverageRows(rows) {
  return rows.map((row) => ({
    ...row,
    employee_count: Number(row.employee_count),
    average_score: roundToOneDecimal(row.average_score),
  }));
}

function buildStatsAccess(user, startIndex = 1) {
  if (user?.role !== 'admin') {
    return { clause: '', values: [], nextIndex: startIndex };
  }

  const assigned = Array.isArray(user.assigned_regions) ? user.assigned_regions : [];
  if (!assigned.length) {
    return { clause: 'WHERE 1 = 0', values: [], nextIndex: startIndex };
  }

  return {
    clause: `WHERE employees.region_id = ANY($${startIndex})`,
    values: [assigned],
    nextIndex: startIndex + 1,
  };
}

router.get('/top', optionalAuthenticateToken, async (req, res, next) => {
  try {
    const access = buildStatsAccess(req.user, 1);
    const best = await query(
      `SELECT full_name, position, score, region_id, district_id
       FROM employees
       ${access.clause}
       ORDER BY score DESC, full_name
       LIMIT 5`,
      access.values
    );
    const worst = await query(
      `SELECT full_name, position, score, region_id, district_id
       FROM employees
       ${access.clause}
       ORDER BY score ASC, full_name
       LIMIT 5`,
      access.values
    );
    res.json({ best: best.rows, worst: worst.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/regions', optionalAuthenticateToken, async (req, res, next) => {
  try {
    if (req.user?.role === 'admin') {
      const assigned = Array.isArray(req.user.assigned_regions) ? req.user.assigned_regions : [];
      if (!assigned.length) return res.json([]);

      const result = await query(
        `SELECT regions.id, regions.name,
          COUNT(employees.id) AS employee_count,
          COALESCE(AVG(employees.score), 0) AS average_score
         FROM regions
         LEFT JOIN employees ON employees.region_id = regions.id
         WHERE regions.id = ANY($1)
         GROUP BY regions.id
         ORDER BY regions.name`,
        [assigned]
      );
      return res.json(normalizeAverageRows(result.rows));
    }

    const result = await query(
      `SELECT regions.id, regions.name,
         COUNT(employees.id) AS employee_count,
         COALESCE(AVG(employees.score), 0) AS average_score
       FROM regions
       LEFT JOIN employees ON employees.region_id = regions.id
       GROUP BY regions.id
       ORDER BY regions.name`
    );
    res.json(normalizeAverageRows(result.rows));
  } catch (err) {
    next(err);
  }
});

router.get('/districts', optionalAuthenticateToken, async (req, res, next) => {
  try {
    let accessClause = '';
    let accessValues = [];

    if (req.user?.role === 'admin') {
      const assigned = Array.isArray(req.user.assigned_regions) ? req.user.assigned_regions : [];
      if (!assigned.length) return res.json([]);
      accessClause = 'WHERE districts.region_id = ANY($1)';
      accessValues = [assigned];
    }

    const result = await query(
      `SELECT districts.id, districts.name, districts.region_id,
        COUNT(employees.id) AS employee_count,
        COALESCE(AVG(employees.score), 0) AS average_score
       FROM districts
       LEFT JOIN employees ON employees.district_id = districts.id
       ${accessClause}
       GROUP BY districts.id
       ORDER BY districts.name`,
      accessValues
    );
    res.json(normalizeAverageRows(result.rows));
  } catch (err) {
    next(err);
  }
});

router.get('/summary', optionalAuthenticateToken, async (req, res, next) => {
  try {
    const access = buildStatsAccess(req.user, 1);
    const result = await query(
      `SELECT COUNT(*) AS total_employees, COALESCE(AVG(score), 0) AS average_score
       FROM employees
       ${access.clause}`,
      access.values
    );
    const summary = result.rows[0];
    res.json({
      total_employees: Number(summary.total_employees),
      average_score: roundToOneDecimal(summary.average_score),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
