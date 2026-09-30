# PanganRata 🌾⚖️
> **Commodity Disparity Radar & Smart Warung Ledger**  
> *Melindungi margin laba UMKM kuliner dan warung makan dari lonjakan harga pangan spekulatif antar pasar tradisional.*

---

## 📌 Latar Belakang & Masalah
Harga bahan pokok di Indonesia kerap mengalami fluktuasi tajam (*volatile food*) dan disparitas signifikan antar pasar tradisional dalam satu kota yang sama. Pedagang warung makan (warteg/rumah makan) sering kali membeli bahan baku dengan selisih harga tinggi tanpa menyadari adanya pasar alternatif terdekat yang menjual jauh lebih murah. 

**PanganRata** hadir sebagai solusi *mobile-first web ledger* yang menyediakan:
1. **Radar Disparitas Pasar Real-Time** untuk memantau rentang harga terendah-tertinggi komoditas pokok antar pasar induk.
2. **Grafik Riwayat 14 Hari Interaktif** untuk melihat tren pergerakan harga tanpa penambahan library grafik yang membebani browser.
3. **Kalkulator HPP Warteg & Rekomendasi Rute Belanja Pintar** untuk menghitung estimasi modal belanja bahan baku sekaligus memberikan rekomendasi pasar termurah (*split-market* vs *single-market*).
4. **Data Pipeline BPS Otomatis** yang menarik data harga riil dari Web API Badan Pusat Statistik (`webapi.bps.go.id`).

---

## ⚡ Fitur Utama

### 1. Radar Disparitas Pasar per Wilayah (Latency < 150ms)
- Pilihan kota fleksibel (DKI Jakarta, Kota Bandung, Kota Surabaya, Kota Semarang, Medan, dll.).
- Dilengkapi fitur **Deteksi Lokasi GPS** otomatis untuk menemukan kota terdekat.
- Query Turso Edge Database yang dioptimalkan secara paralel (`Promise.all`) dalam satu round-trip jaringan.

### 2. Grafik Sparkline 14 Hari (100% Pure SVG & Zero-Dependency)
- Dibuat murni dengan SVG Cubic Bezier `<path>` tanpa library grafik eksternal (ukuran 0 kB chart bloat).
- **Magnetic Touch Scrubber**: Mengunci ke titik tanggal dan harga terdekat secara magnetik saat digeser.
- **Zero Cumulative Layout Shift (CLS = 0)**: Tata letak stabil tanpa pergeseran layout selama interaksi.
- Indikator tren persentase fluktuasi harga 14 hari terakhir.

### 3. Kalkulator HPP Warteg & Rekomendasi Rute Belanja Hemat
- Input dinamis daftar bahan (Kg/Gram/Ekor) dengan UX pengeditan angka yang mulus.
- Perhitungan instan Harga Pokok Produksi (HPP) berdasarkan harga terendah harian.
- **Rekomendasi Rute Belanja Cerdas (*Smart Shopping Routing*)**:
  - **Opsi Split Market**: Mengelompokkan komoditas ke pasar dengan harga paling murah untuk masing-masing item.
  - **Opsi Single Market**: Menampilkan 1 pasar terbaik jika ingin belanja semua bahan di satu tempat.
  - **Estimasi Hemat**: Menghitung potensi penghematan nominal belanja jika menggunakan rute rekomendasi.

### 4. Data Pipeline BPS & Automasi GitHub Actions
- Mengambil data resmi dari Web API BPS (`webapi.bps.go.id`) berdasarkan kode domain regional (`3100`, `3200`, `3500`).
- Terjadwal otomatis setiap hari pukul 06:00 WIB (23:00 UTC) melalui GitHub Actions Workflow (`sync-prices.yml`).

---

## 🛠️ Tech Stack & Filosofi Desain

Proyek ini dibangun dengan menerapkan prinsip **Ponytail** (solusi lazy tapi efisien: kode paling minimal, standard library/fitur native lebih diutamakan, dan hindari library eksternal berlebih):

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v4, CSS Variables murni (*Warm Tactical Ledger Theme*)
- **Motion & Interactions:** `motion/react` (Framer Motion v12) untuk FLIP layout morphing halus
- **Database:** [Turso](https://turso.tech/) (Serverless LibSQL / SQLite at the Edge)
- **Icons & Notifications:** Lucide React, Sonner
- **Testing:** Node.js Native Test Runner (`node:test`, `node:assert/strict`) — tanpa dependensi framework testing luar
- **Linter:** Oxlint (super cepat, selesai dalam < 50ms)
- **CI/CD:** GitHub Actions

---

## 🚀 Panduan Memulai Cepat

### Prasyarat
- Node.js versi 20+
- Akun / Database di Turso (LibSQL)
- API Key BPS (opsional untuk menjalankan pipeline riil BPS)

### 1. Kloning Repositori
```bash
git clone https://github.com/thannnajah-ai/panganrata.git
cd panganrata
```

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Lingkungan (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi variabel berikut:
```env
VITE_TURSO_DATABASE_URL="libsql://your-database-name.turso.io"
VITE_TURSO_AUTH_TOKEN="your-turso-auth-token"
VITE_BPS_API_KEY="your-bps-webapi-key"
```

### 4. Sinkronisasi Data / Seeding Awal
Inisialisasi skema tabel dan isi data awal pasar serta riwayat harga 14 hari:
```bash
npx tsx scripts/seed.ts
```

### 5. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka peramban di `http://localhost:5173/`.

---

## 🧪 Skrip & Perintah

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev` | Menjalankan local development server Vite dengan HMR |
| `npm run build` | Melakukan type check (`tsc -b`) dan kompilasi bundle produksi |
| `npm run lint` | Menjalankan linter Oxlint |
| `npm run test:unit` | Menjalankan pengujian unit kalkulator & routing menggunakan native `node:test` |
| `npx tsx scripts/fetch-bps.ts` | Menjalankan pipeline penarikan data langsung dari Web API BPS |

---

## 📂 Struktur Proyek

```text
panganrata/
├── .github/workflows/
│   └── sync-prices.yml      # Cron harian otomatisasi harga (06:00 WIB)
├── scripts/
│   ├── schema.sql           # Skema SQLite (commodities, markets, prices)
│   ├── seed.ts              # Seeder 14 hari multi-kota
│   └── fetch-bps.ts         # Pipeline Web API BPS & ingestion Turso
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   └── Sparkline.tsx# Pure SVG 14-day chart dengan magnetic scrubber
│   │   └── LocationPicker.tsx# Pemilih kota & GPS detector
│   ├── features/
│   │   ├── disparity/
│   │   │   └── Radar.tsx    # Radar disparitas komoditas per pasar
│   │   └── calculator/
│   │       ├── Calculator.tsx # UI Kalkulator HPP & routing
│   │       ├── routing.ts     # Pure math engine HPP & Smart Shopping Route
│   │       └── routing.test.ts# Unit tests via node:test
│   ├── lib/
│   │   ├── turso.ts         # Client koneksi LibSQL Turso Edge
│   │   └── utils.ts         # Helper utility
│   ├── styles/
│   │   └── index.css        # Token desain Warm Tactical Ledger
│   ├── App.tsx              # Root aplikasi & layout mobile-first
│   └── main.tsx             # Entry point
├── SPEC-panganrata.md       # Dokumen spesifikasi teknis proyek
└── package.json
```

---

## 📄 Lisensi
Didistribusikan di bawah Lisensi MIT. Bebas digunakan untuk mendukung pemberdayaan pedagang warung dan UMKM kuliner di Indonesia.
