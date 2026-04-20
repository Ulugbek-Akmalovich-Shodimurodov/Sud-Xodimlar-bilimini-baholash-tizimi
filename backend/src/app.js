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
import errorHandler from './middleware/errorHandler.js';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS ruxsati yo`q'));
  },
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
