
const { query } = require('./lib/database-mysql');

async function checkSchema() {
  try {
    console.log("Checking notifications table schema...");
    const columns = await query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'notifications'");
    console.log("Columns in 'notifications' table:");
    columns.forEach(col => {
      console.log(`- ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });
  } catch (err) {
    console.error("Error checking schema:", err);
  } finally {
    process.exit();
  }
}

checkSchema();
