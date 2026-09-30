export type BaseCommodity = {
  id: string;
  name: string;
  unit: string;
  minPrice: number;
};

export type MarketPriceItem = {
  commodityId: string;
  commodityName: string;
  unit: string;
  price: number;
  marketId: string;
  marketName: string;
  location: string;
};

export type CartItem = {
  uid: string;
  commodityId: string;
  qty: string | number;
};

export type SplitMarketRoute = {
  marketName: string;
  location: string;
  items: { name: string; qty: number; cost: number; unit: string }[];
  subtotal: number;
};

export type SingleMarketOption = {
  marketName: string;
  location: string;
  total: number;
};

export type RoutingResult = {
  splitMarkets: SplitMarketRoute[];
  splitTotal: number;
  bestSingle: SingleMarketOption | null;
  savings: number;
};

/**
 * Menghitung total estimasi HPP berdasarkan harga termurah per komoditas.
 */
export function computeTotalHPP(cart: CartItem[], catalog: BaseCommodity[]): number {
  return cart.reduce((acc, item) => {
    const comm = catalog.find((c) => c.id === item.commodityId);
    if (!comm) return acc;
    const q = typeof item.qty === "string" ? parseFloat(item.qty) || 0 : item.qty || 0;
    return acc + comm.minPrice * q;
  }, 0);
}

/**
 * Menghitung rekomendasi rute belanja cerdas:
 * 1. Opsi Split Market: Memilih pasar termurah untuk masing-masing komoditas
 * 2. Opsi Single Market: Memilih 1 pasar tunggal paling murah untuk seluruh keranjang belanja
 * 3. Selisih Penghematan (Savings) jika user memilih rute multi-pasar vs 1 pasar.
 */
export function computeRouting(
  cart: CartItem[],
  allMarketPrices: MarketPriceItem[]
): RoutingResult | null {
  if (cart.length === 0 || allMarketPrices.length === 0) return null;

  const splitRouteMap: Record<string, SplitMarketRoute> = {};
  let splitTotal = 0;

  cart.forEach((item) => {
    const q = typeof item.qty === "string" ? parseFloat(item.qty) || 0 : item.qty || 0;
    if (q <= 0) return;

    const commPrices = allMarketPrices
      .filter((p) => p.commodityId === item.commodityId)
      .sort((a, b) => a.price - b.price);

    if (commPrices.length === 0) return;
    const cheapest = commPrices[0];
    const cost = cheapest.price * q;
    splitTotal += cost;

    if (!splitRouteMap[cheapest.marketId]) {
      splitRouteMap[cheapest.marketId] = {
        marketName: cheapest.marketName,
        location: cheapest.location,
        items: [],
        subtotal: 0,
      };
    }

    splitRouteMap[cheapest.marketId].items.push({
      name: cheapest.commodityName,
      qty: q,
      cost,
      unit: cheapest.unit,
    });
    splitRouteMap[cheapest.marketId].subtotal += cost;
  });

  const splitMarkets = Object.values(splitRouteMap);

  // Cari opsi 1 pasar terbaik (single market)
  const marketSet = new Map<string, { id: string; name: string; location: string }>();
  allMarketPrices.forEach((p) => {
    if (!marketSet.has(p.marketId)) {
      marketSet.set(p.marketId, { id: p.marketId, name: p.marketName, location: p.location });
    }
  });

  const singleMarketOptions: SingleMarketOption[] = [];

  marketSet.forEach((m) => {
    let total = 0;
    let isComplete = true;

    cart.forEach((item) => {
      const q = typeof item.qty === "string" ? parseFloat(item.qty) || 0 : item.qty || 0;
      if (q <= 0) return;

      const p = allMarketPrices.find(
        (price) => price.marketId === m.id && price.commodityId === item.commodityId
      );
      if (p) {
        total += p.price * q;
      } else {
        isComplete = false;
      }
    });

    if (isComplete && total > 0) {
      singleMarketOptions.push({
        marketName: m.name,
        location: m.location,
        total,
      });
    }
  });

  singleMarketOptions.sort((a, b) => a.total - b.total);
  const bestSingle = singleMarketOptions.length > 0 ? singleMarketOptions[0] : null;
  const savings = bestSingle && bestSingle.total > splitTotal ? bestSingle.total - splitTotal : 0;

  return {
    splitMarkets,
    splitTotal,
    bestSingle,
    savings,
  };
}
