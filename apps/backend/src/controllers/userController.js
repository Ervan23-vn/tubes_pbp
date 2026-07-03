import { query } from '../config/database.js';

/**
 * User Profile Controller
 */

export async function getUserProfile(req, res) {
  try {
    const walletAddress = req.user.walletAddress;

    const result = await query(
      `SELECT id, wallet_address, username, email, profile_picture_url, 
              bio, verification_status, created_at, updated_at
       FROM users_profile 
       WHERE wallet_address = $1`,
      [walletAddress]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
}

export async function createOrUpdateUserProfile(req, res) {
  try {
    const walletAddress = req.user.walletAddress;
    const { username, email, bio, profile_picture_url } = req.body;

    // Try to insert, or update if already exists
    const result = await query(
      `INSERT INTO users_profile 
       (wallet_address, username, email, bio, profile_picture_url) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (wallet_address) 
       DO UPDATE SET 
         username = COALESCE($2, users_profile.username),
         email = COALESCE($3, users_profile.email),
         bio = COALESCE($4, users_profile.bio),
         profile_picture_url = COALESCE($5, users_profile.profile_picture_url),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [walletAddress, username, email, bio, profile_picture_url]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
}

export async function getUserProfileByAddress(req, res) {
  try {
    const { wallet_address } = req.params;

    const result = await query(
      `SELECT id, wallet_address, username, email, profile_picture_url, 
              bio, verification_status, created_at
       FROM users_profile 
       WHERE wallet_address = $1`,
      [wallet_address]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
}

export async function getUserStats(req, res) {
  try {
    const userAddress = req.user.walletAddress;

    // Get auctions created (if seller)
    const sellerStats = await query(
      `SELECT COUNT(*) as total_auctions,
              COUNT(CASE WHEN auction_status = 'active' THEN 1 END) as active_auctions,
              COUNT(CASE WHEN auction_status = 'ended' THEN 1 END) as ended_auctions
       FROM auctions_metadata 
       WHERE seller_address = $1`,
      [userAddress]
    );

    // Get bids participated (if bidder)
    const bidderStats = await query(
      `SELECT COUNT(*) as total_bids
       FROM zkp_proof_backup 
       WHERE bidder_address = $1`,
      [userAddress]
    );

    res.json({
      success: true,
      data: {
        wallet_address: userAddress,
        seller_stats: sellerStats.rows[0],
        bidder_stats: bidderStats.rows[0]
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user stats',
      error: error.message
    });
  }
}
