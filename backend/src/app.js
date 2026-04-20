import express from 'express';
import cors from 'cors';

const app = express();

// Simple CORS configuration
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

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: 'Supreme Court xodim baholash API - Test Version' });
});

// Simple regions test
app.get('/api/regions', (req, res) => {
  res.json([
    { id: 1, name: 'Toshkent viloyati' },
    { id: 2, name: 'Samarqand viloyati' },
    { id: 3, name: 'Farg\'ona viloyati' }
  ]);
});

// Simple employees test
app.get('/api/employees', (req, res) => {
  res.json({
    data: [
      {
        id: 1,
        full_name: 'Test Employee',
        position: 'Test Position',
        region_name: 'Test Region',
        district_name: 'Test District',
        score: 85
      }
    ],
    total: 1,
    page: 1,
    limit: 10
  });
});

export default app;
