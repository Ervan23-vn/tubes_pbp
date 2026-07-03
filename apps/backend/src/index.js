import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import { optionalAuth } from './middleware/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

/**
 * Middleware Configuration
 */

// CORS Configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Wallet-Address', 'X-Signature', 'X-Signed-Message', 'X-Auth-Token']
}));

// Body parsing
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

/**
 * Static file serving
 */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/**
 * TAHAP F: REST API Routes
 */
app.use('/api', apiRoutes);

/**
 * Root endpoint - Documentation
 */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Lelang Blockchain Backend API - TAHAP F',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      health: 'GET /api/health',
      auth: 'POST /api/auth/verify',
      auctions: {
        list: 'GET /api/auctions',
        detail: 'GET /api/auctions/:item_id',
        create: 'POST /api/auctions',
        update_status: 'PUT /api/auctions/:item_id/status'
      },
      notifications: {
        list: 'GET /api/notifications',
        create: 'POST /api/notifications',
        mark_read: 'PUT /api/notifications/:notification_id/read'
      },
      users: {
        me: 'GET /api/users/me',
        update: 'PUT /api/users/me',
        stats: 'GET /api/users/me/stats'
      },
      upload: {
        image: 'POST /api/upload-image'
      },
      zkp: {
        store_proof: 'POST /api/zkp-proxy/store-proof',
        generate_proof: 'POST /api/zkp-proxy/generate-proof',
        verify_proof: 'POST /api/zkp-proxy/verify-proof/:proof_id',
        list_proofs: 'GET /api/zkp-proxy/proofs/:item_id'
      }
    }
  });
});

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

/**
 * Start Server
 */
app.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  🚀 Lelang Blockchain Backend API                     ║');
  console.log('║  TAHAP F - Backend API & Database                     ║');
  console.log('╠═══════════════════════════════════════════════════════╣');
  console.log(`║  ✓ Server running on port ${PORT}`);
  console.log(`║  ✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`║  ✓ Database: ${process.env.DB_NAME}`);
  console.log(`║  ✓ CORS enabled: ${process.env.CORS_ORIGIN}`);
  console.log('║                                                       ║');
  console.log(`║  📍 API URL: http://localhost:${PORT}/api`);
  console.log(`║  📍 Health: http://localhost:${PORT}/api/health`);
  console.log('║                                                       ║');
  console.log('║  Next steps:                                          ║');
  console.log('║  1. Run migrations: npm run migrate                  ║');
  console.log('║  2. Test endpoints with curl or Postman              ║');
  console.log('║                                                       ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('');
});

export default app;
