require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  try {
    await client.connect();
    console.log('Connected to DB');
    
    // Add status column
    await client.query(`
      ALTER TABLE reviews 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
    `);
    
    // Add admin_response column
    await client.query(`
      ALTER TABLE reviews 
      ADD COLUMN IF NOT EXISTS admin_response TEXT;
    `);
    
    console.log('Migration successful: status and admin_response added to reviews.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
