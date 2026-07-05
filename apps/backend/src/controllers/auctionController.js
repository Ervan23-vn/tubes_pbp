import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { ethers } from 'ethers';

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

export async function revealBid(req, res) {
  try {
    const { item_id } = req.params;
    const { amount, salt, hash } = req.body;
    const bidderAddress = req.user.walletAddress;

    if (!amount || !salt || !hash) {
      return res.status(400).json({
        success: false,
        message: 'Missing reveal parameters: amount, salt, hash'
      });
    }

    // 1. Calculate the hash locally to verify
    const amountInWei = ethers.parseEther(amount.toString());
    const computedHash = ethers.solidityPackedKeccak256(
      ['uint256', 'string'],
      [amountInWei, salt]
    );

    if (computedHash.toLowerCase() !== hash.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Computed hash does not match provided commitment hash'
      });
    }

    // 2. Check if the commitment exists in database for this bidder
    const proofResult = await query(
      `SELECT * FROM zkp_proof_backup 
       WHERE item_id = $1 AND bidder_address = $2 AND commitment_hash = $3`,
      [item_id, bidderAddress, hash]
    );

    if (proofResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commitment hash not found for this user and item'
      });
    }

    // 3. Mark the proof as verified/revealed in database
    await query(
      `UPDATE zkp_proof_backup 
       SET verified = 1, verification_timestamp = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [proofResult.rows[0].id]
    );

    // 4. Fetch current auction details
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

    const auction = auctionResult.rows[0];
    const currentHighestBid = auction.current_highest_bid || auction.starting_price || 0;

    let updated = false;
    if (parseFloat(amount) > parseFloat(currentHighestBid)) {
      // Update highest bid
      await query(
        `UPDATE auctions_metadata 
         SET current_highest_bid = $1, highest_bidder_address = $2, updated_at = CURRENT_TIMESTAMP
         WHERE item_id = $3`,
        [parseFloat(amount), bidderAddress, item_id]
      );
      updated = true;
    }

    res.json({
      success: true,
      message: 'Bid successfully revealed and verified',
      data: {
        hash,
        amount,
        isHighest: updated
      }
    });

  } catch (error) {
    console.error('Reveal bid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reveal bid',
      error: error.message
    });
  }
}

export async function claimAuctionAsset(req, res) {
  try {
    const { item_id } = req.params;
    const bidderAddress = req.user.walletAddress;

    // Fetch auction details
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

    const auction = auctionResult.rows[0];

    // Check if the caller is the highest bidder
    if (auction.highest_bidder_address !== bidderAddress) {
      return res.status(403).json({
        success: false,
        message: 'Only the winner can claim this asset'
      });
    }

    // Create notification for successful claim
    await query(
      `INSERT INTO notifications (user_address, notification_type, title, message, item_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        bidderAddress,
        'claim_success',
        'Klaim Aset Berhasil!',
        `Selamat! Anda telah berhasil mengklaim kepemilikan aset digital "${auction.title}" melalui jaringan blockchain.`,
        item_id
      ]
    );

    res.json({
      success: true,
      message: 'Asset successfully claimed on blockchain'
    });

  } catch (error) {
    console.error('Claim asset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to claim asset',
      error: error.message
    });
  }
}

export async function refundCollateral(req, res) {
  try {
    const { item_id } = req.params;
    const bidderAddress = req.user.walletAddress;

    // Fetch auction details
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

    const auction = auctionResult.rows[0];

    // Check if the caller is NOT the highest bidder
    if (auction.highest_bidder_address === bidderAddress) {
      return res.status(400).json({
        success: false,
        message: 'Winner cannot refund collateral; their funds are used to pay for the won asset'
      });
    }

    // Create notification for successful refund
    await query(
      `INSERT INTO notifications (user_address, notification_type, title, message, item_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        bidderAddress,
        'refund_success',
        'Jaminan Dana Dikembalikan',
        `Dana jaminan Anda untuk lelang "${auction.title}" telah dicairkan dan dikembalikan ke alamat wallet Anda.`,
        item_id
      ]
    );

    res.json({
      success: true,
      message: 'Collateral successfully refunded to wallet address'
    });

  } catch (error) {
    console.error('Refund collateral error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refund collateral',
      error: error.message
    });
  }
}
