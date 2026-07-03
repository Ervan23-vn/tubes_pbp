# Lelang Admin Dashboard

**TAHAP G - Frontend Admin (Seller/Penyelenggara Center)**

## Overview

Admin dashboard untuk penjual (seller) dan penyelenggara lelang. Interface untuk:
- 📊 Dashboard dengan statistik lelang
- ➕ Membuat lelang baru dengan upload gambar
- 📡 Monitoring jaringan 4 node lelang-testnet lokal  
- 🔒 Laporan keamanan dan stress test results

## Technology Stack

- **React 18** - UI framework
- **Vite** - Build tool (fast, modern)
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Keplr SDK** - Wallet integration
- **CosmJS** - Blockchain interaction
- **Axios** - HTTP client
- **Lucide React** - Icons

## Features

✅ **Keplr Wallet Authentication**  
✅ **Dashboard dengan daftar lelang seller**  
✅ **Form membuat lelang baru**  
✅ **Upload gambar untuk auction items**  
✅ **Detail halaman lelang**  
✅ **Monitoring 4 node blockchain**  
✅ **Laporan keamanan dan stress test**  
✅ **Real-time notification badge**  

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

```bash
# .env (if needed, default uses localhost)
VITE_BACKEND_URL=http://localhost:3001/api
```

### 3. Prerequisites

- Backend API running on `http://localhost:3001`
- Keplr wallet installed in browser
- Chain `lelang-testnet` configured in Keplr

## Running

### Development

```bash
npm run dev
```

```
🚀 Lelang Admin Dashboard
✓ Local: http://localhost:5173/
```

### Production Build

```bash
npm run build
npm run preview
```

## Project Structure

```
apps/admin/
├── src/
│   ├── main.jsx               # Entry point
│   ├── App.jsx                # Main routing
│   ├── index.css              # Tailwind styles
│   ├── components/
│   │   └── Layout.jsx         # Sidebar + navigation
│   ├── pages/
│   │   ├── Login.jsx          # Keplr wallet login
│   │   ├── Dashboard.jsx      # Dashboard with auctions list
│   │   ├── CreateAuction.jsx  # Form to create auction
│   │   ├── AuctionDetail.jsx  # Auction details & close
│   │   ├── NetworkMonitoring.jsx # Monitor 4 nodes
│   │   └── SecurityReport.jsx # Security analysis & stress test
│   └── utils/
│       ├── keplr.js           # Keplr wallet integration
│       └── api.js             # Backend API client
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── README.md
```

## Usage Guide

### 1. Login

```
1. Open http://localhost:5173
2. Click "Login dengan Keplr Wallet"
3. Approve Keplr popup
4. Sign the authentication message
5. Redirected to Dashboard
```

### 2. Create Auction

```
1. Navigate to "Buat Lelang" menu
2. Fill in auction details:
   - Title, description, category
   - Starting price (ATOM)
   - Start & end time
   - Upload item image
3. Click "Buat Lelang"
4. Redirected to auction detail page
```

### 3. View Dashboard

```
1. Dashboard shows:
   - Total auctions (seller)
   - Active auctions count
   - Ended auctions count
   - Total bids participated
   - Table of all seller's auctions
2. Click "Lihat Detail" to view auction
```

### 4. Monitor Network

```
1. Go to "Monitoring Jaringan"
2. View status of 4 nodes:
   - Node 1: localhost:26657
   - Node 2: localhost:26668
   - Node 3: localhost:26679
   - Node 4: localhost:26690
3. Shows: Status, block height, peers, latency
4. Auto-refreshes every 10 seconds
```

### 5. View Security Report

```
1. Go to "Laporan Keamanan"
2. See security checklist:
   - Database security (16 checks)
   - API security
   - Privacy & data protection
   - File upload security
3. Stress test results (10/50/100 users)
4. Performance metrics & recommendations
```

## Key Components

### Layout Component
- Responsive sidebar navigation
- Top bar with wallet info
- Menu items for all pages
- Logout functionality

### Login Page
- Keplr wallet connection
- Signature-based authentication
- JWT token generation
- Error handling & retry

