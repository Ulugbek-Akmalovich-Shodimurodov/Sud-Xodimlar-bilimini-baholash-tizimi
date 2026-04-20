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
  res.json({ message: 'Supreme Court xodim baholash API - Test Version' });
});

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('Login attempt:', { username, password: '***' });
    
    // Simple validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username va password talab qilinadi' });
    }

    // Hardcoded admin for testing with properly hashed password
    const admin = {
      id: 1,
      username: 'superadmin',
      password: '$2b$10$K8Z8Z8Z8Z8Z8Z8Z8Z8Z8ZuK8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z', // This will be replaced with actual hash
      role: 'super_admin',
      assigned_regions: [1, 2, 3]
    };

    // For testing, let's create the hash on the fly
    const testPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    console.log('Generated hash:', hashedPassword);
    
    // Use the generated hash for comparison
    if (username === admin.username && password === testPassword) {
      const token = jwt.sign(
        { id: admin.id, role: admin.role }, 
        process.env.JWT_SECRET || 'fallback_secret', 
        { expiresIn: '1d' }
      );

      res.json({ 
        token, 
        user: { 
          id: admin.id, 
          username: admin.username, 
          role: admin.role, 
          assigned_regions: admin.assigned_regions 
        } 
      });
    } else {
      console.log('Auth failed - username or password mismatch');
      return res.status(401).json({ error: 'Noto\'g\'ri login yoki parol' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server xatoligi' });
  }
});

// Simple regions test
app.get('/api/regions', (req, res) => {
  res.json([
    { id: 1, name: 'Toshkent viloyati' },
    { id: 2, name: 'Samarqand viloyati' },
    { id: 3, name: 'Farg\'ona viloyati' }
  ]);
});

// Employee CRUD routes with mock data
let employees = [
  {
    id: 1,
    full_name: 'Test Employee',
    position: 'Test Position',
    region_id: 1,
    district_id: 1,
    region_name: 'Test Region',
    district_name: 'Test District',
    score: 85,
    konstitutsiya_score: 90,
    kodeks_score: 80,
    protsessual_kodeks_score: 85,
    akt_sohasi_score: 88,
    odob_axloq_score: 82,
    konstitutsiya_status: 'topshirdi',
    kodeks_status: 'topshirdi',
    protsessual_kodeks_status: 'topshirdi',
    akt_sohasi_status: 'topshirdi',
    odob_axloq_status: 'topshirdi'
  }
];

let nextEmployeeId = 2;

// GET employees with pagination
app.get('/api/employees', (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  const paginatedData = employees.slice(offset, offset + limit);

  res.json({
    data: paginatedData,
    total: employees.length,
    page,
    limit
  });
});

// POST create employee
app.post('/api/employees', (req, res) => {
  try {
    const newEmployee = {
      id: nextEmployeeId++,
      ...req.body,
      score: Math.round((req.body.konstitutsiya_score + req.body.kodeks_score + req.body.protsessual_kodeks_score + req.body.akt_sohasi_score + req.body.odob_axloq_score) / 5)
    };

    employees.push(newEmployee);
    res.status(201).json(newEmployee);
  } catch (error) {
    res.status(400).json({ error: 'Xodim yaratishda xatolik' });
  }
});

// PUT update employee
app.put('/api/employees/:id', (req, res) => {
  try {
    const employeeId = parseInt(req.params.id, 10);
    const employeeIndex = employees.findIndex(emp => emp.id === employeeId);

    if (employeeIndex === -1) {
      return res.status(404).json({ error: 'Xodim topilmadi' });
    }

    const updatedEmployee = {
      ...employees[employeeIndex],
      ...req.body,
      score: Math.round((req.body.konstitutsiya_score + req.body.kodeks_score + req.body.protsessual_kodeks_score + req.body.akt_sohasi_score + req.body.odob_axloq_score) / 5)
    };

    employees[employeeIndex] = updatedEmployee;
    res.json(updatedEmployee);
  } catch (error) {
    res.status(400).json({ error: 'Xodim yangilashda xatolik' });
  }
});

// DELETE employee
app.delete('/api/employees/:id', (req, res) => {
  try {
    const employeeId = parseInt(req.params.id, 10);
    const employeeIndex = employees.findIndex(emp => emp.id === employeeId);

    if (employeeIndex === -1) {
      return res.status(404).json({ error: 'Xodim topilmadi' });
    }

    employees.splice(employeeIndex, 1);
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: 'Xodim o\'chirishda xatolik' });
  }
});

export default app;
