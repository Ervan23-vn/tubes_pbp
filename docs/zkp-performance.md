# Evaluasi Performa Sirkuit ZKP — Lelang Terdemint BFT

Dokumen ini merinci hasil evaluasi performa sirkuit ZKP (`circuit.circom`) yang digunakan untuk penawaran aman (*privacy-preserving bidding*) dalam sistem lelang blockchain.

---

## 📊 Metrik Sirkuit ZKP (Groth16 - BN254)

Sirkuit `BidGreaterThan` dirancang untuk memverifikasi secara rahasia bahwa nominal bid dari pembeli lebih besar daripada harga dasar lelang, sekaligus menghasilkan komitmen hash rahasia menggunakan Poseidon Hash.

Berikut adalah rincian metrik performa sirkuit:

| Parameter | Nilai Metrik | Deskripsi |
| :--- | :--- | :--- |
| **Jumlah Constraints** | ~370-400 Constraints | Sangat optimal dan ringan untuk dijalankan pada peramban web pembeli. |
| **Proving Time (Client-Side)** | ~80 - 150 ms | Waktu pembuatan bukti di sisi peramban web pembeli (menggunakan CPU standar). |
| **Verification Time (On-Chain)** | ~5 - 15 ms | Waktu verifikasi bukti oleh validator node atau smart contract CosmWasm. |
| **Ukuran Berkas Bukti (Proof)** | ~800 Bytes | File JSON (`proof.json`) berisi koordinat grup kurva eliptik `pi_a`, `pi_b`, dan `pi_c`. |
| **Ukuran Kunci Verifikasi (VK)** | ~3.4 KB | File JSON (`verification_key.json`) yang disimpan dalam smart contract. |

---

## 🔒 Desain Keamanan Sirkuit

Sirkuit ini memiliki input dan output sebagai berikut:

*   **Input Rahasia (Private Inputs):**
    *   `nominal_bid`: Nilai nominal bid pembeli (disembunyikan dari publik/backend).
    *   `salt`: Angka acak kriptografis unik untuk mencegah serangan tabrakan hash (*rainbow table attack*).
*   **Input Terbuka (Public Inputs):**
    *   `harga_dasar`: Harga dasar awal lelang yang diatur oleh penjual/sistem.
*   **Output (Public Signals):**
    *   `is_valid`: Bernilai `1` jika `nominal_bid > harga_dasar`, dan `0` jika sebaliknya.
    *   `commitment_hash`: Poseidon Hash dari `(nominal_bid, salt)` sebagai pembuktian bid yang terdaftar secara on-chain.

---

## 📈 Keuntungan Efisiensi & Skalabilitas

1.  **Client-Side Proving:** Pembuatan bukti ZKP dilakukan sepenuhnya di perangkat pembeli, sehingga server backend tidak pernah mengetahui nominal bid asli, menjamin privasi penuh.
2.  **On-Chain Verification:** Proses verifikasi sangat murah dalam konsumsi gas *fee* karena jumlah batasan (*constraints*) sirkuit di bawah 500, menjadikannya sangat bersahabat untuk dijalankan secara berkala pada smart contract.
3.  **Algoritma Poseidon:** Penggunaan Poseidon Hash di dalam sirkuit memotong jumlah constraints hingga 10x lipat jika dibandingkan dengan hash tradisional seperti SHA-256.
