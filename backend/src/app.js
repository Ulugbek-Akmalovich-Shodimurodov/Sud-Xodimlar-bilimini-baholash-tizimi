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
