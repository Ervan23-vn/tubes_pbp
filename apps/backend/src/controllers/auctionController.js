import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Auction Controller - Handle all auction-related operations
 * Note: NEVER store actual bid amounts (nominal_bid) in database
 */

export async function getAllAuctions(req, res) {
  try {
    const result = await query(
      `SELECT id, item_id, title, description, category, image_url, 
              thumbnail_url, starting_price, current_highest_bid, 
              highest_bidder_address, auction_status, start_time, 
              end_time, total_bids_count, created_at, updated_at
       FROM auctions_metadata 
       WHERE auction_status = 'active' OR auction_status = 'ended'
       ORDER BY created_at DESC 
       LIMIT 50`
    );

    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    console.error('Get auctions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch auctions',
      error: error.message
    });
  }
}

export async function getAuctionByItemId(req, res) {
  try {
    const { item_id } = req.params;

    const result = await query(
      `SELECT * FROM auctions_metadata WHERE item_id = $1`,
      [item_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get auction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch auction',
      error: error.message
    });
  }
}

export async function createAuction(req, res) {
  try {
    const { 
      title, 
      description, 
      category, 
      starting_price, 
      start_time, 
      end_time,
      image_url,
      thumbnail_url 
    } = req.body;

    const sellerAddress = req.user.walletAddress;
    const itemId = uuidv4();

    // Validate required fields
    if (!title || !starting_price || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Ensure seller exists in users_profile
    await query(
      `INSERT INTO users_profile (wallet_address) 
       VALUES ($1) 
       ON CONFLICT (wallet_address) DO NOTHING`,
      [sellerAddress]
    );

    // Create auction
    const result = await query(
      `INSERT INTO auctions_metadata 
       (item_id, seller_address, title, description, category, 
        image_url, thumbnail_url, starting_price, 
        start_time, end_time, auction_status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        itemId,
        sellerAddress,
        title,
        description,
        category,
        image_url,
        thumbnail_url,
        starting_price,
        new Date(start_time),
        new Date(end_time),
        'active'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Auction created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create auction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create auction',
      error: error.message
    });
  }
}

export async function updateAuctionStatus(req, res) {
  try {
    const { item_id } = req.params;
    const { auction_status } = req.body;
    const sellerAddress = req.user.walletAddress;

    // Verify seller owns this auction
    const auctionResult = await query(
      `SELECT * FROM auctions_metadata WHERE item_id = $1`,
      [item_id]
    );

    if (auctionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    if (auctionResult.rows[0].seller_address !== sellerAddress) {
      return res.status(403).json({
        success: false,
        message: 'Only seller can update auction status'
      });
    }

    // Update status
    const result = await query(
      `UPDATE auctions_metadata 
       SET auction_status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE item_id = $2
       RETURNING *`,
      [auction_status, item_id]
    );

    res.json({
      success: true,
      message: 'Auction status updated',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update auction status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update auction status',
      error: error.message
    });
  }
}

export async function getAuctionsBySellerAddress(req, res) {
  try {
    const sellerAddress = req.user.walletAddress;

    const result = await query(
      `SELECT * FROM auctions_metadata 
       WHERE seller_address = $1
       ORDER BY created_at DESC`,
      [sellerAddress]
    );

    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    console.error('Get seller auctions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch auctions',
      error: error.message
    });
  }
}
