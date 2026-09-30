import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { motion, AnimatePresence } from 'motion/react'
import { DisparityRadar } from '@/features/disparity/Radar'
import { WartegCalculator } from '@/features/calculator/Calculator'
import { Ledger } from '@/features/ledger/Ledger'
import { LocationPicker } from '@/components/LocationPicker'
import { turso } from '@/lib/turso'
import { Radar, Calculator, BookOpen } from 'lucide-react'

export type AppData = {
  commodities: any[];
  todayPrices: any[];
  historyPrices: any[];
  loading: boolean;
};

function App() {
  const [selectedCity, setSelectedCity] = useState(() => {
    return localStorage.getItem("panganrata_city") || "DKI Jakarta";
  });
  const [activeTab, setActiveTab] = useState<'radar' | 'calculator' | 'ledger'>('radar');

  const [data, setData] = useState<AppData>({
    commodities: [],
    todayPrices: [],
    historyPrices: [],
    loading: true,
  });

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    localStorage.setItem("panganrata_city", city);
  };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        if (isMounted) setData(prev => ({ ...prev, loading: true }));
        const today = new Date().toISOString().split("T")[0];
        
        const [commRes, priceRes, historyRes] = await Promise.all([
          turso.execute("SELECT * FROM commodities"),
          turso.execute({
            sql: `
              SELECT p.commodity_id, p.price, m.name as market_name, m.location, m.id as market_id
              FROM prices p 
              JOIN markets m ON p.market_id = m.id 
              WHERE p.date = ? AND (m.city = ? OR m.city IS NULL)
              ORDER BY p.price ASC
            `,
            args: [today, selectedCity]
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
            args: [selectedCity]
          })
        ]);

        if (isMounted) {
          setData({
            commodities: commRes.rows,
            todayPrices: priceRes.rows,
            historyPrices: historyRes.rows,
            loading: false,
          });
        }
      } catch (error) {
        console.error("Failed to load Turso data", error);
        if (isMounted) setData(prev => ({ ...prev, loading: false }));
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [selectedCity]);

  return (
    <div className="min-h-screen pt-4 sm:pt-12 pb-24 sm:pb-32 px-2 sm:px-6 flex justify-center bg-bg-canvas relative overflow-hidden">
      <div className="w-full max-w-2xl bg-surface-panel/80 backdrop-blur-xl border border-border-subtle rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden relative z-10 flex flex-col h-full min-h-[80vh]">
        
        <motion.header 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="px-4 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b border-border-subtle/50 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 shrink-0"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-text-ink">PanganRata.</h1>
            <p className="text-text-muted text-[11px] sm:text-xs mt-1 font-medium">Commodity Disparity & Warung Ledger</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <LocationPicker selectedCity={selectedCity} onSelectCity={handleSelectCity} />
            <div className="text-[10px] sm:text-[11px] font-mono bg-bg-canvas px-2 py-1 rounded-lg border border-border-subtle text-text-muted">
              LIVE DATA
            </div>
          </div>
        </motion.header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 custom-scrollbar pb-24">
          <AnimatePresence mode="wait">
            {activeTab === 'radar' ? (
              <motion.section
                key="radar"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-3 px-1 sm:px-0">
                  <h2 className="text-sm sm:text-base font-display text-text-ink font-semibold">Radar Disparitas Pasar</h2>
                  <span className="text-[11px] font-medium text-text-muted">{selectedCity}</span>
                </div>
                <DisparityRadar city={selectedCity} data={data} />
              </motion.section>
            ) : activeTab === 'calculator' ? (
              <motion.section
                key="calculator"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <WartegCalculator data={data} />
              </motion.section>
            ) : (
              <motion.section
                key="ledger"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Ledger />
              </motion.section>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-[320px] px-4">
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 25 }}
          className="bg-surface-panel/95 backdrop-blur-md border border-border-subtle p-1.5 rounded-2xl shadow-xl flex items-center justify-between relative overflow-hidden"
        >
          <button
            onClick={() => setActiveTab('radar')}
            className={`relative flex-1 flex flex-col items-center gap-1 py-2 sm:py-2.5 rounded-xl text-xs font-semibold z-10 transition-colors ${activeTab === 'radar' ? 'text-text-ink' : 'text-text-muted hover:text-text-ink/70'}`}
          >
            <Radar className="w-5 h-5 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-[11px]">Radar Harga</span>
            {activeTab === 'radar' && (
              <motion.div layoutId="nav-bg" className="absolute inset-0 bg-bg-canvas border border-border-subtle rounded-xl -z-10 shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 30 }} />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('calculator')}
            className={`relative flex-1 flex flex-col items-center gap-1 py-2 sm:py-2.5 rounded-xl text-xs font-semibold z-10 transition-colors ${activeTab === 'calculator' ? 'text-text-ink' : 'text-text-muted hover:text-text-ink/70'}`}
          >
            <Calculator className="w-5 h-5 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-[11px]">Kalkulator</span>
            {activeTab === 'calculator' && (
              <motion.div layoutId="nav-bg" className="absolute inset-0 bg-bg-canvas border border-border-subtle rounded-xl -z-10 shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 30 }} />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('ledger')}
            className={`relative flex-1 flex flex-col items-center gap-1 py-2 sm:py-2.5 rounded-xl text-xs font-semibold z-10 transition-colors ${activeTab === 'ledger' ? 'text-text-ink' : 'text-text-muted hover:text-text-ink/70'}`}
          >
            <BookOpen className="w-5 h-5 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-[11px]">Buku Kas</span>
            {activeTab === 'ledger' && (
              <motion.div layoutId="nav-bg" className="absolute inset-0 bg-bg-canvas border border-border-subtle rounded-xl -z-10 shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 30 }} />
            )}
          </button>
        </motion.div>
      </div>

      <Toaster position="top-center" />
    </div>
  )
}

export default App

