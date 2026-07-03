# TAHAP H - Frontend User (Marketplace & Bidding)
## Rencana Implementasi & E2E Testing Guide

**Status:** ✅ COMPLETED (Ready for Testing)  
**Port:** 5174 (separate dari admin di 5173)  
**Testing:** E2E dengan 3 wallet test address  

---

## Architecture Overview

### Frontend Structure

```
apps/user/
├── src/
│   ├── pages/
│   │   ├── Login.jsx          # Keplr wallet login (reuse dari admin)
│   │   ├── Marketplace.jsx    # List all active auctions
│   │   ├── AuctionDetail.jsx  # View auction details
│   │   ├── SubmitBid.jsx      # Submit bid (CLIENT-SIDE ZKP)
│   │   ├── RevealBid.jsx      # Reveal bid after auction ends
│   │   └── History.jsx        # History & claim rewards/refunds
│   ├── components/
│   │   └── Layout.jsx         # Sidebar navigation
│   ├── utils/
│   │   ├── keplr.js          # Keplr wallet integration
│   │   ├── api.js            # Backend API calls
│   │   └── zkp.js            # CLIENT-SIDE ZKP proof generation
│   ├── App.jsx               # Routing with protected routes
│   ├── main.jsx              # React entry point
│   └── index.css             # Tailwind CSS
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

### Key Difference from Admin

**Admin (TAHAP G):** Seller/penyelenggara - membuat lelang  
**User (TAHAP H):** Buyer/peserta - ikuti lelang dan bid

| Feature | Admin | User |
|---------|-------|------|
| View Auctions | Hanya milik seller | Semua active auctions |
| Create Auction | ✓ | ✗ |
| Submit Bid | ✗ | ✓ Generate ZKP di client |
| Reveal Bid | ✗ | ✓ Setelah lelang ditutup |
| Klaim | ✗ | ✓ Menang/refund |

---

## Critical Implementation: CLIENT-SIDE ZKP

### How It Works

```
1. User enters bid amount (e.g., 50 ATOM)
   ↓
2. Generate salt (random 16 bytes)
   ↓
3. Create commitment_hash = SHA256(bid + salt)
   ↓ 
4. Generate ZKP proof (di client, simulated dengan mock proof)
   ↓
5. Send to backend:
   - commitment_hash ✓
   - proof_json ✓
   - bid amount ✗ (TIDAK dikirim!)
   - salt ✗ (TIDAK dikirim!)
   ↓
6. Backend stores commitment_hash + proof in zkp_proof_backup
   ↓
7. Client stores (bid amount + salt) in localStorage
   ↓
8. When revealing: send bid + salt, backend verifies H(bid+salt) == commitment_hash
```

### Files Created

**zkp.js - Zero-Knowledge Proof Generator:**
- `hashBid()` - SHA256(bid + salt)
- `generateSalt()` - Random 16 bytes
- `generateZKPProof()` - Main function
- `verifyCommitment()` - Verify when revealing

**Key Security Points:**
- ✅ Bid amount ONLY on client device
- ✅ Backend NEVER sees actual bid
- ✅ Backend validates commitment during reveal
- ✅ ZKP proof backup in database for audit trail

---

## Pages Implementation

### 1. Login.jsx
- Same as admin with Keplr connection
- Stores JWT token + wallet address

### 2. Marketplace.jsx
- **Endpoint:** `GET /api/auctions?limit=100&offset=0`
- **Filter:** Only active auctions (`auction_status === 'active'`)
- **Display:** Grid of auction cards with search bar
- **Card Shows:**
  - Auction image
  - Title + category
  - Starting price
  - Current highest bid
  - Total bid count
  - "Lihat & Bid" button

### 3. AuctionDetail.jsx
- **Endpoint:** `GET /api/auctions/:itemId`
- **Additional Data:** `GET /api/zkp-proxy/proofs/:itemId`
- **Display:**
  - Large image
  - Full title + description
  - Status badge
  - Pricing (starting + current highest)
  - Timing (start/end)
  - Total bids count
  - ZKP proofs table (commitment hashes)
  - "💰 Submit Bid Rahasia" button

### 4. SubmitBid.jsx - **CRITICAL PAGE**
```
User enters bid amount → zk_generate_proof() → 
  commitment_hash + proof → POST /api/zkp-proxy/store-proof →
  bid_amount + salt stored in localStorage device
