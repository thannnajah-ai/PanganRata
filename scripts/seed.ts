import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const tursoUrl = process.env.VITE_TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.VITE_TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoToken) {
  console.error("Missing Turso credentials in .env");
  process.exit(1);
}

const db = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

async function run() {
  console.log("Memulai sinkronisasi data...");

  // 1. Eksekusi Schema
  const schemaSql = fs.readFileSync(path.join(process.cwd(), "scripts/schema.sql"), "utf-8");
  const statements = schemaSql.split(";").filter(stmt => stmt.trim() !== "");

  for (const stmt of statements) {
    await db.execute(stmt);
  }

  // Migrasi kolom city jika belum ada
  try {
    await db.execute("ALTER TABLE markets ADD COLUMN city TEXT DEFAULT 'DKI Jakarta'");
  } catch {
    // Column already exists
  }
  console.log("✅ Skema database siap.");

  const markets = [
    // DKI Jakarta
    { id: "mkt_jkt_1", name: "Pasar Induk Kramat Jati", location: "Jakarta Timur", city: "DKI Jakarta" },
    { id: "mkt_jkt_2", name: "Pasar Senen", location: "Jakarta Pusat", city: "DKI Jakarta" },
    { id: "mkt_jkt_3", name: "Pasar Anyar", location: "Bogor (Sekitar)", city: "DKI Jakarta" },

    // Kota Bandung
    { id: "mkt_bdg_1", name: "Pasar Kosambi", location: "Bandung Tengah", city: "Kota Bandung" },
    { id: "mkt_bdg_2", name: "Pasar Baru", location: "Bandung Barat", city: "Kota Bandung" },
    { id: "mkt_bdg_3", name: "Pasar Ciroyom", location: "Andir", city: "Kota Bandung" },

    // Kota Surabaya
    { id: "mkt_sby_1", name: "Pasar Keputran", location: "Tegalsari", city: "Kota Surabaya" },
    { id: "mkt_sby_2", name: "Pasar Wonokromo", location: "Wonokromo", city: "Kota Surabaya" },
    { id: "mkt_sby_3", name: "Pasar Pabean", location: "Cantikan", city: "Kota Surabaya" },

    // Kota Semarang
    { id: "mkt_smg_1", name: "Pasar Johar", location: "Semarang Tengah", city: "Kota Semarang" },
    { id: "mkt_smg_2", name: "Pasar Peterongan", location: "Semarang Selatan", city: "Kota Semarang" },
    { id: "mkt_smg_3", name: "Pasar Karangayu", location: "Semarang Barat", city: "Kota Semarang" },

    // Kota Medan
    { id: "mkt_mdn_1", name: "Pasar Petisah", location: "Medan Petisah", city: "Kota Medan" },

    // Kota Yogyakarta
    { id: "mkt_ygk_1", name: "Pasar Beringharjo", location: "Gondomanan", city: "Kota Yogyakarta" },

    // Kota Makassar
    { id: "mkt_mks_1", name: "Pasar Terong", location: "Bontoala", city: "Kota Makassar" },

    // Kota Denpasar
    { id: "mkt_dps_1", name: "Pasar Badung", location: "Denpasar Barat", city: "Kota Denpasar" }
  ];
  const commodities = [
    // POKOK
    { id: "com_1", name: "Beras Medium", unit: "Kg", category: "Pokok" },
    { id: "com_11", name: "Beras Premium", unit: "Kg", category: "Pokok" },
    { id: "com_12", name: "Gula Pasir", unit: "Kg", category: "Pokok" },
    { id: "com_13", name: "Minyak Goreng Curah", unit: "Liter", category: "Pokok" },
    { id: "com_14", name: "Tepung Terigu", unit: "Kg", category: "Pokok" },

    // SAYUR
    { id: "com_2", name: "Cabai Merah Keriting", unit: "Kg", category: "Sayur" },
    { id: "com_21", name: "Cabai Rawit Merah", unit: "Kg", category: "Sayur" },
    { id: "com_3", name: "Bawang Merah", unit: "Kg", category: "Sayur" },
    { id: "com_31", name: "Bawang Putih", unit: "Kg", category: "Sayur" },
    { id: "com_32", name: "Tomat Merah", unit: "Kg", category: "Sayur" },
    { id: "com_33", name: "Sayur Kol / Kubis", unit: "Kg", category: "Sayur" },

    // PROTEIN
    { id: "com_4", name: "Daging Ayam Ras", unit: "Ekor", category: "Protein" },
    { id: "com_41", name: "Daging Sapi", unit: "Kg", category: "Protein" },
    { id: "com_5", name: "Telur Ayam Ras", unit: "Kg", category: "Protein" },
    { id: "com_51", name: "Ikan Lele", unit: "Kg", category: "Protein" },
    { id: "com_52", name: "Tahu Putih", unit: "Potong", category: "Protein" },
    { id: "com_53", name: "Tempe", unit: "Papan", category: "Protein" }
  ];

  console.log("Menyuntikkan data master pasar dan komoditas per kota...");

  for (const m of markets) {
    await db.execute({
      sql: "INSERT INTO markets (id, name, location, city) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET city=excluded.city, name=excluded.name, location=excluded.location",
      args: [m.id, m.name, m.location, m.city]
    });
  }

  for (const c of commodities) {
    await db.execute({
      sql: "INSERT OR IGNORE INTO commodities (id, name, unit, category) VALUES (?, ?, ?, ?)",
      args: [c.id, c.name, c.unit, c.category]
    });
  }

  const cityBasePrices: Record<string, Record<string, number>> = {
    "DKI Jakarta": {
      "com_1": 14000, "com_11": 16000, "com_12": 18000, "com_13": 15000, "com_14": 11000,
      "com_2": 65000, "com_21": 70000, "com_3": 45000, "com_31": 42000, "com_32": 18000, "com_33": 12000,
      "com_4": 38000, "com_41": 140000, "com_5": 28000, "com_51": 25000, "com_52": 2000, "com_53": 5000
    },
    "Kota Bandung": {
      "com_1": 13500, "com_11": 15500, "com_12": 17500, "com_13": 14500, "com_14": 10500,
      "com_2": 58000, "com_21": 65000, "com_3": 42000, "com_31": 40000, "com_32": 16000, "com_33": 10000,
      "com_4": 36500, "com_41": 135000, "com_5": 27500, "com_51": 24000, "com_52": 1800, "com_53": 4500
    },
    "Kota Surabaya": {
      "com_1": 13800, "com_11": 15800, "com_12": 17800, "com_13": 14800, "com_14": 10800,
      "com_2": 62000, "com_21": 68000, "com_3": 40000, "com_31": 39000, "com_32": 17000, "com_33": 11000,
      "com_4": 35000, "com_41": 130000, "com_5": 27000, "com_51": 23000, "com_52": 1500, "com_53": 4000
    },
    "Kota Semarang": {
      "com_1": 13600, "com_11": 15600, "com_12": 17600, "com_13": 14600, "com_14": 10600,
      "com_2": 60000, "com_21": 66000, "com_3": 41000, "com_31": 39500, "com_32": 16500, "com_33": 10500,
      "com_4": 36000, "com_41": 132000, "com_5": 27200, "com_51": 23500, "com_52": 1600, "com_53": 4200
    },
    "Kota Medan": {
      "com_1": 13900, "com_11": 15900, "com_12": 17900, "com_13": 14900, "com_14": 10900,
      "com_2": 63000, "com_21": 69000, "com_3": 43000, "com_31": 41000, "com_32": 17500, "com_33": 11500,
      "com_4": 37000, "com_41": 138000, "com_5": 27800, "com_51": 24500, "com_52": 1900, "com_53": 4800
    },
    "Kota Yogyakarta": {
      "com_1": 13400, "com_11": 15400, "com_12": 17400, "com_13": 14400, "com_14": 10400,
      "com_2": 57000, "com_21": 64000, "com_3": 40500, "com_31": 39000, "com_32": 15500, "com_33": 9500,
      "com_4": 35500, "com_41": 128000, "com_5": 26500, "com_51": 22000, "com_52": 1400, "com_53": 3500
    },
    "Kota Makassar": {
      "com_1": 14200, "com_11": 16200, "com_12": 18200, "com_13": 15200, "com_14": 11200,
      "com_2": 66000, "com_21": 71000, "com_3": 46000, "com_31": 43000, "com_32": 18500, "com_33": 12500,
      "com_4": 38500, "com_41": 142000, "com_5": 28500, "com_51": 26000, "com_52": 2100, "com_53": 5200
    },
    "Kota Denpasar": {
      "com_1": 14100, "com_11": 16100, "com_12": 18100, "com_13": 15100, "com_14": 11100,
      "com_2": 64000, "com_21": 70000, "com_3": 45500, "com_31": 42500, "com_32": 18000, "com_33": 12000,
      "com_4": 37500, "com_41": 141000, "com_5": 28200, "com_51": 25500, "com_52": 2000, "com_53": 5100
    }
  };

  console.log("Menyinkronkan harga 14 hari ke belakang untuk grafik Sparkline...");

  // Generate 14 days of historical daily prices (from 13 days ago to today)
  const batchStmts = [];

  for (let d = 13; d >= 0; d--) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - d);
    const dateStr = targetDate.toISOString().split("T")[0];

    // Wave drift factor over 14 days
    const wave = Math.sin((13 - d) * 0.4);

    for (const c of commodities) {
      for (const m of markets) {
        const baseMap = cityBasePrices[m.city] || cityBasePrices["DKI Jakarta"];
        const variance = Math.floor(wave * 2500) + ((c.id.charCodeAt(4) * 31) % 1500);
        const price = (baseMap[c.id] || 15000) + variance;
        const id = `${c.id}_${m.id}_${dateStr}`;

        batchStmts.push({
          sql: `
            INSERT INTO prices (id, commodity_id, market_id, price, date) 
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(commodity_id, market_id, date) DO UPDATE SET price=excluded.price
          `,
          args: [id, c.id, m.id, price, dateStr]
        });
      }
    }
  }

  // Execute in chunks of 500
  const chunkSize = 500;
  for (let i = 0; i < batchStmts.length; i += chunkSize) {
    const chunk = batchStmts.slice(i, i + chunkSize);
    await db.batch(chunk, "write");
    console.log(`Batched ${i + chunk.length}/${batchStmts.length} baris...`);
  }

  console.log("✅ Data harga 14 hari berhasil disinkronkan ke Turso!");
  process.exit(0);
}

run().catch(console.error);
