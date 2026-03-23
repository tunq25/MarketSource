import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    console.log('Checking active connections...');
    const connRes = await pool.query(`
      SELECT count(*), state 
      FROM pg_stat_activity 
      WHERE datname = current_database() 
      GROUP BY state
    `);
    console.table(connRes.rows);

    console.log('\nChecking long running queries (> 5s)...');
    const longRes = await pool.query(`
      SELECT pid, now() - query_start AS duration, query, state
      FROM pg_stat_activity
      WHERE now() - query_start > interval '5 seconds'
      AND state != 'idle'
      AND datname = current_database()
      ORDER BY duration DESC
    `);
    console.table(longRes.rows);

    console.log('\nChecking locks...');
    const lockRes = await pool.query(`
      SELECT
        relname,
        locktype,
        mode,
        granted,
        pid
      FROM pg_locks l
      JOIN pg_class c ON l.relation = c.oid
      WHERE relname !~ '^pg_'
    `);
    console.table(lockRes.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

check();
