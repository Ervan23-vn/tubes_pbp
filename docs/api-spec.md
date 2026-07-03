# Lelang Blockchain Backend API Specification

## TAHAP F - Backend API & Database

**Version:** 1.0.0  
**Last Updated:** 2024  
**Status:** Active Development

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
4. [Database Schema](#database-schema)
5. [Error Handling](#error-handling)
6. [Examples](#examples)

---

## Overview

The Lelang Blockchain Backend API provides an off-chain layer for the Lelang blockchain auction system. This backend handles:

- **Auction Metadata Management**: Item descriptions, images, seller information
- **User Profiles**: Wallet-based user management with Keplr integration
- **Notifications**: Event-driven notifications for auction activities
- **ZKP Proof Backup**: Storage of zero-knowledge proof structures (NOT bid amounts)
- **File Uploads**: Image upload and management for auction items

### Key Features

✓ Keplr Wallet signature-based authentication  
✓ PostgreSQL database for persistent storage  
✓ Privacy-preserving (NEVER stores bid amounts)  
✓ RESTful API design  
✓ CORS enabled for frontend integration  

### Architecture

```
┌─────────────────────────────────────────┐
│         Frontend Applications            │
│  (Admin + User React/Vite)              │
└──────────────┬──────────────────────────┘
               │
        HTTP/REST API
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌──────▼──────┐
│ Backend API │  │  PostgreSQL  │
│ (Node.js)   │  │  Database    │
└──────┬──────┘  └──────────────┘
       │
┌──────▼──────────────────────────┐
│  Blockchain Layer (Cosmjs RPC)   │
│  - Auctions module               │
│  - ZKP verification              │
└──────────────────────────────────┘
```

---

## Authentication

### Keplr Wallet Signature Authentication

All protected endpoints require wallet authentication via Keplr signature.

#### Request Headers (Signature-Based)

```
X-Wallet-Address: cosmos1abc123...
X-Signature: base64_encoded_signature
X-Signed-Message: JSON_signed_message
```

#### Example Signed Message

```json
{
  "timestamp": "2024-06-27T10:30:00Z",
  "nonce": "random_value_123",
  "message": "Signing in to Lelang Auction Platform"
}
```

#### Response with JWT Token

After successful verification, the API returns:

```
X-Auth-Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### JWT Token Usage (Subsequent Requests)

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Token Validity

- JWT tokens are valid for **7 days**
- Signature-based auth tokens expire after **5 minutes**

---

## Endpoints

### Health Check

#### GET `/api/health`

Check if the backend is running.

**Response:**
```json
{
  "success": true,
  "message": "Backend API is running",
  "version": "1.0.0"
}
```

---

### Authentication

#### POST `/api/auth/verify`

Verify wallet signature and receive JWT token.

**Headers:**
```
X-Wallet-Address: cosmos1abc123...
X-Signature: base64_encoded_signature
X-Signed-Message: json_string_with_timestamp
```

**Response:**
```json
{
  "success": true,
  "message": "Wallet signature verified",
  "user": {
    "wallet_address": "cosmos1abc123...",
    "authenticated": true
  }
}
```

**Response Headers:**
```
X-Auth-Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Auctions

#### GET `/api/auctions`

Get all active auctions with pagination support.

**Query Parameters:**
- `limit` (optional): Number of results per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `status` (optional): Filter by status (active/ended)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "item_id": "uuid-1234",
      "seller_address": "cosmos1seller...",
      "title": "Antique Vase",
      "description": "Beautiful 100-year-old vase",
      "category": "antiques",
      "image_url": "/uploads/auction/abc123.jpg",
      "thumbnail_url": "/uploads/auction/thumb_abc123.jpg",
      "starting_price": "100.00",
      "current_highest_bid": "150.00",
      "highest_bidder_address": "cosmos1bidder...",
      "auction_status": "active",
      "start_time": "2024-06-27T08:00:00Z",
      "end_time": "2024-06-29T20:00:00Z",
      "total_bids_count": 5,
      "created_at": "2024-06-27T07:30:00Z",
      "updated_at": "2024-06-27T10:15:00Z"
    }
  ],
  "total": 1
}
```

---

#### GET `/api/auctions/:item_id`

Get a specific auction by item_id.

**Parameters:**
- `item_id` (required): UUID of the auction

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "item_id": "uuid-1234",
    "title": "Antique Vase",
    ...
  }
}
```

