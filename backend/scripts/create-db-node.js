import pkg from 'pg';
const { Client } = pkg;
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'admin',
  database: 'postgres',
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    try {
      await client.query('CREATE DATABASE supreme_court');
      console.log('Database supreme_court created');
    } catch (err) {
      if (err.code === '42P04') {
        console.log('Database supreme_court already exists');
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.error('Database connection or creation failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
