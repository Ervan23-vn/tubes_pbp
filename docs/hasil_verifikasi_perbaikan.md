# Laporan Audit & Verifikasi Tugas Perbaikan Proyek Lelang Blockchain

Laporan ini menyajikan hasil pengecekan mendalam terhadap status pemenuhan tugas perbaikan untuk setiap peran (*role*) yang tercantum dalam berkas `docs/laporan_status_proyek.md`. Pemeriksaan dilakukan langsung pada codebase proyek di lingkungan WSL Anda.

---

## 📊 Ringkasan Status Pemenuhan Tugas

Secara keseluruhan, **perbaikan belum sepenuhnya terpenuhi (Baru ~50% Selesai)**. Beberapa perbaikan krusial pada Smart Contract (Rust) dan dokumen laporan pengujian belum diimplementasikan. Selain itu, ditemukan **mismatch algoritma kriptografi (Bug Fatal)** antara frontend dan contract yang akan menyebabkan alur *reveal bid* gagal total di runtime.

Berikut adalah tabel status pemenuhan perbaikan:

| Peran | Tugas | File Target | Status | Detail Temuan & Catatan |
| :--- | :--- | :--- | :---: | :--- |
| **BE** | 1. Perbaikan Skrip Setup Validator | `scripts/setup-local-nodes.sh` | **Terpenuhi ✅** | Denominasi `stake` telah diganti dengan `ulct` di parameter genesis dan gentx. |
| **BE** | 2. Perbaikan Bug Routing Endpoint | `apps/backend/src/routes/api.js` | **Terpenuhi ✅** | Jalur ganda `/api/auctions` telah diperbaiki menjadi `/auctions/:item_id/status` pada baris 75. |
| **BE** | 3. Penyediaan Template `.env.example` | `apps/backend/.env.example` | **Belum Terpenuhi ❌** | Berkas `.env.example` tidak ditemukan di direktori `apps/backend/`. Baru ada berkas `.env` lokal. |
| **SC/ZKP** | 1. Perbaikan Kompilasi Smart Contract | `contracts/lelang/src/zkp_verifier.rs` | **Belum Terpenuhi ❌** | Kode pada baris 106 masih menggunakan `&vk` bertipe `VerifyingKey` langsung ke `verify_proof` tanpa `prepare_verifying_key`. Ini menyebabkan **compile error** pada Rust. |
| **SC/ZKP** | 2. Investigasi Validitas Bukti ZKP | `zkp-circuits/circuit.circom` | **Belum Terpenuhi ⚠️** | Sirkuit menggunakan **Poseidon Hash** untuk komitmen, sedangkan frontend menggunakan **Keccak256**. Ini adalah *mismatch* algoritma fatal. |
| **SC/ZKP** | 3. Pembuatan Evaluasi Performa ZKP | `docs/zkp-performance.md` | **Belum Terpenuhi ❌** | Berkas dokumen laporan performa sirkuit ZKP ini tidak ditemukan. |
| **FE** | 1. Implementasi Detail Lelang Pembeli | `apps/user/src/pages/AuctionDetail.jsx` | **Terpenuhi ✅** | Halaman detail lelang pembeli sudah diimplementasikan lengkap dengan antarmuka penawaran, audit trail ZKP, dan tombol klaim/refund. |
| **FE** | 2. Integrasi Endpoint Status Lelang | `apps/admin/src/pages/AuctionDetail.jsx` | **Terpenuhi ✅** | Tombol "Tutup Lelang" di admin sudah terintegrasi dengan benar karena rute backend sudah diperbaiki. |
| **Bersama**| 1. Laporan Pengujian Alur Akhir E2E | `docs/e2e-test-report.md` | **Belum Terpenuhi ❌** | Berkas dokumen laporan pengujian E2E tidak ditemukan di direktori `docs/`. |

---

## 🔍 Temuan Detail & Analisis Teknis

### 1. Peran: Backend Developer (BE)
*   **Tugas 1 (Validator Setup - Sukses):** Skrip inisialisasi lokal `setup-local-nodes.sh` dan `setup-local-nodes-wsl.sh` sudah bersih dari kata `stake` untuk alokasi koin awal dan transaksi genesis. Semuanya telah dikonfigurasi menggunakan denominasi `ulct`.
*   **Tugas 2 (Endpoint Routing - Sukses):** Penggabungan rute di Express router backend sudah diperbaiki sehingga tidak terjadi lagi penumpukan `/api/api`.
*   **Tugas 3 (.env Template - GAGAL):** Rekan tim Anda belum membuat berkas `.env.example`. Akibatnya, jika ada anggota tim baru yang melakukan clone, mereka tidak tahu variabel PostgreSQL apa saja yang perlu disiapkan.

