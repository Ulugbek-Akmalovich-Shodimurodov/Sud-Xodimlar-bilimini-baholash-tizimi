import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function forceResetDatabase() {
  console.log('Force resetting database with new default data...\n');

  try {
    // 1. Drop and recreate database completely
    console.log('1. Dropping and recreating database...');
    try {
      execSync('psql -U admin -c "DROP DATABASE IF EXISTS sud_xodimlar;"', { stdio: 'pipe' });
      execSync('psql -U admin -c "CREATE DATABASE sud_xodimlar;"', { stdio: 'pipe' });
      console.log('   Database recreated successfully');
    } catch (error) {
      console.log('   Error recreating database:', error.message);
      console.log('   Please run manually:');
      console.log('   psql -U admin -c "DROP DATABASE IF EXISTS sud_xodimlar;"');
      console.log('   psql -U admin -c "CREATE DATABASE sud_xodimlar;"');
      return false;
    }

    // 2. Check if backend is using database or mock data
    console.log('2. Checking backend configuration...');
    const envPath = path.join(__dirname, '../.env');
    let envContent = '';
    
    if (await fs.access(envPath).then(() => true).catch(() => false)) {
      envContent = await fs.readFile(envPath, 'utf8');
    }

    if (envContent.includes('DATABASE_URL')) {
      console.log('   Database configuration found in .env');
    } else {
      console.log('   No database configuration found, creating .env...');
      const newEnvContent = `DATABASE_URL=postgresql://admin:admin@localhost:5432/sud_xodimlar
JWT_SECRET=your_jwt_secret_key_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sud_xodimlar
DB_USER=admin
DB_PASSWORD=admin`;
      await fs.writeFile(envPath, newEnvContent);
      console.log('   .env file created with database configuration');
    }

    // 3. Test database connection
    console.log('3. Testing database connection...');
    try {
      const { query } = await import('../src/db.js');
      await query('SELECT 1');
      console.log('   Database connection successful');
    } catch (error) {
      console.log('   Database connection failed:', error.message);
      return false;
    }

    // 4. Run database initialization
    console.log('4. Running database initialization...');
    try {
      const { initializeDatabase } = await import('../src/initDb.js');
      await initializeDatabase();
      console.log('   Database initialization completed');
    } catch (error) {
      console.log('   Database initialization failed:', error.message);
      return false;
    }

    // 5. Verify data was inserted
    console.log('5. Verifying data insertion...');
    try {
      const { query } = await import('../src/db.js');
      
      const regionsCount = await query('SELECT COUNT(*) as count FROM regions');
      const districtsCount = await query('SELECT COUNT(*) as count FROM districts');
      const positionsCount = await query('SELECT COUNT(*) as count FROM positions');
      const employeesCount = await query('SELECT COUNT(*) as count FROM employees');

      console.log(`   Regions: ${regionsCount.rows[0].count}`);
      console.log(`   Districts: ${districtsCount.rows[0].count}`);
      console.log(`   Positions: ${positionsCount.rows[0].count}`);
      console.log(`   Employees: ${employeesCount.rows[0].count}`);

      if (employeesCount.rows[0].count > 0) {
        console.log('\n   Sample employee data:');
        const sampleEmployees = await query('SELECT full_name, position, score FROM employees LIMIT 3');
        sampleEmployees.rows.forEach(emp => {
          console.log(`   - ${emp.full_name} (${emp.position}) - ${emp.score} ball`);
        });
      }
    } catch (error) {
      console.log('   Data verification failed:', error.message);
    }

    // 6. Test API endpoints
    console.log('6. Testing API endpoints...');
    try {
      const regionsResponse = await fetch('http://localhost:4000/api/regions');
      const employeesResponse = await fetch('http://localhost:4000/api/employees');
      
      if (regionsResponse.ok && employeesResponse.ok) {
        const regionsData = await regionsResponse.json();
        const employeesData = await employeesResponse.json();
        
        console.log(`   API Regions: ${regionsData.length} items`);
        console.log(`   API Employees: ${employeesData.total} total items`);
        
        if (employeesData.total > 0) {
          console.log('\n   Database reset completed successfully!');
          console.log('   You can now test the frontend with real data.');
        } else {
          console.log('\n   Warning: API shows no employees, check backend logs');
        }
      } else {
        console.log('   API endpoints not responding correctly');
      }
    } catch (error) {
      console.log('   API test failed:', error.message);
    }

    return true;
  } catch (error) {
    console.error('Force reset failed:', error);
    return false;
  }
}

// Run force reset if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  forceResetDatabase()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Force reset error:', error);
      process.exit(1);
    });
}

export default forceResetDatabase;
