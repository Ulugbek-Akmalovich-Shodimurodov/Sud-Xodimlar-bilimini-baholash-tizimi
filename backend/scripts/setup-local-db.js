import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupLocalDatabase() {
  console.log('Setting up local PostgreSQL database...\n');

  try {
    // Check if PostgreSQL is installed
    console.log('1. Checking PostgreSQL installation...');
    try {
      execSync('psql --version', { stdio: 'pipe' });
      console.log('   PostgreSQL is installed\n');
    } catch (error) {
      console.log('   PostgreSQL not found. Please install PostgreSQL first.');
      console.log('   Download from: https://www.postgresql.org/download/windows/');
      return false;
    }

    // Create .env file if it doesn't exist
    console.log('2. Setting up environment variables...');
    const envPath = path.join(__dirname, '../.env');
    const envExamplePath = path.join(__dirname, '../.env.example');

    if (!fs.existsSync(envPath)) {
      if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
        console.log('   .env file created from .env.example');
      } else {
        const envContent = `DATABASE_URL=postgresql://admin:admin@localhost:5432/sud_xodimlar
JWT_SECRET=your_jwt_secret_key_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sud_xodimlar
DB_USER=admin
DB_PASSWORD=admin`;
        fs.writeFileSync(envPath, envContent);
        console.log('   .env file created with default values');
      }
    } else {
      console.log('   .env file already exists');
    }

    // Create database and user
    console.log('3. Creating database and user...');
    try {
      // Connect to postgres database to create our database
      const createDbCommand = `psql -U admin -c "CREATE DATABASE sud_xodimlar;"`;
      const grantCommand = `psql -U admin -c "GRANT ALL PRIVILEGES ON DATABASE sud_xodimlar TO admin;"`;

      execSync(createDbCommand, { stdio: 'pipe' });
      console.log('   Database "sud_xodimlar" created');

      execSync(grantCommand, { stdio: 'pipe' });
      console.log('   Privileges granted to admin user');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   Database already exists');
      } else {
        console.log('   Error creating database:', error.message);
        console.log('   Please run these commands manually:');
        console.log('   psql -U admin -c "CREATE DATABASE sud_xodimlar;"');
        console.log('   psql -U admin -c "GRANT ALL PRIVILEGES ON DATABASE sud_xodimlar TO admin;"');
      }
    }

    // Initialize database schema
    console.log('4. Initializing database schema...');
    try {
      const { initializeDatabase } = await import('../src/initDb.js');
      await initializeDatabase();
      console.log('   Database schema initialized');
    } catch (error) {
      console.log('   Error initializing schema:', error.message);
      console.log('   Please run: npm run init-db');
    }

    // Test connection
    console.log('5. Testing database connection...');
    try {
      const { query } = await import('../src/db.js');
      await query('SELECT 1');
      console.log('   Database connection successful');
    } catch (error) {
      console.log('   Database connection failed:', error.message);
      return false;
    }

    console.log('\nLocal database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Start the backend: npm start');
    console.log('2. Test the API: curl http://localhost:4000/');
    console.log('3. Login with: username=superadmin, password=admin123');

    return true;
  } catch (error) {
    console.error('Setup failed:', error.message);
    return false;
  }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupLocalDatabase()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Setup error:', error);
      process.exit(1);
    });
}

export default setupLocalDatabase;
