# Pembagian Tugas Tim: Daftar Perbaikan Sistem Lelang Elektronik IT

Dokumen ini memuat daftar perbaikan spesifik dan langsung ke inti masalah yang harus dilakukan oleh masing-masing peran (Smart Contract, Backend, dan Frontend) untuk menyelesaikan seluruh temuan *failed* pada laporan audit proyek.

---

## 🔒 1. Peran: Smart Contract (SC) Engineer
### **Fokus Utama: Memperbaiki Kegagalan Verifikasi ZKP & Unit Test**

*   **Berkas yang Diperbaiki:** `contracts/lelang/src/zkp_verifier.rs`
*   **Masalah:** Tes `test_all_flow` gagal (*FAILED*) dengan error `ZkpVerificationFailed` pada baris 458 karena koordinat real dan imajiner pada titik kurva G2 tertukar saat diimpor dari format SnarkJS ke format Rust/arkworks.
*   **Tindakan Perbaikan:**
    *   Ubah pemetaan G2 di fungsi `parse_proof` dan `parse_verifying_key` dari `Fq2::new(x0, x1)` menjadi `Fq2::new(x1, x0)` (dan begitu pula untuk koordinat y).
    *   Jalankan `cargo test` di direktori `contracts/lelang` untuk memastikan seluruh alur lelang (Alice dan Bob) lulus pengujian verifikasi matematika ZKP secara on-chain.
    *   Lakukan compile ulang ke format `.wasm` dengan perintah `cargo wasm` untuk memperbarui berkas di `target/wasm32-unknown-unknown/release/lelang_contract.wasm`.

---

## ⚙️ 2. Peran: Backend (BE) Engineer
### **Fokus Utama: Memperbaiki Script Inisialisasi Jaringan Lokal (WSL) & Faucet**

*   **Berkas 1 yang Diperbaiki:** `scripts/setup-local-nodes-wsl.sh`
    *   **Masalah:** Skrip inisialisasi localnet gagal berjalan karena memiliki *hardcoded path* `cd "/home/dendifathur/LELANG TERDEMINT BFT/tubes_pbp"`.
    *   **Tindakan Perbaikan:** Ganti *hardcoded path* tersebut menjadi path relatif dinamis: `cd "$(dirname "$0")/.."`.
*   **Berkas 2 yang Diperbaiki:** `faucet.sh` (di root direktori)
    *   **Masalah:** Skrip menggunakan pemanggilan `./lelangchaind.exe` (untuk Windows) sehingga error saat dieksekusi di WSL.
    *   **Tindakan Perbaikan:** Sesuaikan nama binari menjadi `./lelangd` dan arahkan transaksi faucet ke node lokal yang aktif (`http://127.0.0.1:26607`).
*   **Validasi:** Pastikan 4 node validator localnet blockchain berhasil dimulai dan log konsensus berjalan aktif di folder `./localnet`.

---

## 💻 3. Peran: Frontend (FE) Engineer
### **Fokus Utama: Penyelarasan Integrasi ZKP Keplr & Denominasi Token LCT**

*   **Berkas yang Diperbaiki:** `apps/user/src/pages/AuctionDetail.jsx`, `Marketplace.jsx`, dan `apps/admin/src/pages/CreateAuction.jsx`
*   **Masalah:**
    1.  Penawaran bid rahasia menggunakan ZKP dari browser harus sesuai dengan parameter input public yang baru diverifikasi oleh smart contract.
    2.  Denominasi token di UI masih menampilkan `STAKE`, padahal di on-chain telah diubah menjadi `LCT` (dengan satuan dasar `ulct`).
*   **Tindakan Perbaikan:**
    *   Pastikan parameter bukti ZKP yang di-generate dari generator sirkuit dikirim secara valid ke backend dan smart contract on-chain.
    *   Sesuaikan visualisasi token di seluruh komponen halaman frontend dari `STAKE` menjadi `LCT` (dengan konversi nominal desimal 6 angka dari unit dasar `ulct` ke `LCT`).
