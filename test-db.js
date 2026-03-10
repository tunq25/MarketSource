const { Pool } = require('pg');
require('dotenv').config();

async function testConnection() {
    console.log('--- Database Connection Test ---');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000
    });

    try {
        console.log('Attempting to connect...');
        const start = Date.now();
        const res = await pool.query('SELECT NOW()');
        console.log('Success! Server time:', res.rows[0].now);
        console.log('Time taken:', Date.now() - start, 'ms');
    } catch (err) {
        console.error('Connection failed!');
        console.error('Error code:', err.code);
        console.error('Error message:', err.message);
    } finally {
        await pool.end();
    }
}

testConnection();
