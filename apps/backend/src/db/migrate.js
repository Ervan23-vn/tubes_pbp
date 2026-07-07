import { query } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbType = process.env.DB_TYPE || 'sqlite';

async function migrate() {
  try {
    console.log(`Starting database migration for ${dbType}...`);

    if (dbType === 'postgres') {
      // Table 1: users_profile (PostgreSQL)
      await query(`
        CREATE TABLE IF NOT EXISTS users_profile (
          id SERIAL PRIMARY KEY,
          wallet_address VARCHAR(255) UNIQUE NOT NULL,
          username VARCHAR(255),
          email VARCHAR(255),
          profile_picture_url TEXT,
          bio TEXT,
          verification_status VARCHAR(50) DEFAULT 'unverified',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ users_profile table created');

      // Table 2: auctions_metadata (PostgreSQL)
      await query(`
        CREATE TABLE IF NOT EXISTS auctions_metadata (
          id SERIAL PRIMARY KEY,
          item_id VARCHAR(255) UNIQUE NOT NULL,
          seller_address VARCHAR(255) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(255),
          image_url TEXT,
          thumbnail_url TEXT,
          starting_price DOUBLE PRECISION,
          current_highest_bid DOUBLE PRECISION,
          highest_bidder_address VARCHAR(255),
          auction_status VARCHAR(50) DEFAULT 'active',
          start_time TIMESTAMP WITH TIME ZONE,
          end_time TIMESTAMP WITH TIME ZONE,
          total_bids_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (seller_address) REFERENCES users_profile(wallet_address)
        )
      `);
      console.log('✓ auctions_metadata table created');

      // Table 3: zkp_proof_backup (PostgreSQL)
      await query(`
        CREATE TABLE IF NOT EXISTS zkp_proof_backup (
          id SERIAL PRIMARY KEY,
          item_id VARCHAR(255) NOT NULL,
          bidder_address VARCHAR(255) NOT NULL,
          commitment_hash VARCHAR(255) NOT NULL,
          proof_json TEXT,
          proof_generated_at TIMESTAMP WITH TIME ZONE,
          verified INTEGER DEFAULT 0,
          verification_timestamp TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (item_id) REFERENCES auctions_metadata(item_id),
          FOREIGN KEY (bidder_address) REFERENCES users_profile(wallet_address)
        )
      `);
      console.log('✓ zkp_proof_backup table created');

      // Table 4: notifications (PostgreSQL)
      await query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_address VARCHAR(255) NOT NULL,
          notification_type VARCHAR(100),
          title VARCHAR(255),
          message TEXT,
          item_id VARCHAR(255),
          related_data TEXT,
          is_read INTEGER DEFAULT 0,
          read_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_address) REFERENCES users_profile(wallet_address)
        )
      `);
      console.log('✓ notifications table created');

      // Indexes for PostgreSQL
      // PostgreSQL handles standard CREATE INDEX IF NOT EXISTS perfectly
      await query(`CREATE INDEX IF NOT EXISTS idx_auction_status ON auctions_metadata(auction_status)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_seller_address ON auctions_metadata(seller_address)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_zkp_item_id ON zkp_proof_backup(item_id)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_address)`);
      console.log('✓ All indexes created');

    } else {
      // Create data directory if not exists (SQLite)
      const dataDir = path.join(__dirname, '../../data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('✓ Data directory created');
      }

      // Table 1: users_profile (SQLite)
      await query(`
        CREATE TABLE IF NOT EXISTS users_profile (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          wallet_address TEXT UNIQUE NOT NULL,
          username TEXT,
          email TEXT,
          profile_picture_url TEXT,
          bio TEXT,
          verification_status TEXT DEFAULT 'unverified',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ users_profile table created');

      // Table 2: auctions_metadata (SQLite)
      await query(`
        CREATE TABLE IF NOT EXISTS auctions_metadata (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_id TEXT UNIQUE NOT NULL,
          seller_address TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          category TEXT,
          image_url TEXT,
          thumbnail_url TEXT,
          starting_price REAL,
          current_highest_bid REAL,
          highest_bidder_address TEXT,
          auction_status TEXT DEFAULT 'active',
          start_time DATETIME,
          end_time DATETIME,
          total_bids_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (seller_address) REFERENCES users_profile(wallet_address)
        )
      `);
      console.log('✓ auctions_metadata table created');

      // Table 3: zkp_proof_backup (SQLite)
      await query(`
        CREATE TABLE IF NOT EXISTS zkp_proof_backup (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_id TEXT NOT NULL,
          bidder_address TEXT NOT NULL,
          commitment_hash TEXT NOT NULL,
          proof_json TEXT,
          proof_generated_at DATETIME,
          verified INTEGER DEFAULT 0,
          verification_timestamp DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (item_id) REFERENCES auctions_metadata(item_id),
          FOREIGN KEY (bidder_address) REFERENCES users_profile(wallet_address)
        )
      `);
      console.log('✓ zkp_proof_backup table created');

      // Table 4: notifications (SQLite)
      await query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_address TEXT NOT NULL,
          notification_type TEXT,
          title TEXT,
          message TEXT,
          item_id TEXT,
          related_data TEXT,
          is_read INTEGER DEFAULT 0,
          read_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_address) REFERENCES users_profile(wallet_address)
        )
      `);
      console.log('✓ notifications table created');

      await query(`CREATE INDEX IF NOT EXISTS idx_auction_status ON auctions_metadata(auction_status)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_seller_address ON auctions_metadata(seller_address)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_zkp_item_id ON zkp_proof_backup(item_id)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_address)`);
      console.log('✓ All indexes created');
    }

    console.log('✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
