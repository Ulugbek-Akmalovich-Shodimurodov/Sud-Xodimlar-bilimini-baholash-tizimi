import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

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
  res.json({ message: 'Supreme Court xodim baholash API - Database Version' });
});

// Authentication routes with database fallback
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Simple validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username va password talab qilinadi' });
    }

    // Try database first, fallback to hardcoded
    try {
      const { query } = await import('./db.js');
      const result = await query('SELECT id, username, password, role, assigned_regions FROM admins WHERE username = $1', [username]);
      const admin = result.rows[0];

      if (admin && await bcrypt.compare(password, admin.password)) {
        const token = jwt.sign(
          { id: admin.id, role: admin.role }, 
          process.env.JWT_SECRET || 'fallback_secret', 
          { expiresIn: '1d' }
        );

        return res.json({ 
          token, 
          user: { 
            id: admin.id, 
            username: admin.username, 
            role: admin.role, 
            assigned_regions: admin.assigned_regions 
          } 
        });
      }
    } catch (dbError) {
      console.log('Database login failed, using fallback:', dbError.message);
    }

    // Fallback to hardcoded admin
    const testPassword = 'admin123';
    if (username === 'superadmin' && password === testPassword) {
      const token = jwt.sign(
        { id: 1, role: 'super_admin' }, 
        process.env.JWT_SECRET || 'fallback_secret', 
        { expiresIn: '1d' }
      );

      return res.json({ 
        token, 
        user: { 
          id: 1, 
          username: 'superadmin', 
          role: 'super_admin', 
          assigned_regions: [1, 2, 3, 4, 5]
        } 
      });
    }

    return res.status(401).json({ error: 'Noto\'g\'ri login yoki parol' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server xatoligi' });
  }
});

// Database initialization
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

// Try to load database routes, fallback to mock data if they fail
async function loadRoutes() {
  try {
    // Try to load database-based routes
    const authRoutes = await import('./routes/auth.js');
    const regionRoutes = await import('./routes/regions.js');
    const districtRoutes = await import('./routes/districts.js');
    const employeeRoutes = await import('./routes/employees.js');
    const statsRoutes = await import('./routes/stats.js');
    const positionRoutes = await import('./routes/positions.js');
    const logsRoutes = await import('./routes/logs.js');

    app.use('/api/auth', authRoutes.default);
    app.use('/api/regions', regionRoutes.default);
    app.use('/api/districts', districtRoutes.default);
    app.use('/api/employees', employeeRoutes.default);
    app.use('/api/stats', statsRoutes.default);
    app.use('/api/positions', positionRoutes.default);
    app.use('/api/logs', logsRoutes.default);
    
    console.log('Database routes loaded successfully');
  } catch (error) {
    console.log('Failed to load database routes, using mock data:', error.message);
    loadMockRoutes();
  }
}

