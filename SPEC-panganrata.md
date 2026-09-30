# Spec: PANGANRATA (Commodity Disparity & Warung Ledger)

## Objective
Membangun web app berbasis *mobile-first* untuk memantau disparitas harga pangan harian antar pasar tradisional terdekat dan menyediakan kalkulator modal (HPP) bagi UMKM kuliner. Tujuannya adalah melindungi margin laba pedagang warung/warteg dari lonjakan harga *volatile food* spekulatif.

## Tech Stack
- **Frontend Framework:** React 19 (via Vite)
- **Styling:** Tailwind CSS v4 + CSS Variables murni
- **Motion & Interactions:** `motion/react` (Framer Motion v12) + Sonner (Toasts)
- **Database:** Turso (LibSQL Serverless SQLite)
- **Icons:** Lucide React
- **Data Pipeline (Terpisah):** GitHub Actions (Cron) + Node.js/Python fetcher
- **Hosting:** Cloudflare Pages

## Commands
```bash
Install: npm install
Dev: npm run dev
Build: npm run build
Lint: npm run lint
Test: npm run test:unit
```

## Project Structure
```text
src/
├── components/
│   ├── ui/          # Komponen dasar (Button, Card, Input)
│   └── motion/      # Komponen dengan interaksi khusus (Accordion, Scrubber, Tabs)
├── features/
│   ├── disparity/   # Logika radar disparitas harga pasar
│   └── calculator/  # Logika mesin kalkulator resep warteg
├── lib/
│   ├── turso.ts     # Klien koneksi DB Edge
│   └── utils.ts     # Fungsi format mata uang, helper Tailwind (clsx)
├── styles/
│   └── index.css    # Palet warna Warm Tactical Ledger (CSS variables)
└── App.tsx          # Root dan Layout Aplikasi
```

## Code Style
- Gunakan *Functional Components* standar dengan React Hooks.
- Jangan gunakan *state* yang tidak perlu (manfaatkan *derived state* dari prop).
- Semua string warna wajib memanggil *CSS Variable* yang sudah di-tokenisasi.

```tsx
// Contoh: Komponen UI dengan integrasi Motion dan Tailwind standar
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function TacticleButton({ label, onClick, className }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={onClick}
      className={cn(
        "bg-surface-panel border border-border-subtle text-text-ink px-4 py-2 rounded shadow-sm",
        className
      )}
    >
      {label}
    </motion.button>
  );
}
```

## Testing Strategy
- **Framework:** Vitest (Cepat dan terintegrasi mulus dengan Vite).
- **Target Tes:** Fokus pengujian pada fungsi utilitas murni di `features/calculator/` (memastikan perhitungan matriks modal dan margin selalu akurat meskipun input berubah).
- Komponen visual (*Motion*) akan diverifikasi secara manual pada fase MVP ini.

## Boundaries
- **Always:** Gunakan komponen turunan dari `motion/react` untuk semua interaksi transisi layout dan klik; pastikan warna selalu memakai palet editorial *Warm Ledger*.
- **Ask first:** Sebelum menambahkan *library* eksternal baru (seperti *date library* atau *charting library* raksasa), tanyakan dulu (utamakan solusi *zero-dependency* atau *micro-library*).
- **Never:** Jangan menyimpan kunci API rahasia (seperti Token Turso berakses tulis) di dalam aplikasi klien. Web app ini hanya boleh memiliki akses *Read-Only* ke database produksi.

## Success Criteria
1. Pengguna dapat memilih kota/kabupaten dan seketika (< 500ms) melihat daftar komoditas pangan beserta rentang harga antar pasar di wilayahnya.
2. Interaksi menggeser grafik *sparkline* 14 hari terasa responsif, mengunci ke titik harga secara magnetik, dan tidak memicu pergeseran tata letak halaman (CLS 0).
3. Fitur kalkulator dapat menerima masukan komoditas, jumlah Kg, menghitung total biaya, lalu menampilkan pasar dengan nilai keranjang paling murah.

## Open Questions
- [x] **Sumber Data Spesifik:** *Disepakati untuk langsung menggunakan API BPS (Web API BPS `webapi.bps.go.id`) dan tidak menggunakan data dummy.*
