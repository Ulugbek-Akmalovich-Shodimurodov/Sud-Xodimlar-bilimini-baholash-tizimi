import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { query } from '../db.js';
import { hasPermission, normalizePermissions } from '../permissions.js';

dotenv.config();

const SECRET = process.env.JWT_SECRET;
if (!SECRET || typeof SECRET !== 'string') {
  throw new Error('JWT_SECRET muhit o\'zgarmasini backend/.env faylida belgilang.');
}

async function loadAdminFromToken(req, res, next, optional = false) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return optional ? next() : res.status(401).json({ error: 'Token talab qilinadi' });
  }

  let payload;
  try {
    payload = jwt.verify(token, SECRET);
  } catch (err) {
    return res.status(403).json({ error: "Noto'g'ri token" });
  }

  const admin = await query(
    'SELECT id, username, role, assigned_regions, permissions, status FROM admins WHERE id = $1',
    [payload.id]
  );
  if (!admin.rows.length) {
    return res.status(401).json({ error: 'Admin topilmadi' });
  }
  if (admin.rows[0].status === 'blocked') {
    return res.status(403).json({ error: 'Admin bloklangan' });
  }
  // Normalize assigned_regions to an array of numbers and normalize permissions
  const row = admin.rows[0];
  row.assigned_regions = Array.isArray(row.assigned_regions)
    ? row.assigned_regions.map((r) => Number(r)).filter((n) => Number.isFinite(n))
    : [];
  row.permissions = normalizePermissions(row.permissions, row.role);

  req.user = row;
  return next();
}

export async function authenticateToken(req, res, next) {
  return loadAdminFromToken(req, res, next, false);
}

export async function optionalAuthenticateToken(req, res, next) {
  return loadAdminFromToken(req, res, next, true);
}

export function permit(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Token talab qilinadi' });
    }

    const { role } = req.user;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ error: "Ruxsat yo'q" });
    }
    next();
  };
}

export function permitPermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Token talab qilinadi' });
    }

    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({ error: "Bu amal uchun ruxsat yo'q" });
    }

    next();
  };
}

export function regionGuard(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Token talab qilinadi' });
  }

  const { role, assigned_regions } = req.user;
  if (role === 'super_admin') return next();

  const regionId = Number(req.body.region_id || req.query.region_id || req.params.region_id);
  const assigned = Array.isArray(assigned_regions) ? assigned_regions : [];

  if (regionId && !assigned.includes(regionId)) {
    return res.status(403).json({ error: 'Siz faqat o\'z hududingizni boshqarishingiz mumkin' });
  }

  next();
}
