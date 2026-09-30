import { useEffect, useState, useMemo } from "react";
import { turso } from "@/lib/turso";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X, Calculator as CalcIcon, Navigation, Store, Sparkles } from "lucide-react";

import { 
  BaseCommodity, 
  MarketPriceItem, 
  CartItem, 
  computeTotalHPP, 
  computeRouting 
} from "./routing";

export function WartegCalculator({ city = "DKI Jakarta" }: { city?: string }) {
  const [catalog, setCatalog] = useState<BaseCommodity[]>([]);
  const [allMarketPrices, setAllMarketPrices] = useState<MarketPriceItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCatalog() {
      try {
        const today = new Date().toISOString().split("T")[0];
        
        // Single query fetching all market prices in this city
        const res = await turso.execute({
          sql: `
            SELECT 
              p.commodity_id, 
              c.name as commodity_name, 
              c.unit, 
              p.price, 
              m.id as market_id, 
              m.name as market_name, 
              m.location
            FROM prices p 
            JOIN commodities c ON p.commodity_id = c.id 
            JOIN markets m ON p.market_id = m.id
            WHERE p.date = ? AND (m.city = ? OR m.city IS NULL)
            ORDER BY p.price ASC
          `,
          args: [today, city]
        });

        const raw = res.rows.map((r: any) => ({
          commodityId: r.commodity_id as string,
          commodityName: r.commodity_name as string,
          unit: r.unit as string,
          price: r.price as number,
          marketId: r.market_id as string,
          marketName: r.market_name as string,
          location: r.location as string
        }));

        setAllMarketPrices(raw);

        // Group into unique base commodities with lowest price
        const commMap = new Map<string, BaseCommodity>();
        raw.forEach(r => {
          if (!commMap.has(r.commodityId)) {
            commMap.set(r.commodityId, {
              id: r.commodityId,
              name: r.commodityName,
              unit: r.unit,
              minPrice: r.price
            });
          }
        });

        setCatalog(Array.from(commMap.values()));
      } catch (err) {
        console.error("Calculator failed to fetch", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCatalog();
  }, [city]);

  const addRow = () => {
    if (catalog.length === 0) return;
    setCart((prev) => [
      ...prev,
      { uid: crypto.randomUUID(), commodityId: catalog[0].id, qty: "1" }
    ]);
  };

  const removeRow = (uid: string) => {
    setCart((prev) => prev.filter(c => c.uid !== uid));
  };

  const updateRow = (uid: string, field: 'commodityId' | 'qty', value: any) => {
    setCart((prev) => prev.map(c => c.uid === uid ? { ...c, [field]: value } : c));
  };

  const totalHPP = useMemo(() => computeTotalHPP(cart, catalog), [cart, catalog]);
  const routing = useMemo(() => computeRouting(cart, allMarketPrices), [cart, allMarketPrices]);

  const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  if (loading) return null;

  return (
    <div className="bg-surface-panel border border-border-subtle rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg relative">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-border-subtle/20 pointer-events-none" />
      
      <div className="p-4 sm:p-8 relative z-10">
        <div className="flex items-center gap-2.5 sm:gap-3 mb-5 sm:mb-8 pb-3 sm:pb-4 border-b border-border-subtle/60">
          <div className="bg-text-ink text-surface-panel p-2 rounded-xl shadow-md shrink-0">
            <CalcIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-display font-semibold text-text-ink">Kalkulator HPP Warteg</h2>
            <p className="text-[11px] sm:text-xs text-text-muted mt-0.5">Estimasi modal dari harga pasar termurah</p>
          </div>
        </div>

        <div className="space-y-2.5 sm:space-y-3 min-h-[100px]">
          <AnimatePresence mode="popLayout" initial={false}>
            {cart.map((item) => {
              const comm = catalog.find(c => c.id === item.commodityId);
              const q = typeof item.qty === 'string' ? (parseFloat(item.qty) || 0) : (item.qty || 0);
              const rowCost = (comm?.minPrice || 0) * q;

              return (
                <motion.div
                  key={item.uid}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                  transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.8 }}
                  className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 bg-bg-canvas/60 border border-border-subtle/50 p-2.5 sm:p-3 rounded-2xl items-stretch sm:items-center"
                >
                  <div className="relative flex-1 w-full">
                    <select 
                      value={item.commodityId}
                      onChange={(e) => updateRow(item.uid, 'commodityId', e.target.value)}
                      className="w-full bg-surface-panel border border-border-subtle rounded-xl pl-3 pr-9 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:border-text-ink/30 transition-colors appearance-none cursor-pointer"
                    >
                      {catalog.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-start gap-2.5 w-full sm:w-auto">
                    <div className="relative w-24 sm:w-28 shrink-0">
                      <input 
                        type="number" 
                        min="0"
                        step="any"
                        placeholder="0"
                        value={item.qty}
                        onChange={(e) => updateRow(item.uid, 'qty', e.target.value)}
                        className="w-full bg-surface-panel border border-border-subtle rounded-xl pl-2.5 pr-9 py-2 text-xs sm:text-sm font-mono focus:outline-none focus:border-text-ink/30 transition-colors"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-muted uppercase tracking-wider pointer-events-none">
                        {comm?.unit}
                      </span>
                    </div>

                    <div className="font-mono text-xs sm:text-sm font-semibold text-text-ink text-right shrink-0">
                      {formatIDR(rowCost)}
                    </div>

                    <button 
                      onClick={() => removeRow(item.uid)}
                      aria-label="Hapus bahan"
                      className="p-2 sm:p-2.5 bg-surface-panel text-text-muted hover:text-delta-expensive border border-transparent hover:border-delta-expensive/30 hover:bg-delta-expensive/10 rounded-xl transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {cart.length === 0 && (
            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-xs sm:text-sm text-text-muted text-center py-6 font-medium border-2 border-dashed border-border-subtle rounded-2xl"
            >
              Belum ada bahan baku. Klik tombol di bawah untuk menambah.
            </motion.p>
          )}
        </div>

        <div className="mt-4 sm:mt-6">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={addRow}
            className="flex items-center justify-center gap-2 w-full py-2.5 sm:py-3 bg-bg-canvas border border-border-subtle text-text-ink rounded-xl sm:rounded-2xl font-medium text-xs sm:text-sm hover:border-text-ink/20 hover:shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Bahan
          </motion.button>
        </div>

        {/* Total HPP Footer */}
        <motion.div layout className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-border-subtle/80 flex flex-row justify-between items-center gap-2">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider sm:tracking-widest mb-0.5">Total Estimasi Modal (HPP)</p>
            <p className="text-xl sm:text-3xl font-display font-semibold text-text-ink tracking-tight">
              {formatIDR(totalHPP)}
            </p>
          </div>
          <div className="bg-delta-cheap/10 text-delta-cheap border border-delta-cheap/20 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-semibold flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-delta-cheap animate-pulse" />
            Harga Termurah
          </div>
        </motion.div>

        {/* Smart Shopping Routing Recommendations */}
        {routing && routing.splitMarkets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 pt-5 border-t border-border-subtle/60"
          >
            <div className="flex items-center gap-2 mb-3">
              <Navigation className="w-4 h-4 text-accent-grain" />
              <h3 className="text-xs sm:text-sm font-semibold text-text-ink uppercase tracking-wider">
                Rekomendasi Rute Belanja Hemat
              </h3>
            </div>

            {/* Split Route Breakdown */}
            <div className="space-y-2 mb-4">
              {routing.splitMarkets.map((m, idx) => (
                <div
                  key={idx}
                  className="bg-bg-canvas/60 border border-border-subtle/70 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 bg-surface-panel rounded-lg border border-border-subtle/50 text-text-muted shrink-0 mt-0.5">
                      <Store className="w-3.5 h-3.5 text-accent-grain" />
                    </div>
                    <div>
                      <span className="font-semibold text-xs sm:text-sm text-text-ink block">
                        {m.marketName}
                      </span>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Beli:{" "}
                        {m.items
                          .map((i) => `${i.name} (${i.qty} ${i.unit})`)
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right sm:text-right font-mono text-xs sm:text-sm font-semibold text-text-ink shrink-0 pl-8 sm:pl-0">
                    {formatIDR(m.subtotal)}
                  </div>
                </div>
              ))}
            </div>

            {/* Strategy Comparison Card */}
            {routing.bestSingle && (
              <div className="bg-surface-panel p-3.5 rounded-xl border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-1.5 text-text-muted font-medium">
                    <span>Opsi 1 Tempat:</span>
                    <strong className="text-text-ink">{routing.bestSingle.marketName}</strong>
                    <span>({formatIDR(routing.bestSingle.total)})</span>
                  </div>
                  {routing.savings > 0 && (
                    <p className="text-[11px] text-delta-cheap font-medium mt-0.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Hemat {formatIDR(routing.savings)} dengan belanja split di atas!
                    </p>
                  )}
                </div>
                <div className="text-[11px] font-mono font-semibold bg-bg-canvas px-2.5 py-1 rounded-lg border border-border-subtle text-text-muted shrink-0 self-start sm:self-auto">
                  {routing.splitMarkets.length} Pasar Terpilih
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

