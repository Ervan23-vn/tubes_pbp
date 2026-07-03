import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * SQLite3 Database Connection (for development)
 * Using better-sqlite3 for synchronous operations with async wrapper
 * In production, use PostgreSQL with connection pooling
 */
import fs from 'fs';

const dbPath = path.join(__dirname, '../../data/lelang.db');

// Ensure data directory exists before opening SQLite database
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Async wrapper for database queries
 * Converts SQLite3 parameterized queries to work with existing code
 * 
 * Supports:
 * - PostgreSQL-style parameters ($1, $2, etc.) - converted to ?
 * - Array parameters
 */
export async function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      // Convert PostgreSQL-style parameters ($1, $2) to SQLite (?)
      let convertedSql = sql;
      let convertedParams = params;
      
      if (sql.includes('$')) {
        convertedSql = sql.replace(/\$\d+/g, '?');
      }

      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const stmt = db.prepare(convertedSql);
        const rows = stmt.all(...convertedParams);
        resolve({ 
          rows: rows,
          rowCount: rows.length
        });
      } else {
        const stmt = db.prepare(convertedSql);
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

export function getClient() {
  return db;
}

export default db;


