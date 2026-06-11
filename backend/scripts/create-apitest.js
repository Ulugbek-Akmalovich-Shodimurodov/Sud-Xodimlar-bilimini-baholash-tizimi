import bcrypt from 'bcrypt';
import { query } from '../src/db.js';
(async ()=>{
  try{
    const hash = await bcrypt.hash('apipass', 10);
    await query('INSERT INTO admins (username, password, role, assigned_regions) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING', ['apitest', hash, 'super_admin', '[]']);
    console.log('apitest created');
    process.exit(0);
  }catch(e){
    console.error(e.message);
    process.exit(1);
  }
})();
