import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { getPoolInstance, hasDownloadCountColumn } from "./lib/db/core";
import { logger } from "./lib/logger";

async function check() {
  const pool = getPoolInstance();
  if (!pool) {
    console.error("No pool instance");
    return;
  }
  
  const hasDownload = await hasDownloadCountColumn();
  console.log("Has download_count column:", hasDownload);
  
  const products = await pool.query(`
    SELECT id, title, download_count FROM products LIMIT 5
  `);
  console.log("Products Sample:", JSON.stringify(products.rows, null, 2));
  
  const ratings = await pool.query(`
    SELECT * FROM product_ratings LIMIT 5
  `);
  console.log("Ratings Sample:", JSON.stringify(ratings.rows, null, 2));
  
  process.exit(0);
}

check().catch(console.error);