### 2. Peran: Smart Contract & Cryptography Developer (SC/ZKP)
*   **Tugas 1 (Kompilasi Contract - GAGAL):**
    Di dalam `contracts/lelang/src/zkp_verifier.rs` baris 106, kode verifikasi tertulis:
    ```rust
    Groth16::<Bn254>::verify_proof(&vk, &proof, &inputs)
    ```
    Pustaka `ark-groth16` versi `0.4.0` mewajibkan parameter pertama berupa `PreparedVerifyingKey` (`&pvk`), bukan `VerifyingKey` (`&vk`). Kode ini **pasti gagal compile** dengan error ketidakcocokan tipe data.
    
    *Rekomendasi Solusi:*
    ```rust
    let pvk = ark_groth16::prepare_verifying_key(&vk);
    Groth16::<Bn254>::verify_proof(&pvk, &proof, &inputs)
    ```

*   **Tugas 2 (Investigasi Bukti ZKP - GAGAL / BUG CRITICAL 🚨):**
    Terjadi **mismatch algoritma hashing** yang sangat fatal antara Frontend dan Blockchain/Smart Contract:
    1.  **Frontend (`SubmitBid.jsx` & `RevealBid.jsx`):** Menggunakan `ethers.solidityPackedKeccak256` untuk menghitung `commitment_hash` dari nominal bid (dalam Wei) dan salt.
    2.  **Sirkuit ZKP (`circuit.circom`):** Menggunakan **Poseidon Hash** berkapasitas 2 input (`nominal_bid` dan `salt`).
    3.  **Smart Contract (`contract.rs`):** Menggunakan fungsi pembantu `compute_poseidon_hash` dengan pustaka `light-poseidon` di Rust untuk memverifikasi kecocokan bid saat fase *reveal*.
    
    *Konsekuensi:* Ketika pengguna mengirimkan bid rahasia dari frontend, hash komitmen yang terdaftar adalah hasil **Keccak256**. Namun saat pengguna membuka (*reveal*) nominal dan salt miliknya, smart contract akan menghitung ulang komitmen tersebut menggunakan **Poseidon**. Kedua hash ini **tidak akan pernah cocok**, sehingga seluruh penawaran sah akan ditolak oleh smart contract saat fase reveal.

*   **Tugas 3 (Dokumen Evaluasi Performa ZKP - GAGAL):**
    Berkas `docs/zkp-performance.md` tidak ada di repositori.

### 3. Peran: Frontend Developer (FE)
*   **Tugas 1 (Halaman Detail User - Sukses):** Halaman `apps/user/src/pages/AuctionDetail.jsx` sudah sepenuhnya diimplementasikan dengan antarmuka yang sangat informatif (menampilkan status lelang, log audit bukti ZKP dari backend, dan tombol klaim barang / refund).
*   **Tugas 2 (Integrasi Status Admin - Sukses):** Rute pembaruan status lelang dari sisi frontend sudah sinkron dengan backend yang telah diperbaiki.

### 4. Tugas Bersama
*   **Pengujian E2E (Laporan Akhir - GAGAL):**
    Berkas `docs/e2e-test-report.md` tidak ada di repositori. Pengujian alur lelang secara menyeluruh dari pembuatan, penawaran rahasia, penutupan, reveal, hingga klaim belum dapat didokumentasikan karena kompilasi smart contract yang masih rusak.

---

## 🛠️ Langkah Perbaikan Selanjutnya

Untuk menuntaskan tugas-tugas di atas, berikut langkah konkret yang perlu segera diambil:
1.  **Backend:** Buat berkas `apps/backend/.env.example` dengan menyalin variabel dari `.env` lokal Anda tanpa nilai sensitif.
2.  **Smart Contract:** Edit `contracts/lelang/src/zkp_verifier.rs` baris 106 untuk menerapkan `prepare_verifying_key`.
3.  **Sinkronisasi Kriptografi:** Ubah sirkuit ZKP dan Smart Contract untuk menggunakan Keccak256, atau ubah frontend (JS) agar menghitung Poseidon Hash secara lokal sebelum membuat bukti komitmen (menggunakan pustaka seperti `poseidon-lite` atau `circomlibjs`).
4.  **Eksekusi Dokumentasi:** Jalankan k6 stress test dan buat dokumen `zkp-performance.md` serta `e2e-test-report.md`.
