import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import { optionalAuth } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

/**
 * Middleware Configuration
 */

// CORS Configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Wallet-Address', 'X-Signature', 'X-Signed-Message', 'X-Auth-Token'],
  exposedHeaders: ['X-Auth-Token']
}));

// Body parsing
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

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
    message: 'Lelang Blockchain Backend API',
    endpoints: {
      health: 'GET /api/health',
      auth: 'POST /api/auth/verify',
      auctions: {
        list: 'GET /api/auctions',
        detail: 'GET /api/auctions/:item_id',
        create: 'POST /api/auctions',
        seller: 'GET /api/auctions/seller/me',
        status: 'PUT /api/auctions/:item_id/status'
      },
      upload: 'POST /api/upload-image',
      notifications: 'GET /api/notifications'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
