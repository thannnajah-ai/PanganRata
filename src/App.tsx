import { useState } from 'react'
import { Toaster } from 'sonner'
import { motion } from 'motion/react'
import { DisparityRadar } from '@/features/disparity/Radar'
import { WartegCalculator } from '@/features/calculator/Calculator'
import { LocationPicker } from '@/components/LocationPicker'

function App() {
  const [selectedCity, setSelectedCity] = useState(() => {
    return localStorage.getItem("panganrata_city") || "DKI Jakarta";
  });

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    localStorage.setItem("panganrata_city", city);
  };

  return (
    <div className="min-h-screen pt-4 sm:pt-12 pb-16 sm:pb-24 px-2 sm:px-6 flex justify-center">
      <div className="w-full max-w-2xl bg-surface-panel/80 backdrop-blur-xl border border-border-subtle rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
        
        <motion.header 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="px-4 sm:px-8 pt-6 sm:pt-10 pb-5 sm:pb-6 border-b border-border-subtle/50 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-4xl font-display font-semibold tracking-tight text-text-ink">PanganRata.</h1>
            <p className="text-text-muted text-xs sm:text-sm mt-1 font-medium">Commodity Disparity & Warung Ledger</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <LocationPicker selectedCity={selectedCity} onSelectCity={handleSelectCity} />
            <div className="text-[11px] sm:text-xs font-mono bg-bg-canvas px-2.5 py-1.5 rounded-xl border border-border-subtle text-text-muted">
              LIVE DATA
            </div>
          </div>
        </motion.header>

        <motion.main 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.1, duration: 0.5 }}
          className="p-3 sm:p-8 space-y-6 sm:space-y-10"
        >
          <section>
            <div className="flex items-center justify-between mb-3 sm:mb-4 px-1 sm:px-0">
              <h2 className="text-base sm:text-lg font-display text-text-ink font-semibold">Radar Disparitas Pasar</h2>
              <span className="text-xs font-medium text-text-muted">{selectedCity}</span>
            </div>
            <DisparityRadar city={selectedCity} />
          </section>

          <section>
            <WartegCalculator city={selectedCity} />
          </section>
        </motion.main>
      </div>

      <Toaster 
        position="bottom-center"
      />
    </div>
  )
}

export default App
