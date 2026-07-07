import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbType = process.env.DB_TYPE || 'sqlite';

let dbSqlite;
let pgPool;

if (dbType === 'postgres') {
  const { Pool } = pg;
  pgPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'lelang_db',
    user: process.env.DB_USER || 'lelang_user',
    password: process.env.DB_PASSWORD || 'lelang_secure_pass_2024',
  });
} else {
  // Dynamic import: hanya memuat better-sqlite3 jika DB_TYPE bukan postgres
  const { default: Database } = await import('better-sqlite3');
  const dbPath = path.join(__dirname, '../../data/lelang.db');
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  dbSqlite = new Database(dbPath);
  dbSqlite.pragma('foreign_keys = ON');
}

/**
 * Async wrapper for database queries
 * Supports both PostgreSQL and SQLite dynamically
 */
export async function query(sql, params = []) {
  if (dbType === 'postgres') {
    const res = await pgPool.query(sql, params);
    return {
      rows: res.rows,
      rowCount: res.rowCount
    };
  } else {
    return new Promise((resolve, reject) => {
      try {
        let convertedSql = sql;
        const convertedParams = params.map(param => {
          if (param instanceof Date) {
            return param.toISOString();
          }
          return param;
        });
        
        if (sql.includes('$')) {
          convertedSql = sql.replace(/\$\d+/g, '?');
        }

        const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
        const hasReturning = sql.trim().toUpperCase().includes('RETURNING');

        if (isSelect || hasReturning) {
          const stmt = dbSqlite.prepare(convertedSql);
          const rows = stmt.all(...convertedParams);
          resolve({ 
            rows: rows,
            rowCount: rows.length
          });
        } else {
          const stmt = dbSqlite.prepare(convertedSql);
          const info = stmt.run(...convertedParams);
          resolve({ 
            rowCount: info.changes,
            lastID: info.lastInsertRowid
          });
        }
      } catch (error) {
        console.error('Database query error:', error);
        console.error('SQL:', sql);
        console.error('Params:', params);
        reject(error);
      }
    });
  }
}

export function getClient() {
  return dbType === 'postgres' ? pgPool : dbSqlite;
}

export default dbType === 'postgres' ? pgPool : dbSqlite;
