# Dokumentasi Peran & Entitas Sistem Lelang Blockchain

## Sistem Lelang Digital Berbasis Cosmos SDK & Zero-Knowledge Proof

---

## Daftar Isi

1. [Ringkasan Sistem](#1-ringkasan-sistem)
2. [Entitas dalam Sistem](#2-entitas-dalam-sistem)
3. [Node Blockchain](#3-node-blockchain)
4. [Validator](#4-validator)
5. [Aktor (Pengguna Sistem)](#5-aktor-pengguna-sistem)
6. [Pemetaan Peran: Admin vs User](#6-pemetaan-peran-admin-vs-user)
7. [Alur Interaksi Lengkap](#7-alur-interaksi-lengkap)
8. [Diagram Arsitektur](#8-diagram-arsitektur)
9. [Glossary (Istilah)](#9-glossary-istilah)

---

## 1. Ringkasan Sistem

Proyek ini adalah **platform lelang digital tertutup (sealed-bid auction)** yang dibangun di atas teknologi **Cosmos SDK** dengan fitur privasi menggunakan **Zero-Knowledge Proof (ZKP)**.

Sistem terdiri dari **3 layer** utama:

| Layer | Komponen | Fungsi |
|-------|----------|--------|
| **On-Chain** | 4 Node Validator Blockchain | Memvalidasi transaksi & menjaga konsensus |
| **Off-Chain** | Backend API (Express.js) | Menyimpan metadata lelang & ZKP proof backup |
| **Frontend** | Admin App + User App | Antarmuka pengguna untuk mengelola & mengikuti lelang |

---

## 2. Entitas dalam Sistem

Dalam proyek lelang blockchain ini, ada **4 entitas utama** yang berperan:

```
┌──────────────────────────────────────────────────────────┐
│                    ENTITAS SISTEM                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. NODE        → Server yang menjalankan blockchain     │
│  2. VALIDATOR   → Node yang memvalidasi transaksi        │
│  3. ADMIN       → Penyelenggara/penjual lelang           │
│  4. USER/BUYER  → Peserta/pembeli yang menawar lelang    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

> **Catatan Penting**: Dalam proyek testnet lokal ini, Node dan Validator adalah hal yang sama — keempat node sekaligus berperan sebagai validator. Di jaringan production yang lebih besar, ada node biasa (full node) yang hanya menyimpan data tanpa memvalidasi transaksi.

---

## 3. Node Blockchain

### 3.1 Apa Itu Node?

**Node** adalah komputer/proses yang menjalankan software blockchain (`lelangd`). Setiap node menyimpan salinan lengkap dari seluruh data blockchain.

### 3.2 Daftar Node dalam Proyek

Proyek ini menggunakan **4 node** yang semuanya berjalan di komputer lokal:

| Node | Nama | RPC Port | P2P Port | Direktori Konfigurasi |
|------|------|----------|----------|-----------------------|
| 1 | `node0` | `26657` | `26656` | `chain/localnet/node0` |
| 2 | `node1` | `26668` | `26667` | `chain/localnet/node1` |
| 3 | `node2` | `26679` | `26678` | `chain/localnet/node2` |
| 4 | `node3` | `26690` | `26689` | `chain/localnet/node3` |

### 3.3 Fungsi Setiap Port

- **RPC Port (26657, 26668, 26679, 26690)**
  Port yang digunakan untuk berkomunikasi dengan node dari luar. Backend API dan halaman Monitoring Admin menggunakan port ini untuk mengirim transaksi dan mengecek status node.

- **P2P Port (26656, 26667, 26678, 26689)**
  Port yang digunakan antar-node untuk saling bertukar data block dan transaksi. Ini adalah komunikasi internal antar-node.

### 3.4 Tugas Node

| No | Tugas | Penjelasan |
|----|-------|------------|
| 1 | Menyimpan data | Semua riwayat transaksi lelang tersimpan di setiap node |
| 2 | Menerima transaksi | Menerima transaksi dari backend API |
| 3 | Menyebarkan transaksi | Mengirim transaksi yang diterima ke node lain (gossiping) |
| 4 | Memproduksi block | Mengemas transaksi valid ke dalam block baru |
| 5 | Menjaga konsensus | Voting bersama node lain untuk menyepakati data yang valid |

### 3.5 Node BUKAN User

```
❌ Node ≠ User yang menawar lelang
❌ Node ≠ Admin yang membuat lelang
❌ Node ≠ Wallet address (cosmos1...)

✅ Node = Server infrastruktur yang menjalankan jaringan blockchain
```

### 3.6 Pembahasan Kasus: Status Offline & Klasifikasi Node

#### A. Mengapa Status 4 Node Tampil "Offline" pada Dashboard Admin?
Tampilan status **Offline** pada halaman Monitoring Jaringan (`NetworkMonitoring.jsx`) di Dashboard Admin bukan merupakan simulasi palsu atau error coding. Halaman tersebut bekerja secara real-time dengan mengirimkan sinyal HTTP `fetch` ke port RPC lokal masing-masing node (`26657`, `26668`, `26679`, `26690`).
*   **Penyebab Offline:** Karena Anda belum menyalakan/menjalankan aplikasi blockchain Cosmos (`lelangd`) secara lokal di terminal WSL Anda, port-port tersebut tertutup dan terbaca offline.
*   **Cara Mengaktifkan:** Begitu Anda mengaktifkan node-node tersebut melalui skrip inisialisasi (`./scripts/setup-local-nodes.sh`), status pada dashboard monitoring admin akan secara otomatis mendeteksi koneksi dan berubah menjadi **Online** beserta info latency dan tinggi blok (*block height*) riil.

#### B. Apakah Ada "Node User" atau "Node Admin"?
**Tidak ada.** Dalam arsitektur aplikasi terdesentralisasi (dApp):
*   **User (Pembeli)** dan **Admin (Penjual)** bertindak sebagai **Client (Klien)**. Mereka tidak perlu menjalankan aplikasi node blockchain di komputer mereka untuk bertransaksi.
*   Mereka berinteraksi dengan sistem menggunakan peramban web (React frontend) dan ekstensi **Keplr Wallet** sebagai alat penandatangan digital transaksi.
*   Aplikasi web klien ini hanya menumpang koneksi (mengirim request transaksi) ke salah satu **Node Konsensus** yang aktif di jaringan (misalnya Node 1 di port `26657`).
*   *Analogi:* Ini seperti aplikasi mobile banking di HP Anda. HP Anda adalah **Client**, sedangkan server bank yang memproses transaksi dan mencatat pembukuan adalah **Node Konsensus**. HP Anda tidak menyimpan database saldo nasabah lain dan HP Anda bukan kantor cabang bank.

#### C. Bagaimana Cara Komputer Lain Bergabung Menjadi Node Baru?
Jika ada komputer lain (seperti komputer rekan tim Anda) yang ingin bergabung menjadi node baru di dalam jaringan `lelang-testnet` ini, langkah-langkahnya adalah:
1.  **Instalasi Daemon:** Kompilasi source code blockchain untuk menghasilkan binary `lelangd`.
2.  **Inisialisasi Konfigurasi:** Jalankan perintah `lelangd init <nama_node> --chain-id lelang-testnet`.
3.  **Sinkronisasi Genesis:** Salin berkas `genesis.json` asli milik jaringan Anda ke direktori node baru tersebut.
4.  **Mendaftarkan Peers:** Masukkan alamat IP P2P dari node Anda (contoh: Node 1) ke bagian `persistent_peers` di berkas `config.toml` node baru agar mereka dapat saling menemukan dan bertukar data.
5.  **Jalankan Node:** Eksekusi `lelangd start` untuk mulai menyinkronkan blok.
6.  **Menjadi Validator:** Jika ingin ikut serta memproses konsensus/voting, node baru tersebut harus mengirimkan transaksi pembuatan validator (`MsgCreateValidator`) dengan melakukan *staking* koin native `ulct`.

---

## 4. Validator

### 4.1 Apa Itu Validator?

**Validator** adalah node yang memiliki hak untuk memvalidasi transaksi dan memproduksi block baru. Dalam proyek ini, **keempat node adalah validator**.

### 4.2 Siapa Saja Validatornya?

#### A. Lingkungan Lokal (Local/Development - Saat Ini)
Dalam setup pengembangan lokal (`lelang-testnet`), validator dijalankan secara mandiri oleh **Anda sendiri (Operator Sistem)** di komputer lokal. 
Secara kriptografis, kunci validator privat (*validator key*) di-generate secara otomatis untuk masing-masing dari 4 node berikut:
*   **Validator 0** (`node0` di port `26657`)
*   **Validator 1** (`node1` di port `26668`)
*   **Validator 2** (`node2` di port `26679`)
*   **Validator 3** (`node3` di port `26690`)

#### B. Lingkungan Publik (Production - Mendatang)
Jika proyek ini dideploy ke jaringan publik (mainnet/public testnet), validatornya adalah **pihak ketiga independen (publik)**, seperti:
*   **Validator Profesional**: Institusi atau penyedia infrastruktur yang menyewa server khusus (dedicated VPS) untuk menjalankan node `lelangd` dan berkontribusi mengamankan jaringan secara penuh.
*   **Delegator (Public User)**: Pengguna umum (User/Admin) yang mendelegasikan koin `STAKE` mereka ke validator tepercaya untuk memperoleh reward.
*   **Independent Validator (Siapa saja)**: Pengguna publik mana pun dapat mendaftarkan diri menjadi validator baru dengan melakukan staking koin `STAKE` dalam jumlah minimum tertentu yang ditetapkan oleh protokol konsensus.

### 4.3 Mekanisme Konsensus: Tendermint BFT & DPoS

Proyek ini menggunakan kombinasi mesin konsensus **Tendermint BFT (Byzantine Fault Tolerance)** dan model **DPoS (Delegated Proof of Stake)** bawaan dari framework Cosmos SDK:

*   **Tendermint Core (BFT)**: Algoritma yang menentukan bagaimana seluruh node validator berkomunikasi, melakukan voting, dan menyepakati isi blok baru.
*   **DPoS (Delegated Proof of Stake)**: Sistem penentuan bobot suara validator berdasarkan jumlah koin `STAKE` yang di-lock (staking) oleh validator atau didelegasikan oleh pengguna publik kepada mereka.

#### Tahapan Proses Konsensus Tendermint

Konsensus berjalan secara periodik dalam setiap putaran (*round*) melalui 3 langkah utama:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TAHAPAN KONSENSUS TENDERMINT                    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  1. PROPOSE   → 1 validator (Proposer) yang terpilih secara acak       │
│                 berdasarkan bobot staking mengusulkan block baru.      │
│                                                                        │
│  2. PREVOTE   → Semua validator memeriksa validitas transaksi di block  │
│                 tersebut dan memberikan suara awal (prevote).          │
│                                                                        │
│  3. PRECOMMIT → Jika block mendapatkan ≥ 2/3 suara setuju (prevote),   │
│                 validator mengirimkan suara konfirmasi akhir           │
│                 (precommit).                                           │
│                                                                        │
│  * COMMIT     → Jika suara precommit mencapai ≥ 2/3, block resmi       │
│                 dituliskan ke dalam database blockchain (Commit).      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

#### Keunggulan Konsensus Tendermint BFT
1. **Instan Finalitas (*Instant Finality*)**: Sekali transaksi berhasil masuk ke dalam block baru, transaksi tersebut langsung bersifat permanen dan tidak dapat dibatalkan atau diubah (*no forking risk*).
2. **Kinerja Tinggi**: Waktu pembuatan block (*block time*) sangat cepat (rata-rata 1-5 detik) dibandingkan dengan sistem Proof of Work (PoW).
3. **Hemat Energi**: Tidak membutuhkan komputasi hash tingkat tinggi seperti penambangan Bitcoin.

### 4.4 Aturan Konsensus Jaringan

| Skenario | Jumlah Setuju | Hasil |
|----------|---------------|-------|
| 4 dari 4 setuju | 100% | ✅ Transaksi valid, block diterima |
| 3 dari 4 setuju | 75% | ✅ Transaksi valid, block diterima |
| 2 dari 4 setuju | 50% | ❌ Kurang dari 2/3, transaksi ditolak |
| 1 node curang | 25% | ❌ 3 node jujur menolak kecurangan |
| 2 node mati | 50% aktif | ⚠️ Jaringan berhenti (tidak cukup validator) |

### 4.4 Keuntungan Multi-Validator

1. **Tidak bisa dimanipulasi** — Tidak ada 1 pihak yang bisa mengubah data sendiri
2. **Fault tolerant** — Jika 1 node mati, jaringan tetap berjalan
3. **Transparan** — Semua validator menyimpan salinan data yang sama
4. **Terdesentralisasi** — Tidak ada single point of failure

---

## 5. Aktor (Pengguna Sistem)

### 5.1 Daftar Aktor

Sistem ini memiliki **2 aktor utama** yang berinteraksi melalui frontend:

```
┌───────────────────────────────────────────────────────────────────┐
│                        AKTOR SISTEM                               │
├───────────────────────┬───────────────────────────────────────────┤
│                       │                                           │
│  👨‍💼 ADMIN (Seller)    │  👤 USER (Buyer/Bidder)                   │
│  ─────────────────    │  ─────────────────────                    │
│  • Membuat lelang     │  • Menjelajah marketplace                 │
│  • Mengelola lelang   │  • Menawar lelang (bid rahasia via ZKP)   │
│  • Menutup lelang     │  • Membongkar bid (reveal)                │
│  • Monitoring node    │  • Klaim aset / refund                    │
│  • Laporan keamanan   │  • Melihat riwayat & leaderboard         │
│                       │                                           │
│  App: Port 5173       │  App: Port 5174                           │
│  Login: Keplr/Bypass  │  Login: Keplr Wallet                      │
│                       │                                           │
└───────────────────────┴───────────────────────────────────────────┘
```

### 5.2 Admin (Seller / Penyelenggara Lelang)

**Siapa:** Orang/organisasi yang membuat dan mengelola lelang.

| Fitur | Halaman | Penjelasan |
|-------|---------|------------|
| Login | `/login` | Masuk menggunakan Keplr Wallet atau Developer Bypass |
| Dashboard | `/dashboard` | Melihat statistik & daftar semua lelang yang dibuat |
| Buat Lelang | `/auctions/create` | Form pembuatan lelang baru (judul, harga, gambar, waktu) |
| Detail Lelang | `/auctions/:id` | Melihat detail & menutup lelang yang masih aktif |
| Monitoring | `/monitoring` | Memantau status 4 node blockchain secara real-time |
| Keamanan | `/security` | Melihat status keamanan sistem |

**Akses:** `http://localhost:5173`

### 5.3 User (Buyer / Peserta Lelang)

**Siapa:** Orang yang ingin membeli barang melalui lelang.

| Fitur | Halaman | Penjelasan |
|-------|---------|------------|
| Login | `/login` | Masuk menggunakan Keplr Wallet (Connect Wallet) |
| Marketplace | `/marketplace` | Menjelajahi daftar barang lelang yang tersedia |
| Submit Bid | `/bid/:id` | Menawar secara rahasia menggunakan ZKP (client-side) |
| Reveal Bid | `/reveal` | Membongkar bid setelah lelang ditutup |
| Riwayat | `/history` | Melihat semua bid, klaim aset, atau refund |
| Leaderboard | `/leaderboard` | Melihat peringkat penawar tertinggi |

**Akses:** `http://localhost:5174`

### 5.4 Perbandingan Hak Akses

| Aksi | Admin | User |
|------|:-----:|:----:|
| Login ke sistem | ✅ | ✅ |
| Membuat lelang baru | ✅ | ❌ |
| Menutup lelang | ✅ | ❌ |
| Menawar lelang (bid) | ❌ | ✅ |
| Membongkar bid (reveal) | ❌ | ✅ |
| Klaim aset / refund | ❌ | ✅ |
| Monitoring node blockchain | ✅ | ❌ |
| Melihat marketplace | ❌ | ✅ |
| Melihat ZKP proof backup | ✅ | ❌ |

---

## 6. Pemetaan Peran: Admin vs User

### 6.1 Diagram Alur Peran

```
                    ┌─────────────────────┐
                    │   KEPLR WALLET      │
                    │   (Identitas User)  │
                    └────────┬────────────┘
                             │
                   ┌─────────┴─────────┐
                   │                   │
            ┌──────▼──────┐    ┌───────▼──────┐
            │  ADMIN APP  │    │   USER APP   │
            │  (Seller)   │    │   (Buyer)    │
            │  Port 5173  │    │  Port 5174   │
            └──────┬──────┘    └───────┬──────┘
                   │                   │
                   └─────────┬─────────┘
                             │
                    ┌────────▼────────┐
                    │  BACKEND API    │
                    │  Port 3001      │
                    │  (Express.js)   │
                    └────────┬────────┘
                             │
                ┌────────────▼────────────┐
                │  BLOCKCHAIN NETWORK     │
                │  (4 Validator Nodes)    │
                │                         │
                │  Node1  Node2           │
                │  Node3  Node4           │
                └─────────────────────────┘
```

### 6.2 Siapa Mengelola Apa?

| Komponen | Dikelola Oleh | Keterangan |
|----------|---------------|------------|
| 4 Node Validator | Operator Jaringan (Anda) | Menjalankan proses `lelangd` di terminal |
| Backend API | Operator Jaringan (Anda) | Menjalankan `npm run dev` di `apps/backend` |
| Admin App | Admin/Seller | Mengakses via browser di `localhost:5173` |
| User App | Buyer/Bidder | Mengakses via browser di `localhost:5174` |
| Keplr Wallet | Setiap pengguna | Ekstensi browser untuk tanda tangan transaksi |

### 6.3 Perbedaan Wallet Admin vs User

Secara teknis, **wallet admin dan wallet user menggunakan teknologi yang sama** (Keplr Wallet dengan alamat `cosmos1...`). Perbedaannya hanya pada **aplikasi yang mereka akses**:

```
Wallet A (cosmos1abc...) → Login di Admin App → Menjadi ADMIN/SELLER
Wallet B (cosmos1def...) → Login di User App  → Menjadi USER/BUYER
Wallet C (cosmos1ghi...) → Login di User App  → Menjadi USER/BUYER
```

Satu wallet bisa menjadi admin DI Admin App, dan sekaligus menjadi buyer DI User App, tergantung dimana ia login.

---

## 7. Alur Interaksi Lengkap

### 7.1 Alur Lelang dari Awal sampai Akhir

```
 FASE 1: PERSIAPAN
 ═══════════════════════════════════════════════════════
 
 [Operator]  Menjalankan 4 node blockchain + backend API
      │
      ▼
 [Admin]     Login ke Admin App (port 5173)
      │
      ▼
 [Admin]     Membuat lelang baru:
             • Judul: "Lukisan Antik Abad ke-18"
             • Harga mulai: 500 STAKE
             • Waktu: 3 hari
             • Upload gambar
      │
      ▼
 [Backend]   Menyimpan metadata lelang ke database
 [Blockchain] Mencatat transaksi create_auction on-chain


 FASE 2: PENAWARAN (BIDDING)
 ═══════════════════════════════════════════════════════
 
 [User A]    Login ke User App (port 5174) via Keplr
      │
      ▼
 [User A]    Buka marketplace → Pilih "Lukisan Antik"
      │
      ▼
 [User A]    Submit bid rahasia: 750 STAKE
             • Browser: Hitung commitment_hash = SHA256(750 + salt)
             • Browser: Generate ZKP proof (client-side, SnarkJS)
             • Kirim ke backend: commitment_hash + proof_json
             • TIDAK KIRIM: nominal 750 dan salt (disimpan lokal)
      │
      ▼
 [User B]    Submit bid rahasia: 900 STAKE (proses sama)
 [User C]    Submit bid rahasia: 600 STAKE (proses sama)


 FASE 3: PENUTUPAN
 ═══════════════════════════════════════════════════════

 [Admin]     Menutup lelang dari halaman Detail Lelang
      │
      ▼
 [Blockchain] Mencatat transaksi close_auction on-chain


 FASE 4: PENGUNGKAPAN (REVEAL)
 ═══════════════════════════════════════════════════════
 
 [User A]    Reveal bid: mengirim nominal (750) + salt asli
 [User B]    Reveal bid: mengirim nominal (900) + salt asli
 [User C]    Reveal bid: mengirim nominal (600) + salt asli
      │
      ▼
 [Backend]   Verifikasi: SHA256(nominal + salt) == commitment_hash?
             • User A: ✅ Valid (750 STAKE)
             • User B: ✅ Valid (900 STAKE) ← TERTINGGI
             • User C: ✅ Valid (600 STAKE)


 FASE 5: KLAIM & REFUND
 ═══════════════════════════════════════════════════════
 
 [User B]    🏆 Pemenang! → Klaim aset lelang
 [User A]    Kalah → Refund 750 STAKE kembali
 [User C]    Kalah → Refund 600 STAKE kembali
```

### 7.2 Peran Setiap Entitas dalam Alur

| Fase | Node/Validator | Admin | User | Backend |
|------|:-:|:-:|:-:|:-:|
| Persiapan | Berjalan & siap | Membuat lelang | - | Menyimpan data |
| Bidding | Validasi transaksi | - | Menawar (ZKP) | Simpan commitment |
| Penutupan | Catat on-chain | Tutup lelang | - | Update status |
| Reveal | Validasi | - | Kirim bid asli | Verifikasi hash |
| Klaim/Refund | Proses transfer | - | Klaim/refund | Update status |

---

## 8. Diagram Arsitektur

### 8.1 Arsitektur Sistem Lengkap

```
┌──────────────────────────────────────────────────────────────────────┐
│                    ARSITEKTUR SISTEM LELANG                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─── FRONTEND LAYER ────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  ┌──────────────────┐          ┌───────────────────┐          │  │
│  │  │  👨‍💼 ADMIN APP      │          │  👤 USER APP       │          │  │
│  │  │  (Port 5173)      │          │  (Port 5174)      │          │  │
│  │  │                   │          │                   │          │  │
│  │  │  • Dashboard      │          │  • Marketplace    │          │  │
│  │  │  • Buat Lelang    │          │  • Submit Bid     │          │  │
│  │  │  • Detail Lelang  │          │  • Reveal Bid     │          │  │
│  │  │  • Monitoring     │          │  • History        │          │  │
│  │  │  • Keamanan       │          │  • Leaderboard    │          │  │
│  │  └────────┬──────────┘          └─────────┬─────────┘          │  │
│  │           │                               │                    │  │
│  │  ┌────────┴───────────────────────────────┴─────────┐          │  │
│  │  │              🔑 KEPLR WALLET EXTENSION            │          │  │
│  │  │         (Tanda tangan digital transaksi)          │          │  │
│  │  └──────────────────────┬────────────────────────────┘          │  │
│  └─────────────────────────┼──────────────────────────────────────┘  │
│                            │                                         │
│  ┌─── BACKEND LAYER ──────┼──────────────────────────────────────┐  │
│  │                         │                                      │  │
│  │  ┌──────────────────────▼───────────────────────────┐          │  │
│  │  │             🖥️ BACKEND API SERVER                 │          │  │
│  │  │              (Port 3001, Express.js)              │          │  │
│  │  │                                                   │          │  │
│  │  │  • REST API (20+ endpoints)                      │          │  │
│  │  │  • JWT Authentication                            │          │  │
│  │  │  • ZKP Proof Backup Storage                      │          │  │
│  │  │  • SQLite/PostgreSQL Database                    │          │  │
│  │  └──────────────────────┬───────────────────────────┘          │  │
│  └─────────────────────────┼──────────────────────────────────────┘  │
│                            │                                         │
│  ┌─── BLOCKCHAIN LAYER ───┼──────────────────────────────────────┐  │
│  │                         │                                      │  │
│  │  ┌──────────────────────▼───────────────────────────┐          │  │
│  │  │         ⛓️ BLOCKCHAIN NETWORK                     │          │  │
│  │  │           (lelang-testnet)                        │          │  │
│  │  │                                                   │          │  │
│  │  │    ┌──────────┐          ┌──────────┐            │          │  │
│  │  │    │ Node 1   │◄────────►│ Node 2   │            │          │  │
│  │  │    │ :26657   │          │ :26668   │            │          │  │
│  │  │    └────┬─────┘          └─────┬────┘            │          │  │
│  │  │         │    Konsensus BFT     │                 │          │  │
│  │  │    ┌────┴─────┐          ┌─────┴────┐            │          │  │
│  │  │    │ Node 3   │◄────────►│ Node 4   │            │          │  │
│  │  │    │ :26679   │          │ :26690   │            │          │  │
│  │  │    └──────────┘          └──────────┘            │          │  │
│  │  │                                                   │          │  │
│  │  │  Modul: x/lelang (Cosmos SDK Smart Contract)     │          │  │
│  │  └──────────────────────────────────────────────────┘          │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 8.2 Tabel Komponen & Port

| Komponen | Port | Teknologi | Fungsi |
|----------|------|-----------|--------|
| Admin App | `5173` | React + Vite | Dashboard pengelola lelang |
| User App | `5174` | React + Vite | Marketplace pembeli |
| Backend API | `3001` | Express.js + SQLite | REST API & database |
| Node 1 (RPC) | `26657` | Cosmos SDK / lelangd | Validator blockchain |
| Node 2 (RPC) | `26668` | Cosmos SDK / lelangd | Validator blockchain |
| Node 3 (RPC) | `26679` | Cosmos SDK / lelangd | Validator blockchain |
| Node 4 (RPC) | `26690` | Cosmos SDK / lelangd | Validator blockchain |

---

## 9. Glossary (Istilah)

| Istilah | Penjelasan |
|---------|------------|
| **Node** | Komputer/proses yang menjalankan software blockchain (`lelangd`) |
| **Validator** | Node yang memiliki hak memvalidasi transaksi dan memproduksi block |
| **Konsensus** | Proses voting antar-validator untuk menyepakati data yang valid |
| **Tendermint BFT** | Algoritma konsensus yang digunakan Cosmos SDK (toleran terhadap 1/3 node jahat) |
| **Block** | Kumpulan transaksi yang sudah divalidasi dan dikemas menjadi satu unit |
| **RPC Port** | Port untuk komunikasi API dengan node dari luar |
| **P2P Port** | Port untuk komunikasi internal antar-node |
| **Wallet** | Akun pengguna berupa alamat `cosmos1...` yang dikelola oleh Keplr |
| **Keplr** | Ekstensi browser untuk mengelola wallet Cosmos dan menandatangani transaksi |
| **JWT** | Token autentikasi yang diberikan backend setelah verifikasi tanda tangan wallet |
| **ZKP** | Zero-Knowledge Proof — bukti kriptografis yang membuktikan sesuatu tanpa mengungkapkan informasi rahasia |
| **Commitment Hash** | Hasil hash dari `SHA256(bid_amount + salt)` yang dikirim ke server |
| **Salt** | Angka acak yang ditambahkan ke bid untuk membuat hash unik |
| **Reveal** | Proses membongkar bid asli setelah lelang ditutup |
| **Sealed-Bid** | Jenis lelang dimana semua penawaran bersifat rahasia sampai lelang berakhir |
| **On-Chain** | Data/proses yang terjadi di dalam blockchain (permanen, transparan) |
| **Off-Chain** | Data/proses yang terjadi di luar blockchain (database backend) |
| **STAKE** | Denominasi mata uang native di jaringan `lelang-testnet` |
| **Admin/Seller** | Aktor yang membuat dan mengelola lelang melalui Admin App |
| **User/Buyer** | Aktor yang mengikuti dan menawar lelang melalui User App |
| **Operator** | Orang yang menjalankan node blockchain dan backend server |
