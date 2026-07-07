import express from 'express';
import multer from 'multer';
import { optionalAuth, requireAuth, authMiddleware } from '../middleware/auth.js';

// Controllers
import * as auctionController from '../controllers/auctionController.js';
import * as notificationController from '../controllers/notificationController.js';
import * as userController from '../controllers/userController.js';
import * as uploadController from '../controllers/uploadController.js';
import * as zkpController from '../controllers/zkpController.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880
  }
});

/**
 * ============================================
 * HEALTH CHECK & AUTH ENDPOINTS
 * ============================================
 */

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend API is running',
    version: '1.0.0'
  });
});

/**
 * Auth verification endpoint
 * Test if wallet signature is valid
 */
router.post('/auth/verify', authMiddleware, (req, res) => {
  const token = req.authToken || res.getHeader('X-Auth-Token');
  res.json({
    success: true,
    message: 'Wallet signature verified',
    user: {
      wallet_address: req.user.walletAddress,
      authenticated: true
    },
    data: {
      token: token,
      wallet_address: req.user.walletAddress
    }
  });
});

/**
 * ============================================
 * AUCTION ENDPOINTS
 * ============================================
 */

// GET /api/auctions - Get all active auctions
router.get('/auctions', optionalAuth, auctionController.getAllAuctions);

// GET /api/auctions/:item_id - Get specific auction by item_id
router.get('/auctions/:item_id', optionalAuth, auctionController.getAuctionByItemId);

// POST /api/auctions - Create new auction (requires auth)
router.post('/auctions', requireAuth, auctionController.createAuction);

// GET /api/auctions/seller/me - Get current user's auctions
router.get('/auctions/seller/me', requireAuth, auctionController.getAuctionsBySellerAddress);

// PUT /api/auctions/:item_id/status - Update auction status (seller only)
router.put('/auctions/:item_id/status', requireAuth, auctionController.updateAuctionStatus);

// POST /api/auctions/:item_id/reveal - Reveal bid amount and salt key
router.post('/auctions/:item_id/reveal', requireAuth, auctionController.revealBid);

// POST /api/auctions/:item_id/claim - Claim auction asset
router.post('/auctions/:item_id/claim', requireAuth, auctionController.claimAuctionAsset);

// POST /api/auctions/:item_id/refund - Refund collateral
router.post('/auctions/:item_id/refund', requireAuth, auctionController.refundCollateral);

/**
 * ============================================
 * UPLOAD ENDPOINTS
 * ============================================
 */

// POST /api/upload-image - Upload image for auction or profile
router.post('/upload-image', requireAuth, upload.single('image'), uploadController.uploadImage);

// GET /api/uploads/:purpose/:filename - Retrieve uploaded image
router.get('/uploads/:purpose/:filename', uploadController.getUploadedImage);

/**
 * ============================================
 * NOTIFICATION ENDPOINTS
 * ============================================
 */

// GET /api/notifications - Get user notifications
router.get('/notifications', requireAuth, notificationController.getUserNotifications);

// POST /api/notifications - Create notification (admin/system only in production)
router.post('/notifications', requireAuth, notificationController.createNotification);

// PUT /api/notifications/:notification_id/read - Mark as read
router.put('/notifications/:notification_id/read', requireAuth, notificationController.markNotificationAsRead);

// GET /api/notifications/unread-count - Get unread notification count
router.get('/notifications/unread-count', requireAuth, notificationController.getUnreadNotificationCount);

/**
 * ============================================
 * USER PROFILE ENDPOINTS
 * ============================================
 */

// GET /api/users/me - Get current user profile
router.get('/users/me', requireAuth, userController.getUserProfile);

// PUT /api/users/me - Update current user profile
router.put('/users/me', requireAuth, userController.createOrUpdateUserProfile);

// GET /api/users/:wallet_address - Get other user's profile (public)
router.get('/users/:wallet_address', optionalAuth, userController.getUserProfileByAddress);

// GET /api/users/me/stats - Get user statistics
router.get('/users/me/stats', requireAuth, userController.getUserStats);

/**
 * ============================================
 * ZKP ENDPOINTS
 * ============================================
 */

// POST /api/zkp-proxy/store-proof - Store ZKP proof backup
router.post('/zkp-proxy/store-proof', requireAuth, zkpController.storeZKPProofBackup);

// POST /api/zkp-proxy/generate-proof - FALLBACK server-side ZKP generation
// ⚠️ WARNING: This should ONLY be used as fallback, never in production
router.post('/zkp-proxy/generate-proof', requireAuth, zkpController.generateZKPProofFallback);

// POST /api/zkp-proxy/verify-proof/:proof_id - Verify ZKP proof
router.post('/zkp-proxy/verify-proof/:proof_id', requireAuth, zkpController.verifyZKPProof);

// GET /api/zkp-proxy/proofs/:item_id - Get all proofs for an auction
router.get('/zkp-proxy/proofs/:item_id', optionalAuth, zkpController.getZKPProofsForAuction);

/**
 * ============================================
 * ERROR HANDLING
 * ============================================
 */

router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

export default router;