---

#### POST `/api/auctions`

Create a new auction (requires authentication).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "title": "Antique Vase",
  "description": "Beautiful 100-year-old vase from Ming Dynasty",
  "category": "antiques",
  "starting_price": "100.00",
  "start_time": "2024-06-27T08:00:00Z",
  "end_time": "2024-06-29T20:00:00Z",
  "image_url": "/uploads/auction/abc123.jpg",
  "thumbnail_url": "/uploads/auction/thumb_abc123.jpg"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Auction created successfully",
  "data": {
    "id": 1,
    "item_id": "uuid-1234",
    "seller_address": "cosmos1seller...",
    ...
  }
}
```

---

#### PUT `/api/auctions/:item_id/status`

Update auction status (seller only).

**Parameters:**
- `item_id` (required): UUID of the auction

**Request Body:**
```json
{
  "auction_status": "ended"
}
```

**Valid Statuses:**
- `active`: Auction is ongoing
- `ended`: Auction has finished
- `cancelled`: Auction was cancelled

**Response:**
```json
{
  "success": true,
  "message": "Auction status updated",
  "data": {
    "item_id": "uuid-1234",
    "auction_status": "ended",
    ...
  }
}
```

---

#### GET `/api/auctions/seller/me`

Get current user's auctions (requires authentication).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "item_id": "uuid-1234",
      "title": "Antique Vase",
      ...
    }
  ],
  "total": 1
}
```

---

### File Upload

#### POST `/api/upload-image`

Upload image for auction item or profile picture (requires authentication).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Form Data:**
- `image` (required): Image file (JPEG, PNG, WebP)
- `purpose` (optional): 'auction' or 'profile' (default: 'auction')

**Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "filename": "abc123.jpg",
    "url": "/uploads/auction/abc123.jpg",
    "thumbnail_url": "/uploads/auction/thumb_abc123.jpg",
    "size": 102400,
    "mime_type": "image/jpeg"
  }
}
```

---

#### GET `/api/uploads/:purpose/:filename`

Retrieve uploaded image.

**Parameters:**
- `purpose`: 'auction' or 'profile'
- `filename`: Image filename

**Response:** Binary image data

---

### Notifications

#### GET `/api/notifications`

Get user's notifications (requires authentication).

**Query Parameters:**
- `limit` (optional): Number of notifications per page (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "notification_type": "auction_started",
      "title": "Auction started: Antique Vase",
      "message": "The auction you're interested in has started",
      "item_id": "uuid-1234",
      "is_read": false,
      "read_at": null,
      "created_at": "2024-06-27T08:00:00Z",
      "related_data": {
        "seller": "cosmos1seller...",
        "starting_price": "100.00"
      }
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 20,
    "offset": 0
  }
}
```

---

#### POST `/api/notifications`

Create a notification (typically system-generated).

**Request Body:**
```json
{
  "user_address": "cosmos1user...",
  "notification_type": "auction_started",
  "title": "Auction started",
  "message": "New auction available",
  "item_id": "uuid-1234",
  "related_data": {
    "seller": "cosmos1seller...",
    "starting_price": "100.00"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Notification created",
  "data": {
    "id": 1,
    "notification_type": "auction_started",
    ...
  }
}
```

---

#### PUT `/api/notifications/:notification_id/read`

Mark notification as read.

**Parameters:**
- `notification_id` (required): ID of the notification

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": 1,
    "is_read": true,
    "read_at": "2024-06-27T10:30:00Z",
    ...
  }
}
```

---

#### GET `/api/notifications/unread-count`

Get count of unread notifications.

**Response:**
```json
{
  "success": true,
  "unread_count": 3
}
```

---

### User Profiles

#### GET `/api/users/me`

Get current user's profile (requires authentication).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "wallet_address": "cosmos1user...",
    "username": "John Doe",
    "email": "john@example.com",
    "profile_picture_url": "/uploads/profile/pic123.jpg",
    "bio": "Collector of antiques",
    "verification_status": "verified",
    "created_at": "2024-06-27T07:00:00Z",
    "updated_at": "2024-06-27T10:00:00Z"
  }
}
```

