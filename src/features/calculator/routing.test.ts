import test from "node:test";
import assert from "node:assert/strict";
import { computeTotalHPP, computeRouting, BaseCommodity, MarketPriceItem, CartItem } from "./routing.js";

const sampleCatalog: BaseCommodity[] = [
  { id: "com_ayam", name: "Daging Ayam", unit: "Kg", minPrice: 35000 },
  { id: "com_cabai", name: "Cabai Merah", unit: "Kg", minPrice: 50000 },
];

const sampleMarketPrices: MarketPriceItem[] = [
  // Pasar A: Ayam 35.000, Cabai 60.000
  {
    commodityId: "com_ayam",
    commodityName: "Daging Ayam",
    unit: "Kg",
    price: 35000,
    marketId: "mkt_a",
    marketName: "Pasar Kramat Jati",
    location: "Jakarta Timur",
  },
  {
    commodityId: "com_cabai",
    commodityName: "Cabai Merah",
    unit: "Kg",
    price: 60000,
    marketId: "mkt_a",
    marketName: "Pasar Kramat Jati",
    location: "Jakarta Timur",
  },
  // Pasar B: Ayam 40.000, Cabai 50.000
  {
    commodityId: "com_ayam",
    commodityName: "Daging Ayam",
    unit: "Kg",
    price: 40000,
    marketId: "mkt_b",
    marketName: "Pasar Senen",
    location: "Jakarta Pusat",
  },
  {
    commodityId: "com_cabai",
    commodityName: "Cabai Merah",
    unit: "Kg",
    price: 50000,
    marketId: "mkt_b",
    marketName: "Pasar Senen",
    location: "Jakarta Pusat",
  },
];

test("computeTotalHPP: correctly calculates sum of minimum prices with fractional quantities", () => {
  const cart: CartItem[] = [
    { uid: "1", commodityId: "com_ayam", qty: 2 }, // 2 * 35000 = 70000
    { uid: "2", commodityId: "com_cabai", qty: "0.5" }, // 0.5 * 50000 = 25000
  ];

  const total = computeTotalHPP(cart, sampleCatalog);
  assert.equal(total, 95000);
});

test("computeRouting: returns null for empty cart or empty prices", () => {
  assert.equal(computeRouting([], sampleMarketPrices), null);
  assert.equal(
    computeRouting([{ uid: "1", commodityId: "com_ayam", qty: 1 }], []),
    null
  );
});

test("computeRouting: identifies optimal split routing across markets and computes savings", () => {
  const cart: CartItem[] = [
    { uid: "1", commodityId: "com_ayam", qty: 2 }, // Cheapest at Pasar A (35.000 * 2 = 70.000)
    { uid: "2", commodityId: "com_cabai", qty: 1 }, // Cheapest at Pasar B (50.000 * 1 = 50.000)
  ];

  const result = computeRouting(cart, sampleMarketPrices);
  assert.ok(result);

  // Split routing: 70.000 (A) + 50.000 (B) = 120.000
  assert.equal(result.splitTotal, 120000);
  assert.equal(result.splitMarkets.length, 2);

  // Single market option comparison:
  // If buying only at Pasar A: Ayam 2*35.000 (70.000) + Cabai 1*60.000 (60.000) = 130.000
  // If buying only at Pasar B: Ayam 2*40.000 (80.000) + Cabai 1*50.000 (50.000) = 130.000
  // Best single is either 130.000
  assert.equal(result.bestSingle?.total, 130000);

  // Net potential savings by splitting: 130.000 - 120.000 = 10.000
  assert.equal(result.savings, 10000);
});
