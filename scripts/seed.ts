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
    { id: "mkt_sby_3", name: "Pasar Pabean", location: "Cantikan", city: "Kota Surabaya" }
  ];

  const commodities = [
    { id: "com_1", name: "Beras Medium", unit: "Kg", category: "Pokok" },
    { id: "com_2", name: "Cabai Merah Keriting", unit: "Kg", category: "Sayur" },
    { id: "com_3", name: "Bawang Merah", unit: "Kg", category: "Sayur" },
    { id: "com_4", name: "Daging Ayam Ras", unit: "Ekor", category: "Protein" },
    { id: "com_5", name: "Telur Ayam Ras", unit: "Kg", category: "Protein" }
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
    "DKI Jakarta": { "com_1": 14000, "com_2": 65000, "com_3": 45000, "com_4": 38000, "com_5": 28000 },
    "Kota Bandung": { "com_1": 13500, "com_2": 58000, "com_3": 42000, "com_4": 36500, "com_5": 27500 },
    "Kota Surabaya": { "com_1": 13800, "com_2": 62000, "com_3": 40000, "com_4": 35000, "com_5": 27000 }
  };

  console.log("Menyinkronkan harga 14 hari ke belakang untuk grafik Sparkline...");

  // Generate 14 days of historical daily prices (from 13 days ago to today)
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

        await db.execute({
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

  console.log("✅ Data harga 14 hari berhasil disinkronkan ke Turso!");
  process.exit(0);
}

run().catch(console.error);
