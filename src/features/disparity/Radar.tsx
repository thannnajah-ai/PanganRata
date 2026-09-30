import { useEffect, useState } from "react";
import { turso } from "@/lib/turso";
import { motion, AnimatePresence } from "motion/react";
import { TrendingUp, ChevronDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline, SparklinePoint } from "@/components/ui/Sparkline";

type CommodityData = {
  id: string;
  name: string;
  unit: string;
  category: string;
  markets: {
    marketName: string;
    location: string;
    price: number;
  }[];
  minPrice: number;
  maxPrice: number;
  history: SparklinePoint[];
};

export function DisparityRadar({ city = "DKI Jakarta" }: { city?: string }) {
  const [data, setData] = useState<CommodityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const today = new Date().toISOString().split("T")[0];
        
        // Single concurrent network round-trip for maximum speed
        const [commRes, priceRes, historyRes] = await Promise.all([
          turso.execute("SELECT * FROM commodities"),
          turso.execute({
            sql: `
              SELECT p.commodity_id, p.price, m.name as market_name, m.location 
              FROM prices p 
              JOIN markets m ON p.market_id = m.id 
              WHERE p.date = ? AND (m.city = ? OR m.city IS NULL)
            `,
            args: [today, city]
          }),
          turso.execute({
            sql: `
              SELECT p.commodity_id, p.date, ROUND(AVG(p.price)) as price
              FROM prices p
              JOIN markets m ON p.market_id = m.id
              WHERE (m.city = ? OR m.city IS NULL)
              GROUP BY p.commodity_id, p.date
              ORDER BY p.date ASC
            `,
            args: [city]
          })
        ]);

        const commodities = commRes.rows;

        // Group data
        const grouped: CommodityData[] = commodities.map((c: any) => {
          const mktPrices = priceRes.rows
            .filter((p: any) => p.commodity_id === c.id)
            .map((p: any) => ({
              marketName: p.market_name as string,
              location: p.location as string,
              price: p.price as number
            }))
            .sort((a, b) => a.price - b.price); // Cheapest first

          const history = historyRes.rows
            .filter((h: any) => h.commodity_id === c.id)
            .map((h: any) => ({
              date: h.date as string,
              price: h.price as number
            }));

          return {
            id: c.id as string,
            name: c.name as string,
            unit: c.unit as string,
            category: c.category as string,
            markets: mktPrices,
            minPrice: mktPrices.length > 0 ? mktPrices[0].price : 0,
            maxPrice: mktPrices.length > 0 ? mktPrices[mktPrices.length - 1].price : 0,
            history
          };
        });

        setData(grouped);
      } catch (error) {
        console.error("Failed to load Turso data", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [city]);

  const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-16 bg-border-subtle rounded-xl" />)}
    </div>;
  }

  return (
    <div className="space-y-4">
      {data.map((item) => {
        const isExpanded = expandedId === item.id;
        const disparity = item.maxPrice - item.minPrice;
        
        return (
          <motion.div 
            key={item.id}
            layout
            onClick={() => setExpandedId(isExpanded ? null : item.id)}
            className="group relative bg-surface-panel/50 backdrop-blur-sm border border-border-subtle rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
          >
            {/* Subtle hover gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-border-subtle/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            {/* Header / Summary Row */}
            <motion.div layout className="relative p-3.5 sm:p-6 flex items-center justify-between z-10 gap-2.5">
              <div className="min-w-0 flex-1">
                <h3 className="font-display font-semibold text-base sm:text-xl text-text-ink leading-snug truncate sm:overflow-visible sm:whitespace-normal">
                  {item.name}
                </h3>
                <p className="text-text-muted text-[10px] sm:text-xs font-semibold uppercase tracking-wider sm:tracking-widest mt-0.5">
                  {item.category} <span className="opacity-50 mx-0.5 sm:mx-1">•</span> {item.unit}
                </p>
              </div>
              
              <div className="text-right flex items-center gap-2.5 sm:gap-5 shrink-0">
                <div>
                  <p className="text-sm sm:text-lg font-semibold font-mono text-text-ink tracking-tight whitespace-nowrap">
                    {formatIDR(item.minPrice)}
                  </p>
                  {disparity > 0 ? (
                    <p className="text-[10px] sm:text-xs text-delta-expensive flex items-center justify-end gap-0.5 sm:gap-1 font-medium mt-0.5 whitespace-nowrap">
                      <TrendingUp className="w-3 h-3 stroke-[2.5]" />
                      +{formatIDR(disparity)} gap
                    </p>
                  ) : (
                    <p className="text-[10px] sm:text-xs text-text-muted flex items-center justify-end gap-1 font-medium mt-0.5 whitespace-nowrap">
                      Harga Stabil
                    </p>
                  )}
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="bg-bg-canvas p-1 sm:p-1.5 rounded-full border border-border-subtle group-hover:border-text-muted/30 transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-text-ink" />
                </motion.div>
              </div>
            </motion.div>

            {/* Expanded Content using FLIP Layout morphing */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="relative z-10"
                >
                  <div className="px-3.5 sm:px-6 pb-4 sm:pb-6 pt-1">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-border-subtle to-transparent mb-4 sm:mb-5" />
                    
                    {/* Interactive 14-Day Sparkline Scrubber */}
                    {item.history.length > 0 && (
                      <div className="mb-5 bg-surface-panel/90 p-3 sm:p-4 rounded-xl border border-border-subtle/80 shadow-2xs">
                        <Sparkline data={item.history} height={64} />
                      </div>
                    )}

                    <p className="text-[10px] sm:text-[11px] font-semibold text-text-muted mb-2.5 sm:mb-3 uppercase tracking-wider sm:tracking-widest">
                      Perbandingan Harga Pasar Induk
                    </p>
                    <ul className="space-y-2 sm:space-y-2.5">
                      {item.markets.map((m, idx) => (
                        <li key={idx} className="flex justify-between items-center text-xs sm:text-sm bg-bg-canvas/50 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-border-subtle/50 gap-2">
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <div className="bg-surface-panel p-1.5 rounded-md shadow-sm border border-border-subtle/50 shrink-0">
                              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-text-muted" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-text-ink block truncate">{m.marketName}</span>
                              <span className="text-[10px] sm:text-[11px] text-text-muted tracking-wide font-medium block truncate">{m.location}</span>
                            </div>
                          </div>
                          <span className={cn(
                            "font-mono font-medium tracking-tight shrink-0 whitespace-nowrap text-xs sm:text-sm",
                            idx === 0 ? "text-delta-cheap bg-delta-cheap/10 px-1.5 sm:px-2 py-0.5 rounded" : 
                            (idx === item.markets.length - 1 ? "text-delta-expensive bg-delta-expensive/10 px-1.5 sm:px-2 py-0.5 rounded" : "text-text-ink")
                          )}>
                            {formatIDR(m.price)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {data.length === 0 && (
        <div className="text-center py-10 px-4 border-2 border-dashed border-border-subtle rounded-2xl bg-bg-canvas/40">
          <p className="text-xs sm:text-sm font-medium text-text-muted">
            Belum ada data pasar untuk wilayah {city}.
          </p>
          <p className="text-[11px] text-text-muted/70 mt-1">
            Silakan pilih kota lain seperti DKI Jakarta, Kota Bandung, atau Kota Surabaya.
          </p>
        </div>
      )}
    </div>
  );
}
