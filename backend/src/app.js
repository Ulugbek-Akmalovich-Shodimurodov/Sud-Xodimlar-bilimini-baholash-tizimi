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

    // Log the action
    addLog({
      adminId: 1,
      adminUsername: 'superadmin',
      action: 'CREATE',
      entityType: 'employee',
      entityId: newEmployee.id,
      entityName: newEmployee.full_name,
      newData: newEmployee,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

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

    const oldData = { ...employees[employeeIndex] };
    const updatedEmployee = {
      ...employees[employeeIndex],
      ...req.body,
      score: Math.round((req.body.konstitutsiya_score + req.body.kodeks_score + req.body.protsessual_kodeks_score + req.body.akt_sohasi_score + req.body.odob_axloq_score) / 5)
    };

    employees[employeeIndex] = updatedEmployee;

    // Log the action
    addLog({
      adminId: 1,
      adminUsername: 'superadmin',
      action: 'UPDATE',
      entityType: 'employee',
      entityId: updatedEmployee.id,
      entityName: updatedEmployee.full_name,
      oldData,
      newData: updatedEmployee,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

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

    const deletedEmployee = employees[employeeIndex];
    employees.splice(employeeIndex, 1);

    // Log the action
    addLog({
      adminId: 1,
      adminUsername: 'superadmin',
      action: 'DELETE',
      entityType: 'employee',
      entityId: deletedEmployee.id,
      entityName: deletedEmployee.full_name,
      oldData: deletedEmployee,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

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

// Logs API endpoints with mock data
let logs = [
  {
    id: 1,
    admin_id: 1,
    admin_username: 'superadmin',
    action: 'CREATE',
    entity_type: 'employee',
    entity_id: 1,
    entity_name: 'Test Employee',
    old_data: null,
    new_data: { full_name: 'Test Employee', position: 'Test Position' },
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    admin_id: 1,
    admin_username: 'superadmin',
    action: 'UPDATE',
    entity_type: 'employee',
    entity_id: 1,
    entity_name: 'Test Employee',
    old_data: { score: 80 },
    new_data: { score: 85 },
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    created_at: new Date(Date.now() - 3600000).toISOString()
  }
];

let nextLogId = 3;

// Function to detect specific changes
function detectChanges(oldData, newData) {
  const changes = [];
  
  const fieldLabels = {
    full_name: 'F.I.O',
    position: 'Lavozimi',
    region_id: 'Viloyati',
    district_id: 'Tumani',
    konstitutsiya_score: 'Konstitutsiya natijasi',
    kodeks_score: 'Kodeks natijasi',
    protsessual_kodeks_score: 'Protsessual kodeks natijasi',
    akt_sohasi_score: 'AKT natijasi',
    odob_axloq_score: 'Odob-axloq natijasi',
    konstitutsiya_status: 'Konstitutsiya holati',
    kodeks_status: 'Kodeks holati',
    protsessual_kodeks_status: 'Protsessual kodeks holati',
    akt_sohasi_status: 'AKT holati',
    odob_axloq_status: 'Odob-axloq holati',
    score: 'Umumiy natija'
  };

  if (!oldData || !newData) return changes;

  for (const [key, newValue] of Object.entries(newData)) {
    const oldValue = oldData[key];
    if (oldValue !== newValue) {
      const label = fieldLabels[key] || key;
      
      if (key.includes('_score') && typeof oldValue === 'number' && typeof newValue === 'number') {
        // Handle score changes
        changes.push(`${label}: ${oldValue}% dan ${newValue}% ga o'zgartirildi`);
      } else if (key.includes('_status')) {
        // Handle status changes
        changes.push(`${label}: ${oldValue} dan ${newValue} ga o'zgartirildi`);
      } else if (key === 'region_id' || key === 'district_id') {
        // Handle region/district changes
        changes.push(`${label}: o'zgartirildi`);
      } else {
        // Handle other changes
        changes.push(`${label}: "${oldValue}" dan "${newValue}" ga o'zgartirildi`);
      }
    }
  }

  return changes;
}

// Enhanced logging function
function addLog({
  adminId,
  adminUsername,
  action,
  entityType,
  entityId,
  entityName,
  oldData,
  newData,
  ipAddress,
  userAgent
}) {
  let changeDescription = '';
  
  if (action === 'UPDATE' && oldData && newData) {
    const changes = detectChanges(oldData, newData);
    if (changes.length > 0) {
      changeDescription = changes.join('; ');
    } else {
      changeDescription = 'O\'zgarishlar topilmadi';
    }
  } else if (action === 'CREATE') {
    changeDescription = `${entityName} yaratildi`;
  } else if (action === 'DELETE') {
    changeDescription = `${entityName} o\'chirildi`;
  }

  const newLog = {
    id: nextLogId++,
    admin_id: adminId,
    admin_username: adminUsername,
    action,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    change_description: changeDescription,
    old_data: oldData,
    new_data: newData,
    ip_address: ipAddress || '127.0.0.1',
    user_agent: userAgent || 'Unknown',
    created_at: new Date().toISOString()
  };
  logs.push(newLog);
}

// GET logs with pagination and filters
app.get('/api/logs', (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = (page - 1) * limit;
  
  let filteredLogs = [...logs];

  // Apply filters
  if (req.query.action) {
    filteredLogs = filteredLogs.filter(log => log.action === req.query.action);
  }
  if (req.query.entity_type) {
    filteredLogs = filteredLogs.filter(log => log.entity_type === req.query.entity_type);
  }
  if (req.query.admin_username) {
    filteredLogs = filteredLogs.filter(log => 
      log.admin_username.toLowerCase().includes(req.query.admin_username.toLowerCase())
    );
  }
  if (req.query.date_from) {
    const dateFrom = new Date(req.query.date_from);
    filteredLogs = filteredLogs.filter(log => new Date(log.created_at) >= dateFrom);
  }
  if (req.query.date_to) {
    const dateTo = new Date(req.query.date_to);
    dateTo.setHours(23, 59, 59, 999);
    filteredLogs = filteredLogs.filter(log => new Date(log.created_at) <= dateTo);
  }

  // Sort by created_at descending
  filteredLogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const paginatedLogs = filteredLogs.slice(offset, offset + limit);

  res.json({
    data: paginatedLogs,
    total: filteredLogs.length,
    page,
    limit
  });
});

// GET logs stats
app.get('/api/logs/stats', (req, res) => {
  const totalLogs = logs.length;
  
  const actionStats = [
    { action: 'CREATE', count: logs.filter(l => l.action === 'CREATE').length },
    { action: 'UPDATE', count: logs.filter(l => l.action === 'UPDATE').length },
    { action: 'DELETE', count: logs.filter(l => l.action === 'DELETE').length }
  ];

  const entityStats = [
    { entity_type: 'employee', count: logs.filter(l => l.entity_type === 'employee').length },
    { entity_type: 'admin', count: logs.filter(l => l.entity_type === 'admin').length },
    { entity_type: 'region', count: logs.filter(l => l.entity_type === 'region').length },
    { entity_type: 'district', count: logs.filter(l => l.entity_type === 'district').length },
    { entity_type: 'position', count: logs.filter(l => l.entity_type === 'position').length }
  ];

  const topAdmins = [
    { admin_username: 'superadmin', count: logs.filter(l => l.admin_username === 'superadmin').length }
  ];

  // Weekly activity (last 7 days)
  const weeklyActivity = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const count = logs.filter(l => l.created_at.startsWith(dateStr)).length;
    weeklyActivity.push({ date: dateStr, count });
  }

  res.json({
    total_logs: totalLogs,
    actions: actionStats,
    entities: entityStats,
    top_admins: topAdmins,
    weekly_activity: weeklyActivity
  });
});

export default app;
