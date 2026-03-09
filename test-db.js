const { Client } = require('pg');

async function testConnection(name, uri) {
    console.log(`Testing ${name}...`);
    const client = new Client({
        connectionString: uri,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
    });
    try {
        const start = Date.now();
        await client.connect();
        const res = await client.query('SELECT NOW()');
        console.log(`✅ ${name} SUCCESS in ${Date.now() - start}ms:`, res.rows[0].now);
        await client.end();
    } catch (err) {
        console.log(`❌ ${name} ERROR:`, err.message);
    }
}

async function main() {
    const pwd = 'GBxN2dxh9Wvat'; // Từ user

    // 1. Direct connection 5432
    await testConnection(
        '1. Direct 5432',
        `postgresql://postgres:${pwd}@db.shbiitaxhncsjstijcql.supabase.co:5432/postgres`
    );

    // 2. Protocol pooler (Transaction pooler) port 6543
    await testConnection(
        '2. Pooler 6543 (transaction mode)',
        `postgresql://postgres.shbiitaxhncsjstijcql:${pwd}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
    );

    // 3. Supabase IPv4 Pooler Direct
    await testConnection(
        '3. IPv4 Direct (pgbouncer)',
        `postgresql://postgres.shbiitaxhncsjstijcql:${pwd}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
    );
}

main();
