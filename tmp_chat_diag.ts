import { pool } from './lib/db/core';

async function diag() {
  try {
    const res = await pool.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'chats'
    `);
    console.log('Chats table columns:');
    console.table(res.rows);

    const adminCount = await pool.query("SELECT COUNT(*) FROM users WHERE role IN ('admin', 'superadmin')");
    console.log('Admin users count:', adminCount.rows[0].count);

  } catch (err) {
    console.error('Diag failed:', err);
  } finally {
    process.exit();
  }
}

diag();
