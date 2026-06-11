import { query } from '../src/db.js';

const result = await query(`SELECT c.id, c.key, c.label, count(s.id) as sections
FROM criteria c
LEFT JOIN criterion_sections s ON s.criterion_id = c.id
GROUP BY c.id
ORDER BY c.sort_order`);
console.log(JSON.stringify(result.rows, null, 2));
