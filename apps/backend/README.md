# Lelang Blockchain Backend API

**TAHAP F - Backend API & Database (Off-chain Layer)**

## Overview

This is the backend API server for the Lelang Blockchain auction system. It provides:

- REST API for auction management
- PostgreSQL database integration
- User profile management
- ZKP proof storage and verification
- Image upload and management
- Keplr wallet-based authentication
- Real-time notifications

## Architecture

```
Frontend (React) 
    ↓ HTTP/REST
Backend API (Node.js + Express)
    ↓
PostgreSQL Database
    ↓
Blockchain RPC (CosmJS)
```

## Features

✅ **Authentication:** Keplr wallet signature verification  
✅ **Auction Management:** Create, list, and manage auctions  
✅ **User Profiles:** Wallet-based user management  
✅ **Image Upload:** Secure image upload for auctions  
✅ **Notifications:** Event-driven notification system  
✅ **ZKP Backup:** Store zero-knowledge proof structures  
✅ **Privacy First:** Never stores actual bid amounts  
✅ **Database:** PostgreSQL with proper indexing  

## Prerequisites

- **Node.js** v16 or higher
- **PostgreSQL** v12 or higher
- **npm** package manager

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy `.env` template and configure:

```bash
# Edit .env with your configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lelang_db
DB_USER=lelang_user
DB_PASSWORD=your_secure_password
```

### 3. Database Setup

#### Create PostgreSQL Database

```bash
# Using psql
psql -U postgres

# In psql
CREATE DATABASE lelang_db;
CREATE USER lelang_user WITH PASSWORD 'lelang_secure_pass_2024';
ALTER ROLE lelang_user SET client_encoding TO 'utf8';
ALTER ROLE lelang_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE lelang_user SET default_transaction_deferrable TO on;
ALTER ROLE lelang_user SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE lelang_db TO lelang_user;
\q
```

#### Run Migrations

```bash
npm run migrate
```

This will:
- Create `users_profile` table
- Create `auctions_metadata` table
- Create `zkp_proof_backup` table
- Create `notifications` table
- Create database indexes

## Running the Server

### Development Mode

```bash
npm run dev
```

This uses `nodemon` for hot-reload.

```
🚀 Lelang Blockchain Backend API
TAHAP F - Backend API & Database

✓ Server running on port 3001
✓ Environment: development
✓ Database: lelang_db
✓ CORS enabled: http://localhost:5173,http://localhost:3000

📍 API URL: http://localhost:3001/api
📍 Health: http://localhost:3001/api/health
```

### Production Mode

```bash
npm start
```

## API Documentation

Full API documentation is available in `/docs/api-spec.md`

### Quick Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/auctions` | List all auctions |
| GET | `/api/auctions/:item_id` | Get auction details |
| POST | `/api/auctions` | Create new auction |
| POST | `/api/upload-image` | Upload image |
| GET | `/api/notifications` | Get notifications |
| PUT | `/api/users/me` | Update profile |
| POST | `/api/zkp-proxy/store-proof` | Store ZKP proof |

## Testing

### Health Check

```bash
curl http://localhost:3001/api/health
```

### Test Authentication

```bash
# 1. Get auth endpoint
curl -X POST http://localhost:3001/api/auth/verify \
  -H "X-Wallet-Address: cosmos1test..." \
  -H "X-Signature: base64_signature" \
  -H "X-Signed-Message: {\"timestamp\":\"2024-06-27T10:00:00Z\"}"

# 2. Use returned JWT token for authenticated requests
curl http://localhost:3001/api/users/me \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Test Auction Creation

```bash
curl -X POST http://localhost:3001/api/auctions \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Auction",
    "description": "Test item for auction",
    "category": "test",
    "starting_price": "100.00",
    "start_time": "2024-06-27T08:00:00Z",
    "end_time": "2024-06-29T20:00:00Z"
  }'
```

### Test Image Upload

```bash
curl -X POST http://localhost:3001/api/upload-image \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "image=@/path/to/image.jpg" \
  -F "purpose=auction"
