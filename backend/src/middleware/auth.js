import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { query } from '../db.js';

dotenv.config();

const SECRET = process.env.JWT_SECRET;
if (!SECRET || typeof SECRET !== 'string') {
  throw new Error('JWT_SECRET muhit o\'zgarmasini backend/.env faylida belgilang.');
}

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token talab qilinadi' });
  }

  let payload;
  try {
    payload = jwt.verify(token, SECRET);
  } catch (err) {
    return res.status(403).json({ error: "Noto'g'ri token" });
  }

  const { id } = payload;
  const admin = await query('SELECT id, username, role, assigned_regions FROM admins WHERE id = $1', [id]);
  if (!admin.rows.length) {
    return res.status(401).json({ error: 'Admin topilmadi' });
  }

  req.user = admin.rows[0];
  next();
}

export async function optionalAuthenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) return next();

  let payload;
  try {
    payload = jwt.verify(token, SECRET);
  } catch (err) {
    return res.status(403).json({ error: "Noto'g'ri token" });
  }

  const { id } = payload;
  const admin = await query('SELECT id, username, role, assigned_regions FROM admins WHERE id = $1', [id]);
  if (!admin.rows.length) {
    return res.status(401).json({ error: 'Admin topilmadi' });
  }

  req.user = admin.rows[0];
  next();
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

export function regionGuard(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Token talab qilinadi' });
  }

  const { role, assigned_regions } = req.user;
  if (role === 'super_admin') return next();

  const regionId = Number(req.body.region_id || req.query.region_id || req.params.region_id);
  const districtId = Number(req.body.district_id || req.query.district_id || req.params.district_id);
  const assigned = Array.isArray(assigned_regions) ? assigned_regions : [];

  if (regionId && !assigned.includes(regionId)) {
    return res.status(403).json({ error: 'Siz faqat o‘z hududingizni boshqarishingiz mumkin' });
  }

  next();
}
