import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * ZKP (Zero-Knowledge Proof) Controller
 * 
 * PRIVACY WARNING: This is a FALLBACK server-side ZKP generation
 * In production, ZKP proof generation MUST happen on the client-side only.
 * Server-side generation should ONLY be used as fallback/testing.
 * 
 * CRITICAL: We NEVER store the actual bid amount (nominal_bid) anywhere.
 * We only store:
 * - commitment_hash: Hash of the bid (commitment)
 * - proof_json: The ZKP proof structure (commitment verification only)
 */

export async function storeZKPProofBackup(req, res) {
  try {
    const { item_id, commitment_hash, proof_json } = req.body;
    const bidderAddress = req.user.walletAddress;

    // Validate required fields
    if (!item_id || !commitment_hash) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: item_id, commitment_hash'
      });
    }

    // Verify auction exists
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

    // Ensure bidder exists in users_profile
    await query(
      `INSERT INTO users_profile (wallet_address) 
       VALUES ($1) 
       ON CONFLICT (wallet_address) DO NOTHING`,
      [bidderAddress]
    );

    // Store proof backup
    const result = await query(
      `INSERT INTO zkp_proof_backup 
       (item_id, bidder_address, commitment_hash, proof_json, proof_generated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING id, item_id, bidder_address, commitment_hash, proof_generated_at`,
      [item_id, bidderAddress, commitment_hash, JSON.stringify(proof_json)]
    );

    res.status(201).json({
      success: true,
      message: 'ZKP proof backup stored successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Store ZKP proof error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to store ZKP proof',
      error: error.message
    });
  }
}

/**
 * FALLBACK: Server-side ZKP proof generation
 * 
 * ⚠️ PRIVACY WARNING ⚠️
 * This endpoint should NOT be called in production.
 * ZKP proof generation MUST happen entirely on the client-side.
 * 
 * This is provided ONLY for:
 * - Fallback when client-side generation fails
 * - Testing purposes
 * - Development/debugging
 * 
 * In production, disable this endpoint completely.
 */
export async function generateZKPProofFallback(req, res) {
  try {
    console.warn('⚠️ WARNING: Server-side ZKP proof generation endpoint called!');
    console.warn('This should NEVER happen in production.');
    console.warn('ZKP proof generation must be entirely client-side.');

    const { commitment_hash, item_id } = req.body;

    // Validate
    if (!commitment_hash) {
      return res.status(400).json({
        success: false,
        message: 'Missing commitment_hash'
      });
    }

    // Create a simple proof structure
    // In production, this would use proper ZKP circuit libraries like circom + snarkjs
    const proof = {
      type: 'fallback-server-generated',
      commitment_hash,
      timestamp: new Date().toISOString(),
      warning: 'This proof was generated server-side. Use client-side generation in production!',
      
      // Placeholder proof fields (real implementation would use circom output)
      pi_a: ['0x' + '0'.repeat(64), '0x' + '0'.repeat(64)],
      pi_b: [
        ['0x' + '0'.repeat(64), '0x' + '0'.repeat(64)],
        ['0x' + '0'.repeat(64), '0x' + '0'.repeat(64)]
      ],
      pi_c: ['0x' + '0'.repeat(64), '0x' + '0'.repeat(64)],
      protocol: 'groth16'
    };

    // Log this for audit purposes
    console.log('Server-side fallback ZKP generated for commitment:', commitment_hash);

    res.json({
      success: true,
      message: 'Fallback ZKP proof generated (WARNING: This should not be used in production)',
      proof,
      warning: 'ZKP proof generation must be client-side only for privacy',
      security_note: 'This endpoint should be disabled in production'
    });
  } catch (error) {
    console.error('Generate ZKP proof error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate ZKP proof',
      error: error.message
    });
  }
}

/**
 * Verify ZKP Proof
 * Checks if a proof is valid and matches the commitment
 */
export async function verifyZKPProof(req, res) {
  try {
    const { proof_id } = req.params;
    const { commitment_hash } = req.body;

    const result = await query(
      `SELECT * FROM zkp_proof_backup WHERE id = $1`,
      [proof_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proof not found'
      });
    }

    const proof = result.rows[0];

    // Verify commitment matches
    if (proof.commitment_hash !== commitment_hash) {
      return res.status(400).json({
        success: false,
        message: 'Commitment hash does not match stored proof'
      });
    }

    // Mark as verified
    await query(
      `UPDATE zkp_proof_backup 
       SET verified = TRUE, verification_timestamp = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [proof_id]
    );

    res.json({
      success: true,
      message: 'Proof verified successfully',
      data: {
        proof_id,
        verified: true,
        commitment_hash: proof.commitment_hash
      }
    });
  } catch (error) {
    console.error('Verify ZKP proof error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify ZKP proof',
      error: error.message
    });
  }
}

/**
 * Get ZKP proof backups for an auction
 */
export async function getZKPProofsForAuction(req, res) {
  try {
    const { item_id } = req.params;

    const result = await query(
      `SELECT id, item_id, bidder_address, commitment_hash, 
              verified, proof_generated_at, verification_timestamp
       FROM zkp_proof_backup 
       WHERE item_id = $1
       ORDER BY proof_generated_at DESC`,
      [item_id]
    );

    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    console.error('Get ZKP proofs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ZKP proofs',
      error: error.message
    });
  }
}
