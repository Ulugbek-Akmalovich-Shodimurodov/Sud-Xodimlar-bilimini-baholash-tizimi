import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupSupabaseDatabase() {
  console.log('Setting up Supabase cloud database...\n');

  try {
    // 1. Create Supabase project
    console.log('1. Creating Supabase project...');
    console.log('   Please follow these steps:');
    console.log('   a. Go to https://supabase.com');
    console.log('   b. Click "Start your project"');
    console.log('   c. Sign up/login');
    console.log('   d. Create new project: "sud-xodimlar"');
    console.log('   e. Choose a database password (copy it)');
    console.log('   f. Wait for project to be ready (2-3 minutes)');
    
    // 2. Get connection details
    console.log('\n2. Getting connection details...');
    console.log('   a. Go to your Supabase project');
    console.log('   b. Settings > Database');
    console.log('   c. Connection string > URI');
    console.log('   d. Copy the connection string');

    // 3. Create environment file
    console.log('\n3. Creating environment configuration...');
    const envContent = `# Supabase Database Configuration
DATABASE_URL=YOUR_SUPABASE_CONNECTION_STRING_HERE
DB_HOST=YOUR_SUPABASE_HOST_HERE
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=YOUR_SUPABASE_PASSWORD_HERE
JWT_SECRET=your_strong_jwt_secret_key_here
CORS_ORIGIN=https://sud-xodimlar-bilimini-baholash-tizi.vercel.app
AUTO_INIT_DB=true
DB_SSL=true`;

    const envPath = path.join(__dirname, '../.env');
    await fs.writeFile(envPath, envContent);
    console.log('   .env file created with Supabase template');
    console.log('   Please update it with your actual Supabase credentials');

    // 4. Instructions for Vercel
    console.log('\n4. Vercel Environment Variables:');
    console.log('   Go to Vercel dashboard > your backend project > Settings > Environment Variables');
    console.log('   Add these variables:');
    console.log('   - DATABASE_URL: YOUR_SUPABASE_CONNECTION_STRING');
    console.log('   - DB_HOST: YOUR_SUPABASE_HOST');
    console.log('   - DB_PORT: 5432');
    console.log('   - DB_NAME: postgres');
    console.log('   - DB_USER: postgres');
    console.log('   - DB_PASSWORD: YOUR_SUPABASE_PASSWORD');
    console.log('   - JWT_SECRET: your_strong_jwt_secret');
    console.log('   - DB_SSL: true');

    // 5. Deploy instructions
    console.log('\n5. Deploy Steps:');
    console.log('   a. Update .env file with your Supabase credentials');
    console.log('   b. Update Vercel environment variables');
    console.log('   c. Run: git add . && git commit -m "Configure Supabase database" && git push origin main');
    console.log('   d. Wait for Vercel deployment (2-3 minutes)');
    console.log('   e. Initialize database: curl https://your-backend.vercel.app/api/init-db');

    console.log('\n   Benefits of Supabase:');
    console.log('   - Free tier available');
    console.log('   - Always online');
    console.log('   - No need for ngrok');
    console.log('   - Production ready');
    console.log('   - Easy backup and management');

    return true;
  } catch (error) {
    console.error('Setup failed:', error);
    return false;
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupSupabaseDatabase()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Setup error:', error);
      process.exit(1);
    });
}

export default setupSupabaseDatabase;
