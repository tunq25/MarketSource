require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkAll() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  const tables = ['users', 'products', 'product_ratings', 'deposits', 'withdrawals', 'settings', 'analytics_events', 'notifications'];
  
  try {
    for (const table of tables) {
      const res = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);
      console.log(`Table '${table}' exists:`, res.rows[0].exists);
    }
  } catch (e) {
    console.error('Error checking tables:', e.message);
  } finally {
    await pool.end();
  }
}

checkAll();
