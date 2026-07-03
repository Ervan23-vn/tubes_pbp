import { query } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Database Migration - Initialize all required tables for SQLite3
 * Tables:
 * - users_profile: User information (wallet address, profile data)
 * - auctions_metadata: Auction metadata (images, descriptions, seller info)
 * - zkp_proof_backup: Backup of ZKP proofs (for audit trail, NOT bid amounts)
 * - notifications: User notifications for auction events
 */

function migrate() {
  try {
    console.log('Starting database migration...');

    // Create data directory if not exists
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('✓ Data directory created');
    }

    // Table 1: users_profile
    query(`
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

    // Table 2: auctions_metadata
    query(`
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
        
        -- Note: NEVER store nominal_bid amount in database
        -- Only store commitments and ZKP proofs
        total_bids_count INTEGER DEFAULT 0,
        
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (seller_address) REFERENCES users_profile(wallet_address)
      )
    `);
    console.log('✓ auctions_metadata table created');

    // Table 3: zkp_proof_backup
    query(`
      CREATE TABLE IF NOT EXISTS zkp_proof_backup (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id TEXT NOT NULL,
        bidder_address TEXT NOT NULL,
        commitment_hash TEXT NOT NULL,
        proof_json TEXT,
        proof_generated_at DATETIME,
        verified INTEGER DEFAULT 0,
        verification_timestamp DATETIME,
        
        -- CRITICAL: Store ONLY the ZKP proof structure, never the actual bid amount
        -- This is for audit trail and verification purposes only
        
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (item_id) REFERENCES auctions_metadata(item_id),
        FOREIGN KEY (bidder_address) REFERENCES users_profile(wallet_address)
      )
    `);
    console.log('✓ zkp_proof_backup table created');

    // Table 4: notifications
    query(`
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

    // Create indexes for performance
    query(`CREATE INDEX IF NOT EXISTS idx_auction_status ON auctions_metadata(auction_status)`);
    query(`CREATE INDEX IF NOT EXISTS idx_seller_address ON auctions_metadata(seller_address)`);
    query(`CREATE INDEX IF NOT EXISTS idx_zkp_item_id ON zkp_proof_backup(item_id)`);
    query(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_address)`);
    
    console.log('✓ All indexes created');
    console.log('✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
