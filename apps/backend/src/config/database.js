import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Mengunci sistem agar selalu menggunakan postgres
const dbType = 'postgres';

const { Pool } = pg;
const pgPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'lelang_db',
  user: process.env.DB_USER || 'lelang_user',
  password: process.env.DB_PASSWORD || 'lelang_secure_pass_2024',
});

/**
 * Async wrapper for database queries
 * Dedicated for PostgreSQL
 */
export async function query(sql, params = []) {
  try {
    const res = await pgPool.query(sql, params);
    return {
      rows: res.rows,
      rowCount: res.rowCount
    };
  } catch (error) {
    console.error('Database query error:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
}

export function getClient() {
  return pgPool;
}

export default pgPool;