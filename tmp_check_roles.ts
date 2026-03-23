import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function check() {
  try {
    const res = await pool.query('SELECT role, count(*) FROM users GROUP BY role');
    console.log('User roles breakdown:');
    console.table(res.rows);
    
    const adminRes = await pool.query("SELECT id, email, username, role FROM users WHERE role IN ('admin', 'superadmin') LIMIT 5");
    console.log('\nSample admins:');
    console.table(adminRes.rows);
    
  } catch (err) {
    console.error('Error checking roles:', err);
  } finally {
    await pool.end();
  }
}

check();
