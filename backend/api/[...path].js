import app from '../src/app.js';
import { initializeDatabase } from '../src/initDb.js';

let initPromise;

export default async function handler(req, res) {
  try {
    initPromise ||= initializeDatabase();
    await initPromise;
    return app(req, res);
  } catch (error) {
    initPromise = undefined;
    console.error('Database initialization failed before request handling:', error);
    res.status(500).json({ error: 'Database initialization failed' });
  }
}
