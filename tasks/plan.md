# Implementation Plan: PANGANRATA

## 1. Foundation (Infra & Styling) [SELESAI]
- [x] Setup Vite + React 19 + TypeScript.
- [x] Setup Tailwind v4 dan definisikan *tokenized color palette* (Warm Tactical Ledger) di `index.css`.
- [x] Install dependensi kunci: `motion/react`, `lucide-react`, `sonner`, `@libsql/client` (Turso).
- [x] Setup klien koneksi Turso DB (`src/lib/turso.ts`).

## 2. Core UI Components [SELESAI]
- [x] Buat komponen UI dengan animasi tekan (scale down).
- [x] Buat layout ekspansi dengan *FLIP layout morphing* (`motion/react`) untuk menampilkan detail disparitas pasar.
- [x] Buat layout dasar aplikasi (*Mobile-first container* responsif, ramah layar 360px - 768px+).
- [x] Buat komponen `LocationPicker` (GPS + manual kota dengan persistensi localStorage).

## 3. Data Integration [SELESAI]
- [x] Buat struktur tabel SQLite di Turso (`commodities`, `markets`, `prices` dengan kolom `city` dan index unik).
- [x] Buat skrip *fetcher* API BPS (`scripts/fetch-bps.ts`) terhubung ke Web API BPS (`webapi.bps.go.id`).
- [x] Otomasi sinkronisasi harga via GitHub Actions (`.github/workflows/sync-prices.yml`).
- [x] Seed data riil 14 hari ke belakang untuk grafik riwayat disparitas.

## 4. Fitur Utama: Disparity Radar [SELESAI]
- [x] Tampilkan daftar harga pangan utama beserta rentang harga terendah-tertinggi terfilter per kota (< 150ms).
- [x] Transisi mulus antar mode tampilan (List ke Detail).
- [x] Integrasi grafik sparkline 14 hari murni SVG dengan *magnetic scrubber* interaktif dan CLS = 0.

## 5. Fitur Utama: Warteg Calculator [SELESAI]
- [x] Form input dinamis untuk daftar belanja bahan (satuan Kg/Gram/Ekor) dengan input editing stabil.
- [x] *Math engine* HPP berbasis harga pasar termurah.
- [x] Rekomendasi Rute Belanja Hemat (*Smart Shopping Routing*: komparasi *split market* vs *single market* + nominal penghematan).
- [x] Pengujian unit otomatis via `node:test` (`npm run test:unit`) lolos 100%.

## Status Proyek
Semua kriteria sukses dari `SPEC-panganrata.md` telah terpenuhi dan diverifikasi secara menyeluruh.
