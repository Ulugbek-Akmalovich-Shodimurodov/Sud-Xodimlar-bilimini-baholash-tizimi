import app from './app.js';
import dotenv from 'dotenv';
import { initializeDatabase } from './initDb.js';

dotenv.config();
const PORT = process.env.PORT || 4000;

try {
  await initializeDatabase();
} catch (err) {
  console.error('Database initialization failed (continuing):', err.message);
}

app.listen(PORT, () => {
  console.log(`Supreme Court assessment backend listening on port ${PORT}`);
});