// Mock data routes as fallback
function loadMockRoutes() {
  // Regions
  let regions = [
    { id: 1, name: 'Toshkent viloyati' },
    { id: 2, name: 'Samarqand viloyati' },
    { id: 3, name: 'Farg\'ona viloyati' },
    { id: 4, name: 'Buxoro viloyati' },
    { id: 5, name: 'Xorazm viloyati' }
  ];

  app.get('/api/regions', (req, res) => res.json(regions));
  app.post('/api/regions', (req, res) => {
    const newRegion = { id: regions.length + 1, name: req.body.name };
    regions.push(newRegion);
    res.status(201).json(newRegion);
  });
  app.put('/api/regions/:id', (req, res) => {
    const index = regions.findIndex(r => r.id === parseInt(req.params.id));
    if (index !== -1) {
      regions[index] = { ...regions[index], ...req.body };
      res.json(regions[index]);
    } else {
      res.status(404).json({ error: 'Viloyat topilmadi' });
    }
  });
  app.delete('/api/regions/:id', (req, res) => {
    const index = regions.findIndex(r => r.id === parseInt(req.params.id));
    if (index !== -1) {
      regions.splice(index, 1);
      res.status(204).end();
    } else {
      res.status(404).json({ error: 'Viloyat topilmadi' });
    }
  });

  // Districts
  let districts = [
    { id: 1, name: 'Toshkent shahar', region_id: 1 },
    { id: 2, name: 'Chirchiq', region_id: 1 },
    { id: 3, name: 'Samarqand shahar', region_id: 2 },
    { id: 4, name: 'Buxoro shahar', region_id: 4 },
    { id: 5, name: 'Urganch', region_id: 5 }
  ];

  app.get('/api/districts', (req, res) => {
    const { region_id } = req.query;
    let filtered = districts;
    if (region_id) {
      filtered = districts.filter(d => d.region_id === parseInt(region_id));
    }
    res.json(filtered);
  });

  // Positions
  let positions = [
    { id: 1, name: 'Yuqori sud xodimi' },
    { id: 2, name: 'Yuridik mutaxassis' },
    { id: 3, name: 'Ma\'muriyat xodimi' },
    { id: 4, name: 'Sud raisi' },
    { id: 5, name: 'Sudya' }
  ];

  app.get('/api/positions', (req, res) => res.json(positions));

  // Employees
  let employees = [];
  let nextEmployeeId = 1;

  app.get('/api/employees', (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const paginated = employees.slice(offset, offset + limit);
    res.json({ data: paginated, total: employees.length, page, limit });
  });

  app.post('/api/employees', (req, res) => {
    const newEmployee = {
      id: nextEmployeeId++,
      ...req.body,
      score: Math.round((req.body.konstitutsiya_score + req.body.kodeks_score + req.body.protsessual_kodeks_score + req.body.akt_sohasi_score + req.body.odob_axloq_score) / 5)
    };
    employees.push(newEmployee);
    res.status(201).json(newEmployee);
  });

  app.put('/api/employees/:id', (req, res) => {
    const index = employees.findIndex(e => e.id === parseInt(req.params.id));
    if (index !== -1) {
      employees[index] = {
        ...employees[index],
        ...req.body,
        score: Math.round((req.body.konstitutsiya_score + req.body.kodeks_score + req.body.protsessual_kodeks_score + req.body.akt_sohasi_score + req.body.odob_axloq_score) / 5)
      };
      res.json(employees[index]);
    } else {
      res.status(404).json({ error: 'Xodim topilmadi' });
    }
  });

  app.delete('/api/employees/:id', (req, res) => {
    const index = employees.findIndex(e => e.id === parseInt(req.params.id));
    if (index !== -1) {
      employees.splice(index, 1);
      res.status(204).end();
    } else {
      res.status(404).json({ error: 'Xodim topilmadi' });
    }
  });

  // Stats
  app.get('/api/stats/summary', (req, res) => {
    const total = employees.length;
    const avgScore = total > 0 ? Math.round(employees.reduce((sum, e) => sum + e.score, 0) / total) : 0;
    res.json({ total_employees: total, average_score: avgScore });
  });

  // Logs
  let logs = [];
  let nextLogId = 1;

  app.get('/api/logs', (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const paginated = logs.slice(offset, offset + limit);
    res.json({ data: paginated, total: logs.length, page, limit });
  });

  app.get('/api/logs/stats', (req, res) => {
    res.json({
      total_logs: logs.length,
      actions: [
        { action: 'CREATE', count: logs.filter(l => l.action === 'CREATE').length },
        { action: 'UPDATE', count: logs.filter(l => l.action === 'UPDATE').length },
        { action: 'DELETE', count: logs.filter(l => l.action === 'DELETE').length }
      ],
      entities: [
        { entity_type: 'employee', count: logs.filter(l => l.entity_type === 'employee').length }
      ],
      top_admins: [
        { admin_username: 'superadmin', count: logs.filter(l => l.admin_username === 'superadmin').length }
      ],
      weekly_activity: []
    });
  });
}

// Load routes (database or mock)
loadRoutes();

export default app;
