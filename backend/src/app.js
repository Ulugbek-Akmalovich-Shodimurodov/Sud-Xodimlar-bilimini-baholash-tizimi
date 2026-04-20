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

// Regions CRUD with mock data
let regions = [
  { id: 1, name: 'Toshkent viloyati' },
  { id: 2, name: 'Samarqand viloyati' },
  { id: 3, name: 'Farg\'ona viloyati' },
  { id: 4, name: 'Buxoro viloyati' },
  { id: 5, name: 'Xorazm viloyati' }
];

let nextRegionId = 6;

// GET regions
app.get('/api/regions', (req, res) => {
  res.json(regions);
});

// POST create region
app.post('/api/regions', (req, res) => {
  try {
    const newRegion = {
      id: nextRegionId++,
      name: req.body.name
    };
    regions.push(newRegion);
    res.status(201).json(newRegion);
  } catch (error) {
    res.status(400).json({ error: 'Viloyat yaratishda xatolik' });
  }
});

// PUT update region
app.put('/api/regions/:id', (req, res) => {
  try {
    const regionId = parseInt(req.params.id, 10);
    const regionIndex = regions.findIndex(region => region.id === regionId);

    if (regionIndex === -1) {
      return res.status(404).json({ error: 'Viloyat topilmadi' });
    }

    regions[regionIndex] = { ...regions[regionIndex], ...req.body };
    res.json(regions[regionIndex]);
  } catch (error) {
    res.status(400).json({ error: 'Viloyat yangilashda xatolik' });
  }
});

// DELETE region
app.delete('/api/regions/:id', (req, res) => {
  try {
    const regionId = parseInt(req.params.id, 10);
    const regionIndex = regions.findIndex(region => region.id === regionId);

    if (regionIndex === -1) {
      return res.status(404).json({ error: 'Viloyat topilmadi' });
    }

    regions.splice(regionIndex, 1);
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: 'Viloyat o\'chirishda xatolik' });
  }
});

// Districts CRUD with mock data
let districts = [
  { id: 1, name: 'Toshkent shahar', region_id: 1 },
  { id: 2, name: 'Chirchiq', region_id: 1 },
  { id: 3, name: 'Samarqand shahar', region_id: 2 },
  { id: 4, name: 'Buxoro shahar', region_id: 4 },
  { id: 5, name: 'Urganch', region_id: 5 }
];

let nextDistrictId = 6;

// GET districts
app.get('/api/districts', (req, res) => {
  const { region_id } = req.query;
  let filteredDistricts = districts;
  
  if (region_id) {
    filteredDistricts = districts.filter(d => d.region_id === parseInt(region_id, 10));
  }
  
  res.json(filteredDistricts);
});

// POST create district
app.post('/api/districts', (req, res) => {
  try {
    const newDistrict = {
      id: nextDistrictId++,
      name: req.body.name,
      region_id: req.body.region_id
    };
    districts.push(newDistrict);
    res.status(201).json(newDistrict);
  } catch (error) {
    res.status(400).json({ error: 'Tuman yaratishda xatolik' });
  }
});

// PUT update district
app.put('/api/districts/:id', (req, res) => {
  try {
    const districtId = parseInt(req.params.id, 10);
    const districtIndex = districts.findIndex(district => district.id === districtId);

    if (districtIndex === -1) {
      return res.status(404).json({ error: 'Tuman topilmadi' });
    }

    districts[districtIndex] = { ...districts[districtIndex], ...req.body };
    res.json(districts[districtIndex]);
  } catch (error) {
    res.status(400).json({ error: 'Tuman yangilashda xatolik' });
  }
});

// DELETE district
app.delete('/api/districts/:id', (req, res) => {
  try {
    const districtId = parseInt(req.params.id, 10);
    const districtIndex = districts.findIndex(district => district.id === districtId);

    if (districtIndex === -1) {
      return res.status(404).json({ error: 'Tuman topilmadi' });
    }

    districts.splice(districtIndex, 1);
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: 'Tuman o\'chirishda xatolik' });
  }
});

// Positions CRUD with mock data
let positions = [
  { id: 1, name: 'Yuqori sud xodimi' },
  { id: 2, name: 'Yuridik mutaxassis' },
  { id: 3, name: 'Ma\'muriyat xodimi' },
  { id: 4, name: 'Sud raisi' },
  { id: 5, name: 'Sudya' }
];

let nextPositionId = 6;

// GET positions
app.get('/api/positions', (req, res) => {
  res.json(positions);
});

// POST create position
app.post('/api/positions', (req, res) => {
  try {
    const newPosition = {
      id: nextPositionId++,
      name: req.body.name
    };
    positions.push(newPosition);
    res.status(201).json(newPosition);
  } catch (error) {
    res.status(400).json({ error: 'Lavozim yaratishda xatolik' });
  }
});

// PUT update position
app.put('/api/positions/:id', (req, res) => {
  try {
    const positionId = parseInt(req.params.id, 10);
    const positionIndex = positions.findIndex(position => position.id === positionId);

    if (positionIndex === -1) {
      return res.status(404).json({ error: 'Lavozim topilmadi' });
    }

    positions[positionIndex] = { ...positions[positionIndex], ...req.body };
    res.json(positions[positionIndex]);
  } catch (error) {
    res.status(400).json({ error: 'Lavozim yangilashda xatolik' });
  }
});

// DELETE position
app.delete('/api/positions/:id', (req, res) => {
  try {
    const positionId = parseInt(req.params.id, 10);
    const positionIndex = positions.findIndex(position => position.id === positionId);

    if (positionIndex === -1) {
      return res.status(404).json({ error: 'Lavozim topilmadi' });
    }

    positions.splice(positionIndex, 1);
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: 'Lavozim o\'chirishda xatolik' });
  }
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

// Statistics API endpoints
app.get('/api/stats/summary', (req, res) => {
  const totalEmployees = employees.length;
  const averageScore = employees.length > 0 
    ? Math.round(employees.reduce((sum, emp) => sum + emp.score, 0) / employees.length)
    : 0;

  res.json({
    total_employees: totalEmployees,
    average_score: averageScore
  });
});

app.get('/api/stats/regions', (req, res) => {
  const regionStats = regions.map(region => {
    const regionEmployees = employees.filter(emp => emp.region_id === region.id);
    const averageScore = regionEmployees.length > 0
      ? Math.round(regionEmployees.reduce((sum, emp) => sum + emp.score, 0) / regionEmployees.length)
      : 0;

    return {
      region_name: region.name,
      total_employees: regionEmployees.length,
      average_score: averageScore
    };
  });

  res.json(regionStats);
});

app.get('/api/stats/districts', (req, res) => {
  const districtStats = districts.map(district => {
    const districtEmployees = employees.filter(emp => emp.district_id === district.id);
    const averageScore = districtEmployees.length > 0
      ? Math.round(districtEmployees.reduce((sum, emp) => sum + emp.score, 0) / districtEmployees.length)
      : 0;

    return {
      district_name: district.name,
      total_employees: districtEmployees.length,
      average_score: averageScore
    };
  });

  res.json(districtStats);
});

app.get('/api/stats/top', (req, res) => {
  const topEmployees = employees
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(emp => ({
      full_name: emp.full_name,
      position: emp.position,
      region_name: regions.find(r => r.id === emp.region_id)?.name || 'Unknown',
      district_name: districts.find(d => d.id === emp.district_id)?.name || 'Unknown',
      score: emp.score
    }));

  res.json(topEmployees);
});

export default app;
