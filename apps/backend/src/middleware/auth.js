import crypto from 'crypto';
import jwt from 'jsonwebtoken';

/**
 * TAHAP F: Middleware Autentikasi Keplr Wallet Signature
 * 
 * This middleware verifies that requests are signed by a valid Keplr wallet.
 * Instead of storing passwords, users sign messages with their private key.
 * 
 * Expected headers:
 * - X-Wallet-Address: User's cosmos wallet address
 * - X-Signature: Signed message from Keplr wallet
 * - X-Signed-Message: The original message that was signed
 */

const JWT_SECRET = process.env.JWT_SECRET || 'lelang_jwt_secret_key_2024';
const SIGNATURE_EXPIRY = 5 * 60 * 1000; // 5 minutes

/**
 * Verify Keplr wallet signature
 * In production, this would use Keplr SDK's verification methods
 */
export function verifySignature(message, signature, publicKey) {
  try {
    // This is a simplified verification. In production:
    // 1. Use @cosmjs/amino for proper signature verification
    // 2. Recover public key from signature
    // 3. Verify message hash
    
    // For this implementation, we'll do basic validation
    const messageHash = crypto
      .createHash('sha256')
      .update(message)
      .digest('hex');
    
    // In real scenario, use Keplr SDK to verify
    // For now, accept if signature exists and is not empty
    return signature && signature.length > 0;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Middleware: Keplr Wallet Authentication
 * Verifies wallet signature and issues JWT token
 */
export function authMiddleware(req, res, next) {
  try {
    const walletAddress = req.headers['x-wallet-address'] || req.body.wallet_address || req.body.walletAddress;
    let signature = req.headers['x-signature'] || req.body.signature;
    const signedMessage = req.headers['x-signed-message'] || req.body.message || req.body.signedMessage;
    const token = req.headers['authorization'];

    // Convert object signature (from some Keplr responses) to string representation if needed
    if (signature && typeof signature === 'object') {
      signature = signature.signature || JSON.stringify(signature);
    }

    // If token provided, verify JWT instead of signature
    if (token && token.startsWith('Bearer ')) {
      const jwtToken = token.slice(7);
      try {
        const decoded = jwt.verify(jwtToken, JWT_SECRET);
        req.user = {
          walletAddress: decoded.walletAddress,
          authenticated: true
        };
        return next();
      } catch (err) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }
    }

    // If no wallet info, request authentication
    if (!walletAddress || !signature || !signedMessage) {
      return res.status(401).json({
        success: false,
        message: 'Missing wallet authentication headers or body parameters',
        required_params: [
          'wallet_address (or X-Wallet-Address header)',
          'signature (or X-Signature header)',
          'message (or X-Signed-Message header)'
        ]
      });
    }

    // Verify signature
    const isValidSignature = verifySignature(signedMessage, signature, walletAddress);
    if (!isValidSignature) {
      return res.status(401).json({
        success: false,
        message: 'Invalid wallet signature'
      });
    }

    // Check message timestamp (must be recent)
    try {
      // Find timestamp in message string or parse JSON
      let msgTime;
      if (signedMessage.includes('"timestamp"')) {
        const messageData = JSON.parse(signedMessage);
        msgTime = new Date(messageData.timestamp).getTime();
      } else {
        // Try to match ISO timestamp pattern in plain text
        const match = signedMessage.match(/Timestamp:\s*([^\n]+)/);
        if (match) {
          msgTime = new Date(match[1].trim()).getTime();
        }
      }
      
      if (msgTime) {
        const currentTime = Date.now();
        if (currentTime - msgTime > SIGNATURE_EXPIRY) {
          return res.status(401).json({
            success: false,
            message: 'Signature expired. Please sign a new message.'
          });
        }
      }
    } catch (err) {
      console.log('Note: Message parsing for timestamp check bypassed');
    }

    // Create JWT token for future requests
    const jwtToken = jwt.sign(
      { walletAddress },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set user and token in request
    req.user = {
      walletAddress,
      authenticated: true
    };
    req.authToken = jwtToken;

    // Store token in response headers for client to use
    res.setHeader('X-Auth-Token', jwtToken);

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
}

/**
 * Optional: Middleware to check authentication without requiring wallet signature every time
 * Uses JWT token from Authorization header
 */
export function optionalAuth(req, res, next) {
  try {
    const token = req.headers['authorization'];
    
    if (token && token.startsWith('Bearer ')) {
      const jwtToken = token.slice(7);
      try {
        const decoded = jwt.verify(jwtToken, JWT_SECRET);
        req.user = {
          walletAddress: decoded.walletAddress,
          authenticated: true
        };
      } catch (err) {
        req.user = { authenticated: false };
      }
    } else {
      req.user = { authenticated: false };
    }
    
    next();
  } catch (error) {
    req.user = { authenticated: false };
    next();
  }
}

export function requireAuth(req, res, next) {
  if (req.user && req.user.authenticated) {
    return next();
  }

  const token = req.headers['authorization'];
  if (token && token.startsWith('Bearer ')) {
    const jwtToken = token.slice(7);
    try {
      const decoded = jwt.verify(jwtToken, JWT_SECRET);
      req.user = {
        walletAddress: decoded.walletAddress,
        authenticated: true
      };
      return next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  }

  // Fallback to signature headers check on the fly
  const walletAddress = req.headers['x-wallet-address'];
  const signature = req.headers['x-signature'];
  const signedMessage = req.headers['x-signed-message'];
  if (walletAddress && signature && signedMessage) {
    const isValidSignature = verifySignature(signedMessage, signature, walletAddress);
    if (isValidSignature) {
      req.user = {
        walletAddress,
        authenticated: true
      };
      return next();
    }
  }

  return res.status(401).json({
    success: false,
    message: 'Authentication required'
  });
}
