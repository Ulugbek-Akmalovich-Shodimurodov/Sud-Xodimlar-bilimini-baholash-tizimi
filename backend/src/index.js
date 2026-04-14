import app from './app.js';
import dotenv from 'dotenv';
import { initializeDatabase } from './initDb.js';

dotenv.config();
const PORT = process.env.PORT || 4000;

if (process.env.AUTO_INIT_DB === 'true') {
  await initializeDatabase();
}

app.listen(PORT, () => {
  console.log(`Supreme Court assessment backend listening on port ${PORT}`);
});
