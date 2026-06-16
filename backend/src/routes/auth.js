import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { query } from '../db.js';
import { loginSchema } from '../validators.js';
import { normalizePermissions } from '../permissions.js';

dotenv.config();
const router = express.Router();
const SECRET = process.env.JWT_SECRET;

router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const { username, password } = value;
    const result = await query(
      'SELECT id, username, password, role, assigned_regions, permissions, status FROM admins WHERE username = $1',
      [username]
    );
    const admin = result.rows[0];

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ error: 'Noto\'g\'ri login yoki parol' });
    }
    if (admin.status === 'blocked') {
      return res.status(403).json({ error: 'Admin bloklangan' });
    }

    await query('UPDATE admins SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1', [admin.id]);

    const token = jwt.sign(
      { id: admin.id, role: admin.role },
      SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.json({
      token,
      user: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        assigned_regions: admin.assigned_regions,
        permissions: normalizePermissions(admin.permissions, admin.role),
        status: admin.status,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