```

## Database Schema

### users_profile
- wallet_address (primary identifier)
- username, email, bio
- profile_picture_url
- verification_status
- Created/updated timestamps

### auctions_metadata
- item_id (UUID)
- seller_address (foreign key)
- title, description, category
- image_url, thumbnail_url
- starting_price, current_highest_bid
- auction_status (active/ended/cancelled)
- start_time, end_time
- **NOTE:** Does NOT store actual bid amounts

### zkp_proof_backup
- item_id (foreign key)
- bidder_address (foreign key)
- commitment_hash (hash only, not bid amount)
- proof_json (ZKP proof structure)
- verified status
- **PRIVACY:** Never stores actual bid amounts

### notifications
- user_address (foreign key)
- notification_type
- title, message
- item_id
- is_read, read_at
- related_data (JSON)

## Security Considerations

### Privacy First
⚠️ **CRITICAL:** The database NEVER stores actual bid amounts (`nominal_bid`). Only:
- Commitment hashes (H(bid + salt))
- ZKP proof structures
- Verification status

### Authentication
- Keplr wallet signature verification
- JWT tokens (7-day expiry)
- Signature tokens (5-minute expiry)

### File Uploads
- File type validation (jpg, jpeg, png, webp)
- File size limit (5MB)
- Directory traversal prevention
- Unique filename generation

### Database Security
- SQL queries use prepared statements
- Foreign key constraints
- Proper indexing for performance
- Connection pooling

## Environment Variables

```
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lelang_db
DB_USER=lelang_user
DB_PASSWORD=lelang_secure_pass_2024

# Blockchain
CHAIN_RPC_URL=http://localhost:26657
CHAIN_ID=lelang-testnet

# Authentication
JWT_SECRET=lelang_jwt_secret_key_2024

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_EXTENSIONS=jpg,jpeg,png,webp

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

## Project Structure

```
apps/backend/
├── src/
│   ├── index.js                 # Main server entry point
│   ├── config/
│   │   └── database.js          # PostgreSQL connection config
│   ├── middleware/
│   │   └── auth.js              # Keplr wallet authentication
│   ├── controllers/
│   │   ├── auctionController.js
│   │   ├── userController.js
│   │   ├── notificationController.js
│   │   ├── uploadController.js
│   │   └── zkpController.js
│   ├── routes/
│   │   └── api.js               # REST API routes
│   └── db/
│       └── migrate.js           # Database migrations
├── .env                         # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:** Ensure PostgreSQL is running:
```bash
# macOS
brew services start postgresql

# Ubuntu/Debian
sudo systemctl start postgresql

# Windows
# Start PostgreSQL service via Services.msc
```

### Migration Error

```bash
# Check database credentials in .env
# Ensure database and user exist

# Try manual connection
psql -h localhost -U lelang_user -d lelang_db
```

### Port Already in Use

```bash
# Find and kill process using port 3001
lsof -i :3001
kill -9 <PID>
```

### CORS Error

Update `CORS_ORIGIN` in `.env`:
```
CORS_ORIGIN=http://localhost:5173,http://localhost:3000,http://your-frontend-url
```

## Development Notes

### Adding New Endpoints

1. Create controller in `src/controllers/`
2. Add route in `src/routes/api.js`
3. Document in `/docs/api-spec.md`
4. Test with curl or Postman

### Database Changes

1. Modify schema in `src/db/migrate.js`
2. Run `npm run migrate` to apply
3. Backup production database before changes

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Enable HTTPS only
- [ ] Configure proper database backups
- [ ] Set up monitoring and logging
- [ ] Disable server-side ZKP generation
- [ ] Implement rate limiting
- [ ] Set up SSL certificates

### Database Backup

```bash
pg_dump -h localhost -U lelang_user lelang_db > backup.sql

# Restore
psql -h localhost -U lelang_user lelang_db < backup.sql
```

## Support

For issues or questions, refer to the main project documentation or contact the development team.

## License

Part of Lelang Blockchain Auction System - Educational Project

---

**Last Updated:** 2024  
**Status:** TAHAP F - Backend API & Database (Active Development)
