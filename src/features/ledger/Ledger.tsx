import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, TrendingUp, TrendingDown, Trash2, CalendarDays } from "lucide-react";

export type LedgerEntry = {
  id: string;
  date: string;
  totalCost: number;
  targetRevenue: number;
  margin: number;
  items: number;
};

export function Ledger() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("warung_ledger");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setEntries(parsed.sort((a: LedgerEntry, b: LedgerEntry) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (e) {
        console.error("Failed to parse ledger", e);
      }
    }
  }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }).format(date);
  };

  const clearLedger = () => {
    if (window.confirm("Hapus semua riwayat Buku Kas?")) {
      localStorage.removeItem("warung_ledger");
      setEntries([]);
    }
  };

  // Weekly Stats
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  startOfWeek.setHours(0, 0, 0, 0);

  const thisWeekEntries = entries.filter(e => new Date(e.date) >= startOfWeek);
  const weeklyExpense = thisWeekEntries.reduce((acc, curr) => acc + curr.totalCost, 0);
  const weeklyRevenue = thisWeekEntries.reduce((acc, curr) => acc + curr.targetRevenue, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col">
          <h2 className="text-sm sm:text-base font-display text-text-ink font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-accent-grain" />
            Buku Kas Harian
          </h2>
          <p className="text-xs text-text-muted mt-1">Riwayat belanja dan margin laba.</p>
        </div>
        {entries.length > 0 && (
          <button 
            onClick={clearLedger}
            className="p-2 text-text-muted hover:text-delta-expensive bg-bg-canvas border border-border-subtle rounded-xl transition-colors shadow-2xs"
            aria-label="Hapus Riwayat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Summary Card */}
      <div className="bg-surface-panel border border-border-subtle p-4 rounded-2xl shadow-sm flex flex-col gap-3 relative overflow-hidden">
        <div className="absolute -right-6 -top-6 text-border-subtle/30 pointer-events-none">
          <CalendarDays className="w-24 h-24" />
        </div>
        <h3 className="text-xs font-semibold tracking-wider text-text-muted uppercase relative z-10">
          Ringkasan Minggu Ini
        </h3>
        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-text-muted">Total Modal Belanja</span>
            <span className="font-mono font-semibold text-text-ink text-sm sm:text-base">{formatCurrency(weeklyExpense)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-text-muted">Proyeksi Omzet</span>
            <span className="font-mono font-semibold text-accent-grain text-sm sm:text-base">{formatCurrency(weeklyRevenue)}</span>
          </div>
        </div>
      </div>

      {/* Entries List */}
      <div className="flex flex-col gap-3 mt-2">
        <h3 className="text-xs font-semibold tracking-wider text-text-muted uppercase">
          Riwayat Transaksi
        </h3>
        
        <AnimatePresence mode="popLayout">
          {entries.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="py-12 flex flex-col items-center justify-center text-center gap-3 border border-dashed border-border-subtle rounded-2xl bg-bg-canvas/50"
            >
              <BookOpen className="w-10 h-10 text-border-subtle" strokeWidth={1} />
              <p className="text-xs text-text-muted max-w-[200px]">Belum ada riwayat. Simpan hasil kalkulator HPP Anda untuk melihatnya di sini.</p>
            </motion.div>
          ) : (
            entries.map((entry) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="bg-bg-canvas border border-border-subtle p-3 rounded-2xl shadow-2xs flex flex-col gap-2"
              >
                <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2">
                  <span className="text-xs font-medium text-text-ink">{formatDate(entry.date)}</span>
                  <div className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                    entry.margin >= 0 ? "bg-delta-cheap/10 text-delta-cheap" : "bg-delta-expensive/10 text-delta-expensive"
                  }`}>
                    {entry.margin >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    Margin {entry.margin.toFixed(1)}%
                  </div>
                </div>
                
                <div className="flex justify-between items-end pt-1">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-muted">Modal ({entry.items} item)</span>
                    <span className="font-mono text-sm font-semibold text-text-ink">{formatCurrency(entry.totalCost)}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-text-muted">Target Omzet</span>
                    <span className="font-mono text-sm font-semibold text-accent-grain">{formatCurrency(entry.targetRevenue)}</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
