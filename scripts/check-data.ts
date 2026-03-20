import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
    try {
        const emailToCheck = process.env.CHECK_USER_EMAIL || 'tunq25@uef.edu.vn';
        const r = await pool.query("SELECT id, email, name, balance, role FROM users WHERE email = $1", [emailToCheck]);
        console.log('User:', JSON.stringify(r.rows[0], null, 2));

        const d = await pool.query('SELECT id, user_id, amount, status, created_at FROM deposits ORDER BY created_at DESC LIMIT 5');
        console.log('Recent Deposits:', JSON.stringify(d.rows, null, 2));

        const w = await pool.query('SELECT id, user_id, amount, status, created_at FROM withdrawals ORDER BY created_at DESC LIMIT 5');
        console.log('Recent Withdrawals:', JSON.stringify(w.rows, null, 2));

        const p = await pool.query('SELECT id, user_id, amount, status, created_at FROM purchases ORDER BY created_at DESC LIMIT 5');
        console.log('Recent Purchases:', JSON.stringify(p.rows, null, 2));
    } catch (e: any) {
        console.error('Error:', e.message);
    } finally {
        await pool.end();
    }
})();
