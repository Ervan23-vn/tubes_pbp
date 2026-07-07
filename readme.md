# Lelang Blockchain - Sistem Lelang Berbasis Cosmos SDK dengan Zero-Knowledge Proof

Sistem lelang digital tertutup (*sealed-bid auction*) terdesentralisasi dengan fitur *privacy-preserving bidding* menggunakan Zero-Knowledge Proof (ZKP) dan autentikasi tanda tangan digital via Keplr Wallet.

---

## 📌 Fitur Utama

- **On-Chain Layer**: Cosmos SDK Blockchain dengan konsensus Tendermint (setup 4 validator node lokal).
- **Off-Chain Layer (Backend API)**: Server Express.js dengan 20+ REST endpoints, database SQLite/PostgreSQL, dan Keplr wallet signature authentication.
- **Client-Side ZKP Bidding**: Nominal bid asli diproses secara lokal di browser pembeli (`SnarkJS`), hanya `commitment_hash` dan `proof_json` yang dikirim ke backend database demi menjaga kerahasiaan nominal tawar.
- **Admin Seller Center**: Dashboard lelang, pembuatan lelang baru, real-time monitoring 4-node blockchain, dan laporan audit keamanan.
- **Buyer Marketplace**: Jelajah barang lelang, submit bid rahasia, pengungkapan (reveal) bid setelah lelang tutup, dan penarikan refund / klaim aset lelang.

---

## 🏗️ Desain Arsitektur

```
┌────────────────────────────────────────────────────────┐
│             ARSITEKTUR HYBRID LELANG DIGITAL           │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Layer On-Chain (Cosmos Blockchain)                    │
│  ├── Modul Lelang (Smart Contract)                     │
│  └── 4 Validator Nodes (Consensus Engine)              │
│                                                        │
│  Layer Off-Chain (Backend API Server)                  │
│  ├── Node.js + Express (Port 3001)                     │
│  ├── SQLite/PostgreSQL Database                        │
│  └── Keplr Signature Authentication                    │
│                                                        │
│  Layer Frontend Client (Browser)                       │
│  ├── Admin Portal (React, Port 5173)                   │
│  ├── Buyer Portal (React, Port 5174)                   │
│  ├── Client-Side ZKP Proof Prover (SnarkJS)            │
│  └── Local Storage (Keeps private key & bid salt)      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Panduan Memulai (Quick Start)

### 1. Prasyarat Sistem
- Node.js v18 atau lebih tinggi.
- Keplr Wallet Extension terinstall di web browser.
- K6 Load Testing Framework (untuk stress testing, opsional).

### 2. Setup Backend API & Database
Masuk ke direktori backend, lakukan instalasi modul, jalankan migrasi database, lalu mulai server:
```bash
cd apps/backend
npm install
npm run migrate
npm run dev
```
Server backend akan berjalan di http://localhost:3001.

### 3. Setup Frontend Admin (Seller Center)
Buka terminal baru, masuk ke direktori admin, pasang dependensi, lalu jalankan server Vite:
```bash
cd apps/admin
npm install
npm run dev
```
Buka http://localhost:5173 di browser Anda.

### 4. Setup Frontend User (Buyer Marketplace)
Buka terminal baru, masuk ke direktori user, pasang dependensi, lalu jalankan server Vite:
```bash
cd apps/user
npm install
npm run dev
```
Buka http://localhost:5174 di browser Anda.

### 5. Setup Local Blockchain Nodes (4-Node Testnet)
Untuk mensimulasikan blockchain dengan 4 node validator lokal secara real-time:
```bash
# Jalankan node validator secara berurutan pada terminal terpisah
./lelangd start --node 0
./lelangd start --node 1
./lelangd start --node 2
./lelangd start --node 3
```

---

## 🧪 Pengujian & Evaluasi

### Pengujian REST API
Anda dapat menjalankan pengetesan rute API Express secara otomatis:
```bash
cd apps/backend
bash test-api.sh
```

### Stress Testing (k6)
Simulasi submit bid rahasia secara simultan oleh 10, 50, dan 100+ pengguna concurrent:
```bash
# Install k6 via Snap (Linux)
sudo snap install k6

# Jalankan script stress test di root folder proyek
k6 run stress-test.js
```

---

## 📂 Struktur Dokumentasi

Seluruh berkas dokumentasi teknis dan panduan pengerjaan tersedia di folder `/docs`:
- [LAPORAN_TEKNIS.md](docs/LAPORAN_TEKNIS.md) - Laporan final tugas besar (Bab I - Bab V).
- [api-spec.md](docs/api-spec.md) - Dokumentasi lengkap REST API backend.
- [stress-test-report.md](docs/stress-test-report.md) - Hasil uji beban throughput TPS dan latency.
- [tahap-f-testing.md](docs/tahap-f-testing.md) - Daftar rincian kasus uji manual endpoint backend.
- [tahap-g-checkpoint.md](docs/tahap-g-checkpoint.md) - Checkpoint fungsionalitas admin dashboard.
- [tahap-h-plan.md](docs/tahap-h-plan.md) - Skenario E2E testing user menggunakan 3 alamat wallet test.