---

#### PUT `/api/users/me`

Update current user's profile.

**Request Body:**
```json
{
  "username": "John Doe",
  "email": "john@example.com",
  "bio": "Collector of antiques",
  "profile_picture_url": "/uploads/profile/pic123.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "wallet_address": "cosmos1user...",
    ...
  }
}
```

---

#### GET `/api/users/:wallet_address`

Get public profile of another user.

**Parameters:**
- `wallet_address` (required): Cosmos wallet address

**Response:**
```json
{
  "success": true,
  "data": {
    "wallet_address": "cosmos1user...",
    "username": "John Doe",
    "profile_picture_url": "/uploads/profile/pic123.jpg",
    "bio": "Collector of antiques",
    "verification_status": "verified"
  }
}
```

---

#### GET `/api/users/me/stats`

Get user statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "wallet_address": "cosmos1user...",
    "seller_stats": {
      "total_auctions": 5,
      "active_auctions": 2,
      "ended_auctions": 3
    },
    "bidder_stats": {
      "total_bids": 12
    }
  }
}
```

---

### ZKP (Zero-Knowledge Proof)

#### POST `/api/zkp-proxy/store-proof`

Store ZKP proof backup (requires authentication).

**Request Body:**
```json
{
  "item_id": "uuid-1234",
  "commitment_hash": "0x1234567890abcdef...",
  "proof_json": {
    "pi_a": ["0x123...", "0x456..."],
    "pi_b": [["0x123...", "0x456..."], ["0x789...", "0xabc..."]],
    "pi_c": ["0xdef...", "0x012..."],
    "protocol": "groth16"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "ZKP proof backup stored successfully",
  "data": {
    "id": 1,
    "item_id": "uuid-1234",
    "bidder_address": "cosmos1bidder...",
    "commitment_hash": "0x1234567890abcdef...",
    "proof_generated_at": "2024-06-27T10:30:00Z"
  }
}
```

---

#### POST `/api/zkp-proxy/generate-proof`

**⚠️ PRIVACY WARNING:** Server-side ZKP proof generation (fallback only).

This endpoint should NEVER be used in production. ZKP proof generation MUST happen entirely on the client-side.

**Request Body:**
```json
{
  "commitment_hash": "0x1234567890abcdef...",
  "item_id": "uuid-1234"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Fallback ZKP proof generated",
  "proof": {
    "type": "fallback-server-generated",
    "commitment_hash": "0x1234567890abcdef...",
    "timestamp": "2024-06-27T10:30:00Z",
    "warning": "This proof was generated server-side. Use client-side generation in production!",
    "pi_a": ["0x123...", "0x456..."],
    "pi_b": [["0x123...", "0x456..."], ["0x789...", "0xabc..."]],
    "pi_c": ["0xdef...", "0x012..."],
    "protocol": "groth16"
  },
  "warning": "ZKP proof generation must be client-side only for privacy",
  "security_note": "This endpoint should be disabled in production"
}
```

---

#### POST `/api/zkp-proxy/verify-proof/:proof_id`

Verify a ZKP proof.

**Parameters:**
- `proof_id` (required): ID of the proof

**Request Body:**
```json
{
  "commitment_hash": "0x1234567890abcdef..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Proof verified successfully",
  "data": {
    "proof_id": 1,
    "verified": true,
    "commitment_hash": "0x1234567890abcdef..."
  }
}
```

---

#### GET `/api/zkp-proxy/proofs/:item_id`

Get all ZKP proofs for an auction.

**Parameters:**
- `item_id` (required): UUID of the auction

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "item_id": "uuid-1234",
      "bidder_address": "cosmos1bidder1...",
      "commitment_hash": "0x1234567890abcdef...",
      "verified": true,
      "proof_generated_at": "2024-06-27T09:00:00Z",
      "verification_timestamp": "2024-06-27T09:05:00Z"
    }
  ],
  "total": 3
}
```

---

## Database Schema

### users_profile

Stores user information linked to wallet addresses.

```sql
CREATE TABLE users_profile (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100),
  email VARCHAR(255),
  profile_picture_url VARCHAR(500),
  bio TEXT,
  verification_status VARCHAR(50) DEFAULT 'unverified',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### auctions_metadata

Stores auction metadata (NOT bid amounts).

```sql
CREATE TABLE auctions_metadata (
  id SERIAL PRIMARY KEY,
  item_id VARCHAR(100) UNIQUE NOT NULL,
  seller_address VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  image_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  starting_price DECIMAL(20, 2),
  current_highest_bid DECIMAL(20, 2),
  highest_bidder_address VARCHAR(255),
  auction_status VARCHAR(50) DEFAULT 'active',
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  total_bids_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_address) REFERENCES users_profile(wallet_address)
);
```

### zkp_proof_backup

Stores ZKP proof structures (NEVER bid amounts).

```sql
CREATE TABLE zkp_proof_backup (
  id SERIAL PRIMARY KEY,
  item_id VARCHAR(100) NOT NULL,
  bidder_address VARCHAR(255) NOT NULL,
  commitment_hash VARCHAR(255) NOT NULL,
  proof_json JSONB,
  proof_generated_at TIMESTAMP,
  verified BOOLEAN DEFAULT FALSE,
  verification_timestamp TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES auctions_metadata(item_id),
  FOREIGN KEY (bidder_address) REFERENCES users_profile(wallet_address)
);
```

### notifications

Stores user notifications.

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(255) NOT NULL,
  notification_type VARCHAR(100),
  title VARCHAR(255),
  message TEXT,
  item_id VARCHAR(100),
  related_data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_address) REFERENCES users_profile(wallet_address)
);
```

