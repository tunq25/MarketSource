require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => {
  return client.query('SELECT * FROM user_deposit_reference_codes LIMIT 1');
})
.then(res => console.log('TABLE EXISTS', res.rows))
.catch(err => console.error('ERROR:', err.message))
.finally(() => client.end());