### Dashboard
- Fetch seller's auctions
- Display statistics (cards)
- Auction table with status
- Quick actions (create, view)

### CreateAuction Form
- Form validation
- Image upload with preview
- DateTime picker for schedule
- Category selection
- Backend submission

### AuctionDetail
- Auction information display
- Image preview
- ZKP proof backup table
- Close auction button (seller only)
- Statistics

### NetworkMonitoring
- Real-time node status
- Block height tracking
- Peer count
- Latency measurement
- Auto-refresh every 10s

### SecurityReport
- Security checklist (16 items)
- Expandable categories
- Stress test results table
- Performance metrics
- Compliance checklist

## API Integration

Backend endpoints used:

```
Authentication:
POST /api/auth/verify

Auctions:
GET /api/auctions
GET /api/auctions/:item_id
POST /api/auctions
GET /api/auctions/seller/me
PUT /api/auctions/:item_id/status

User:
GET /api/users/me
PUT /api/users/me
GET /api/users/me/stats

Notifications:
GET /api/notifications
GET /api/notifications/unread-count

Upload:
POST /api/upload-image

ZKP:
GET /api/zkp-proxy/proofs/:item_id
POST /api/zkp-proxy/store-proof
```

## Wallet Integration

### Keplr Connection Flow

```
1. User clicks "Login dengan Keplr"
2. connectKeplrWallet() -> Check if Keplr installed
3. keplr.enable('lelang-testnet') -> Request connection
4. Get account: keplr.getKey('lelang-testnet')
5. Sign message: keplr.signAmino()
6. Send to backend: POST /api/auth/verify
7. Receive JWT token
8. Store token + wallet address in localStorage
9. Redirect to dashboard
```

### JWT Token Usage

```
// Subsequent requests include JWT
headers: {
  'Authorization': 'Bearer <JWT_TOKEN>'
}
```

## Styling

- **Tailwind CSS** for all styling
- **Lucide React** icons
- **Responsive design** (mobile-friendly)
- **Color scheme**: Blue primary, purple secondary
- **Dark sidebar** with light content area

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required:** Keplr wallet extension installed

## Troubleshooting

### Backend not connecting

```
Error: "Cannot POST /api/auctions"
Solution: Ensure backend is running on http://localhost:3001
```

### Keplr not installed

```
Error: "Keplr wallet is not installed"
Solution: Install Keplr extension from https://www.keplr.app
```

### Chain not found

```
Error: "Chain lelang-testnet not found"
Solution: Add chain to Keplr with this config:
- Chain ID: lelang-testnet
- RPC: http://localhost:26657
```

### CORS Error

```
Error: "Access to XMLHttpRequest blocked by CORS"
Solution: Ensure backend has CORS enabled for http://localhost:5173
```

## Performance Tips

1. **Dashboard loading slow?**
   - Check backend API response time
   - Use React DevTools Profiler

2. **Network monitoring lagging?**
   - Reduce refresh interval
   - Check node RPC endpoints

3. **Form submission slow?**
   - Check image file size
   - Verify backend database connection

## Development

### Add New Page

1. Create file in `src/pages/NewPage.jsx`
2. Import in `src/App.jsx`
3. Add route to Routes
4. Add menu item to Layout

### Modify Styles

1. Edit `src/index.css` for global
2. Use className with Tailwind classes
3. Update `tailwind.config.js` for custom colors

### API Calls

1. Add function in `src/utils/api.js`
2. Import in component
3. Use with try-catch error handling

## Deployment

### Build for Production

```bash
npm run build
```

Output: `dist/` directory

### Deploy to Server

```bash
# Copy dist to web server
scp -r dist/* user@server:/var/www/lelang-admin/

# Or use GitHub Pages, Vercel, Netlify
```

### Environment for Production

```
VITE_BACKEND_URL=https://api.lelang.com
```

## Support

For issues or questions, refer to:
- Project README in root directory
- Backend API documentation at `/docs/api-spec.md`
- Component documentation in code comments

## License

Part of Lelang Blockchain Auction System - Educational Project

---

**Last Updated:** 2024  
**Status:** TAHAP G - Frontend Admin (Completed)
