import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { query } from '../db.js';
import { loginSchema } from '../validators.js';

dotenv.config();
const router = express.Router();
const SECRET = process.env.JWT_SECRET;

router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const { username, password } = value;
    const result = await query('SELECT id, username, password, role, assigned_regions FROM admins WHERE username = $1', [username]);
    const admin = result.rows[0];

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ error: 'Noto‘g‘ri login yoki parol' });
    }

    const token = jwt.sign({ id: admin.id, role: admin.role }, SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
    res.json({ token, user: { id: admin.id, username: admin.username, role: admin.role, assigned_regions: admin.assigned_regions } });
  } catch (err) {
    next(err);
  }
});

export default router;
