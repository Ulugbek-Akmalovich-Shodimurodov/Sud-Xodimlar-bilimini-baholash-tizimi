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

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

// Add the frontend URL to allowed origins
const frontendUrl = 'https://sud-xodimlar-bilimini-baholash-tizi.vercel.app';
const localhostUrls = ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'];

[frontendUrl, ...localhostUrls].forEach(url => {
  if (!allowedOrigins.includes(url)) {
    allowedOrigins.push(url);
  }
});

// Comprehensive CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow any origin in development
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('CORS ruxsati yo`q'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
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
