require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => {
  return client.query(`
      SELECT d.*, 
             u.email AS "userEmail", 
             COALESCE(u.username, u.name, u.email) AS "userName", 
             r.code AS deposit_reference_code
      FROM deposits d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN user_deposit_reference_codes r ON r.user_id = d.user_id
  `);
})
.then(res => console.log('TABLE EXISTS', res.rows.length))
.catch(err => console.error('ERROR:', err.message))
.finally(() => client.end());