---

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200  | Success |
| 201  | Created |
| 400  | Bad Request |
| 401  | Unauthorized |
| 403  | Forbidden |
| 404  | Not Found |
| 500  | Internal Server Error |

### Common Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Auction not found"
}
```

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields"
}
```

---

## Examples

### Complete Workflow Example

#### 1. Create User Profile

```bash
curl -X PUT http://localhost:3001/api/users/me \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Collector John",
    "email": "john@collectors.com",
    "bio": "Antique collector"
  }'
```

#### 2. Upload Auction Image

```bash
curl -X POST http://localhost:3001/api/upload-image \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "image=@vase.jpg" \
  -F "purpose=auction"
```

Response:
```json
{
  "success": true,
  "data": {
    "url": "/uploads/auction/abc123.jpg",
    "thumbnail_url": "/uploads/auction/thumb_abc123.jpg"
  }
}
```

#### 3. Create Auction

```bash
curl -X POST http://localhost:3001/api/auctions \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Antique Ming Vase",
    "description": "Beautiful 300-year-old vase",
    "category": "antiques",
    "starting_price": "100.00",
    "start_time": "2024-06-27T08:00:00Z",
    "end_time": "2024-06-29T20:00:00Z",
    "image_url": "/uploads/auction/abc123.jpg",
    "thumbnail_url": "/uploads/auction/thumb_abc123.jpg"
  }'
```

#### 4. Get All Auctions

```bash
curl http://localhost:3001/api/auctions
```

#### 5. Store ZKP Proof

```bash
curl -X POST http://localhost:3001/api/zkp-proxy/store-proof \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": "uuid-1234",
    "commitment_hash": "0x1234567890abcdef...",
    "proof_json": {
      "pi_a": ["0x123...", "0x456..."],
      "pi_b": [["0x123...", "0x456..."], ["0x789...", "0xabc..."]],
      "pi_c": ["0xdef...", "0x012..."],
      "protocol": "groth16"
    }
  }'
```

---

## Deployment Notes

### Environment Variables

```
PORT=3001
NODE_ENV=production
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=lelang_db
DB_USER=lelang_user
DB_PASSWORD=secure_password
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=https://admin.lelang.com,https://user.lelang.com
```

### Database Setup

```bash
# Install dependencies
npm install

# Run migrations
npm run migrate

# Start server
npm start
```

### Security Recommendations

1. Always use HTTPS in production
2. Implement rate limiting
3. Disable server-side ZKP generation endpoint in production
4. Use environment variables for sensitive data
5. Implement request signing for additional security
6. Regular security audits of uploaded images
7. Backup database regularly

---

## Support & Contact

For API support or issues, please refer to the project documentation or contact the development team.
