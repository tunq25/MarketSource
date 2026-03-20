const { Client } = require('pg');

const regions = [
    'aws-0-us-east-1',
    'aws-0-us-west-1',
    'aws-0-eu-west-1',
    'aws-0-eu-west-2',
    'aws-0-eu-west-3',
    'aws-0-eu-central-1',
    'aws-0-ap-southeast-1',
    'aws-0-ap-northeast-1',
    'aws-0-ap-northeast-2',
    'aws-0-ap-southeast-2',
    'aws-0-ap-south-1',
    'aws-0-sa-east-1',
    'aws-0-ca-central-1'
];
const pwd = process.env.SUPABASE_DB_PWD || 'GBxN2dxh9Wvat'; // Fallback for dev, but env preferred
const tenant = process.env.SUPABASE_TENANT_ID || 'shbiitaxhncsjstijcql';

async function scan() {
    for (const region of regions) {
        const host = `${region}.pooler.supabase.com`;
        const uri = `postgresql://postgres.${tenant}:${pwd}@${host}:6543/postgres`;
        const client = new Client({
            connectionString: uri,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 3000
        });

        try {
            await client.connect();
            console.log(`✅ FOUND IT! Working region is: ${region}`);
            console.log(`URL: ${uri}`);
            await client.end();
            process.exit(0);
        } catch (e) {
            if (e.code === 'XX000') {
                // Tenant not found -> wrong region
            } else {
                console.log(`[${region}] ERR: ${e.message} (Code: ${e.code})`);
            }
        }
    }
    console.log('❌ Could not find valid pooler in tested AWS regions.');
}

scan();
