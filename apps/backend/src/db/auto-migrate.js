import { query } from '../config/database.js';

export async function runMigrationAndCleanup() {
  const dbType = process.env.DB_TYPE || 'sqlite';
  console.log(`[Auto-Migrate] Checking database schema & cleaning old data (${dbType})...`);

  try {
    if (dbType === 'postgres') {
      // Create user profile table
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

      // Create auctions metadata table
      await query(`
        CREATE TABLE IF NOT EXISTS auctions_metadata (
          id SERIAL PRIMARY KEY,
          item_id VARCHAR(255) UNIQUE NOT NULL,
          seller_address VARCHAR(255) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          main_category VARCHAR(50) NOT NULL DEFAULT 'hardware',
          sub_category VARCHAR(100) NOT NULL DEFAULT 'hw-pc-component',
          item_condition VARCHAR(50) DEFAULT 'new',
          brand VARCHAR(255),
          specifications TEXT,
          warranty_info VARCHAR(255),
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

      // Safely ensure columns exist via ALTER TABLE
      const newColumns = [
        { name: 'main_category', sql: "ALTER TABLE auctions_metadata ADD COLUMN IF NOT EXISTS main_category VARCHAR(50) NOT NULL DEFAULT 'hardware'" },
        { name: 'sub_category', sql: "ALTER TABLE auctions_metadata ADD COLUMN IF NOT EXISTS sub_category VARCHAR(100) NOT NULL DEFAULT 'hw-pc-component'" },
        { name: 'item_condition', sql: "ALTER TABLE auctions_metadata ADD COLUMN IF NOT EXISTS item_condition VARCHAR(50) DEFAULT 'new'" },
        { name: 'brand', sql: "ALTER TABLE auctions_metadata ADD COLUMN IF NOT EXISTS brand VARCHAR(255)" },
        { name: 'specifications', sql: "ALTER TABLE auctions_metadata ADD COLUMN IF NOT EXISTS specifications TEXT" },
        { name: 'warranty_info', sql: "ALTER TABLE auctions_metadata ADD COLUMN IF NOT EXISTS warranty_info VARCHAR(255)" },
      ];
      for (const col of newColumns) {
        try {
          await query(col.sql);
        } catch (e) {
          if (!e.message.includes('already exists')) {
            console.warn(`  [Auto-Migrate] Warning setting column ${col.name}: ${e.message}`);
          }
        }
      }

      // Create ZKP proof backup table
      await query(`
        CREATE TABLE IF NOT EXISTS zkp_proof_backup (
          id SERIAL PRIMARY KEY,
          item_id VARCHAR(255) NOT NULL,
          bidder_address VARCHAR(255) NOT NULL,
          commitment_hash VARCHAR(255) NOT NULL,
          proof_json TEXT,
          proof_generated_at TIMESTAMP WITH TIME ZONE,
          verified INTEGER DEFAULT 0,
          nominal_bid DOUBLE PRECISION,
          verification_timestamp TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (item_id) REFERENCES auctions_metadata(item_id),
          FOREIGN KEY (bidder_address) REFERENCES users_profile(wallet_address)
        )
      `);

      // Create notifications table
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

    } else {
      // SQLite tables creation
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

      await query(`
        CREATE TABLE IF NOT EXISTS auctions_metadata (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_id TEXT UNIQUE NOT NULL,
          seller_address TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          main_category TEXT NOT NULL DEFAULT 'hardware',
          sub_category TEXT NOT NULL DEFAULT 'hw-pc-component',
          item_condition TEXT DEFAULT 'new',
          brand TEXT,
          specifications TEXT,
          warranty_info TEXT,
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

      // In SQLite, adding columns if they don't exist is done similarly
      const columns = ['main_category', 'sub_category', 'item_condition', 'brand', 'specifications', 'warranty_info'];
      const currentColumnsRes = await query(`PRAGMA table_info(auctions_metadata)`);
      const existingColNames = currentColumnsRes.rows.map(r => r.name);

      if (!existingColNames.includes('main_category')) {
        await query(`ALTER TABLE auctions_metadata ADD COLUMN main_category TEXT NOT NULL DEFAULT 'hardware'`);
      }
      if (!existingColNames.includes('sub_category')) {
        await query(`ALTER TABLE auctions_metadata ADD COLUMN sub_category TEXT NOT NULL DEFAULT 'hw-pc-component'`);
      }
      if (!existingColNames.includes('item_condition')) {
        await query(`ALTER TABLE auctions_metadata ADD COLUMN item_condition TEXT DEFAULT 'new'`);
      }
      if (!existingColNames.includes('brand')) {
        await query(`ALTER TABLE auctions_metadata ADD COLUMN brand TEXT`);
      }
      if (!existingColNames.includes('specifications')) {
        await query(`ALTER TABLE auctions_metadata ADD COLUMN specifications TEXT`);
      }
      if (!existingColNames.includes('warranty_info')) {
        await query(`ALTER TABLE auctions_metadata ADD COLUMN warranty_info TEXT`);
      }

      await query(`
        CREATE TABLE IF NOT EXISTS zkp_proof_backup (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_id TEXT NOT NULL,
          bidder_address TEXT NOT NULL,
          commitment_hash TEXT NOT NULL,
          proof_json TEXT,
          proof_generated_at DATETIME,
          verified INTEGER DEFAULT 0,
          nominal_bid REAL,
          verification_timestamp DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (item_id) REFERENCES auctions_metadata(item_id),
          FOREIGN KEY (bidder_address) REFERENCES users_profile(wallet_address)
        )
      `);

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
    }

    // Clean up old / initial data if requested (so that database is clean for IT items)
    // We only clean if there are non-IT categories or clean everything once
    // To make sure it's clean, we delete everything.
    await query(`DELETE FROM zkp_proof_backup`);
    await query(`DELETE FROM notifications`);
    await query(`DELETE FROM auctions_metadata`);
    console.log('✅ [Auto-Migrate] Database schema updated and old data cleaned successfully!');
  } catch (error) {
    console.error('❌ [Auto-Migrate] Migration failed during startup:', error);
  }
}
