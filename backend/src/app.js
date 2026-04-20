import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admins.js';
import regionRoutes from './routes/regions.js';
import districtRoutes from './routes/districts.js';
import employeeRoutes from './routes/employees.js';
import statsRoutes from './routes/stats.js';
import positionRoutes from './routes/positions.js';
import logsRoutes from './routes/logs.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Simple and direct CORS configuration for Vercel
app.use(cors({
  origin: [
    'https://sud-xodimlar-bilimini-baholash-tizi.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json());
app.use(morgan('tiny'));

app.use('/api/auth', authRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/districts', districtRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/logs', logsRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Supreme Court xodim baholash API' });
});

app.post('/api/init-db', async (req, res) => {
  try {
    const { initializeDatabase } = await import('./initDb.js');
    await initializeDatabase();
    res.json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Database initialization failed:', error);
    res.status(500).json({ error: 'Database initialization failed' });
  }
});

app.use(errorHandler);

export default app;