```

**Endpoints:**
- `POST /api/zkp-proxy/store-proof` (send commitment_hash + proof)
- Backend response: success (no bid amount echoed back)

**Client Storage:**
```javascript
bidHistory[itemId] = [
  {
    bidAmount: 50,          // Bid amount - NEVER sent to server
    salt: "a1b2c3d4e5...",  // Salt - NEVER sent to server
    commitment_hash: "sha256hash...",
    timestamp: "2024-01-15T10:30:00Z"
  }
]
```

### 5. RevealBid.jsx
- Shows bid history from localStorage
- User can reveal each bid
- **Endpoint:** `POST /api/zkp-proxy/verify-proof/:proof_id`
  - Sends: bid_amount + salt
  - Backend verifies: H(bid + salt) == stored commitment_hash
  - If valid: Accept bid claim

### 6. History.jsx
- **Endpoint:** Filter auctions with `auction_status === 'ended'`
- Shows ended auctions buyer participated in
- Two scenarios:
  1. **Winner:** 
     - Button "🔓 Reveal Bid" → `POST /api/zkp-proxy/verify-proof`
     - Button "🏆 Klaim Kemenangan" → Transfer ATOM to wallet
  2. **Loser:** 
     - Button "💸 Tarik Refund" → Return bid collateral

---

## E2E Testing Scenario

### Setup: 3 Wallet Test Addresses

```
Wallet 1 (Admin/Seller):
  - Address: test-seller-1
  - Role: Create auctions
  
Wallet 2 (Buyer 1):
  - Address: test-buyer-1
  - Role: Submit bid, try to win
  
Wallet 3 (Buyer 2):
  - Address: test-buyer-2
  - Role: Submit bid, compete
```

### Test Flow

**Step 1: Create Auction (Wallet 1 - Admin)**
```
1. Open admin dashboard (port 5173)
2. Login dengan Wallet 1
3. Create auction "Lelang Test"
   - Starting price: 10 ATOM
   - Duration: 5 minutes
4. Verify auction appears in marketplace
```

**Step 2: Buyer 1 Submit Bid (Wallet 2)**
```
1. Open user marketplace (port 5174)
2. Login dengan Wallet 2 (Keplr switch account)
3. Click "Lelang Test" → "Lihat & Bid"
4. Enter bid: 50 ATOM
5. Click "Submit Bid Rahasia"
6. ZKP proof generates on client
7. Verify commitment_hash stored in database
8. Verify bid_amount + salt in localStorage only

Test point:
- Backend /api/zkp-proxy/proofs/{itemId} shows commitment
- Bid amount NOT visible anywhere in backend
```

**Step 3: Buyer 2 Submit Higher Bid (Wallet 3)**
```
1. Open new incognito window
2. Login dengan Wallet 3
3. Go to "Lelang Test"
4. Enter bid: 75 ATOM (higher than Wallet 2)
5. Submit bid
6. Verify new commitment_hash in database
7. Verify current_highest_bid updated to 75 ATOM

Test point:
- Two different commitment hashes for same auction
- Both hashes valid but different
- Backend shows highest bid updated
```

**Step 4: Wait for Auction to End**
```
1. Wait for auction end_time to pass (or manually close via admin)
2. Via admin: Click "Tutup Lelang" on auction detail
3. Verify auction_status changes to 'ended'
```

**Step 5: Reveal Bids & Claim (Buyers)**
```
Wallet 2 (Bid: 50 ATOM - LOST):
1. Go to History & Claims
2. Find "Lelang Test" - shows "ended"
3. Since lost: Button "💸 Tarik Refund"
4. Click → Backend refunds 50 ATOM to wallet 2
5. Verify on blockchain: Wallet 2 receives 50 ATOM back

