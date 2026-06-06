import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const MAX_RETRIES = 5;
const RETRY_DELAY = 3000;

/**
 * Initialize database schema (idempotent setup)
 * - Reads SQL file
 * - Executes it to ensure tables exist
 * - Retries if the database is not ready yet
 */
export const initDb = async (): Promise<void> => {
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    try {
      const client = await pool.connect();
      const sql = fs.readFileSync(
        path.join(__dirname, '../models/auth.model.sql'),
        'utf-8'
      );
      await client.query(sql);
      client.release();
      console.log('Auth database initialized successfully');
      return;
    } catch (err) {
      attempts++;
      console.error(`DB connection attempt ${attempts} failed:`, err);
      if (attempts >= MAX_RETRIES) {
        console.error('Max retries reached. Exiting.');
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
};
