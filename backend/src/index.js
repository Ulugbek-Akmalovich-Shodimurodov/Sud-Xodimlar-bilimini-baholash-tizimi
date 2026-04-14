import app from './app.js';
import dotenv from 'dotenv';
import { initializeDatabase } from './initDb.js';

dotenv.config();
const PORT = process.env.PORT || 4000;

await initializeDatabase();

app.listen(PORT, () => {
  console.log(`Supreme Court assessment backend listening on port ${PORT}`);
});