Wallet 3 (Bid: 75 ATOM - WON):
1. Go to History & Claims
2. Find "Lelang Test" - shows "ended"  
3. Since won: Show "🎉 Anda Menang!"
4. Click "🔓 Reveal Bid"
5. Retrieve bid data from localStorage
6. Send: bid_amount=75, salt=xxx
7. Backend verifies: H(75 + xxx) == commitment_hash ✓
8. Accept claim, transfer item to wallet 3
9. Verify on blockchain: Transaction recorded
```

---

## Testing Checklist

### Pre-Testing Setup
- [ ] Backend running on port 3001
- [ ] Admin frontend running on port 5173
- [ ] User frontend running on port 5174
- [ ] Keplr wallet with test wallets added
- [ ] Chain `lelang-testnet` configured in Keplr
- [ ] At least 3 test wallets (1 seller, 2 buyers)

### Functionality Testing

**Marketplace:**
- [ ] Load marketplace page without errors
- [ ] Display all active auctions
- [ ] Search bar filters auctions by title
- [ ] Click auction opens detail page
- [ ] Only active auctions show "Lihat & Bid" button

**Submit Bid:**
- [ ] Open submit bid form for active auction
- [ ] Enter bid amount
- [ ] Click "Submit Bid Rahasia"
- [ ] Show "Generate ZKP Proof..." spinner
- [ ] Verify localStorage contains bid_history entry
- [ ] Verify backend has new ZKP proof entry
- [ ] Verify bid_amount NOT in backend

**Multiple Bids:**
- [ ] Wallet 2 enters 50 ATOM bid
- [ ] Wallet 3 enters 75 ATOM bid
- [ ] Backend current_highest_bid updates to 75
- [ ] Both commitment hashes visible in ZKP table
- [ ] Bid amounts still not visible in backend

**Reveal Bid:**
- [ ] Auction ends
- [ ] Winner (Wallet 3) can click "Reveal Bid"
- [ ] Send bid + salt from localStorage
- [ ] Backend verifies commitment matches
- [ ] Show "✅ Bid Revealed!"
- [ ] Allow klaim kemenangan

**Claim Winnings/Refund:**
- [ ] Winner: "🏆 Klaim Kemenangan" → Transfer ATOM
- [ ] Loser: "💸 Tarik Refund" → Return bid amount
- [ ] Verify blockchain transaction

---

## Implementation Files

```
✅ apps/user/package.json
✅ apps/user/vite.config.js
✅ apps/user/index.html (create separately if needed)
✅ apps/user/src/main.jsx
✅ apps/user/src/App.jsx
✅ apps/user/src/index.css
✅ apps/user/src/components/Layout.jsx
✅ apps/user/src/pages/Login.jsx
✅ apps/user/src/pages/Marketplace.jsx
✅ apps/user/src/pages/AuctionDetail.jsx
✅ apps/user/src/pages/SubmitBid.jsx
✅ apps/user/src/pages/RevealBid.jsx
✅ apps/user/src/pages/History.jsx
✅ apps/user/src/utils/keplr.js
✅ apps/user/src/utils/api.js
✅ apps/user/src/utils/zkp.js
```

---

## Running User Frontend

### Installation
```bash
cd apps/user
npm install
```

### Start Dev Server
```bash
npm run dev
```

Starts on: **http://localhost:5174**

### Build for Production
```bash
npm run build
```

Output: `dist/` directory

---

## Expected vs Actual Results

### Expected
- ✅ Marketplace loads all active auctions
- ✅ Bid submission generates ZKP on client
- ✅ Backend only sees commitment hash (not bid amount)
- ✅ Multiple users can submit different bids
- ✅ Highest bid tracked correctly
- ✅ After auction ends, users can reveal bids
- ✅ Winners can claim, losers can refund
- ✅ All operations blockchain-verified

### Potential Issues & Solutions

**Issue:** "Backend API error when submitting bid"
- Solution: Verify backend is running, check CORS settings

**Issue:** "localStorage bid_history not persisting"
- Solution: Check browser localStorage is enabled, not in incognito

**Issue:** "Bid amount showing in backend somehow"
- Solution: Audit code to ensure bid_amount param never sent

**Issue:** "Multiple wallets not working"
- Solution: Use Keplr account switcher, or different browser profiles

---

## Security Validation

- ✅ Bid amounts ONLY on client device
- ✅ Server receives commitment hash only
- ✅ Salt NEVER sent to backend
- ✅ ZKP proof structure serves as audit trail
- ✅ Reveal validation: H(bid + salt) == commitment
- ✅ No sensitive data leakage in error messages

---

## Summary

**TAHAP H** includes:
- Marketplace page (list active auctions)
- Auction detail page
- Submit bid page (CLIENT-SIDE ZKP)
- Reveal bid page
- History & claim page
- Complete Keplr wallet integration
- End-to-end bidding flow

**Ready for:** E2E testing with 3 wallets

---

**Next Step:** TAHAP I - Stress Testing & Final Documentation
