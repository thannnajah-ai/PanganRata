import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, ChevronDown, Crosshair, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

const CITIES = [
  { id: "jkt", name: "DKI Jakarta", lat: -6.2088, lng: 106.8456 },
  { id: "bdg", name: "Kota Bandung", lat: -6.9175, lng: 107.6191 },
  { id: "sby", name: "Kota Surabaya", lat: -7.2575, lng: 112.7521 },
  { id: "smg", name: "Kota Semarang", lat: -6.9667, lng: 110.4167 },
  { id: "mdn", name: "Kota Medan", lat: 3.5952, lng: 98.6722 },
  { id: "ygk", name: "Kota Yogyakarta", lat: -7.7956, lng: 110.3695 },
  { id: "mks", name: "Kota Makassar", lat: -5.1477, lng: 119.4327 },
  { id: "dps", name: "Kota Denpasar", lat: -8.6705, lng: 115.2126 },
];

function getClosestCity(lat: number, lng: number) {
  let closest = CITIES[0];
  let minDistance = Infinity;
  for (const city of CITIES) {
    const d = Math.hypot(city.lat - lat, city.lng - lng);
    if (d < minDistance) {
      minDistance = d;
      closest = city;
    }
  }
  return closest;
}

interface LocationPickerProps {
  selectedCity?: string;
  onSelectCity?: (city: string) => void;
}

export function LocationPicker({ selectedCity: propCity, onSelectCity }: LocationPickerProps) {
  const [internalCity, setInternalCity] = useState(() => {
    return localStorage.getItem("panganrata_city") || "DKI Jakarta";
  });

  const selectedCity = propCity ?? internalCity;
  const [isOpen, setIsOpen] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const selectCity = (name: string) => {
    if (onSelectCity) {
      onSelectCity(name);
    } else {
      setInternalCity(name);
      localStorage.setItem("panganrata_city", name);
    }
    setIsOpen(false);
    toast.success(`Wilayah diubah ke: ${name}`);
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Browser Anda tidak mendukung deteksi lokasi");
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const closest = getClosestCity(latitude, longitude);
        selectCity(closest.name);
        setDetecting(false);
      },
      (err) => {
        setDetecting(false);
        console.warn("GPS error:", err);
        toast.error("Akses lokasi ditolak. Silakan pilih kota manual.");
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="relative inline-block text-left">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-bg-canvas hover:bg-surface-panel border border-border-subtle hover:border-text-ink/20 px-2.5 py-1.5 rounded-xl text-xs font-medium text-text-ink transition-all shadow-2xs cursor-pointer"
        aria-label="Pilih Wilayah"
      >
        <MapPin className="w-3.5 h-3.5 text-accent-grain shrink-0" />
        <span className="font-semibold">{selectedCity}</span>
        <ChevronDown className={`w-3 h-3 text-text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </motion.button>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-text-ink/10 backdrop-blur-[1px]"
        />
      )}

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className="absolute right-0 sm:left-0 mt-2 w-64 bg-surface-panel border border-border-subtle rounded-2xl shadow-xl p-3 z-50"
          >
            {/* GPS Detection Button */}
            <button
              onClick={handleDetectGPS}
              disabled={detecting}
              className="w-full flex items-center justify-between p-2.5 bg-bg-canvas hover:bg-accent-grain/10 border border-border-subtle hover:border-accent-grain/30 rounded-xl text-xs font-semibold text-text-ink transition-colors cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                {detecting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-grain" />
                ) : (
                  <Crosshair className="w-3.5 h-3.5 text-accent-grain" />
                )}
                <span>{detecting ? "Mencari GPS..." : "Deteksi Lokasi Saya"}</span>
              </div>
              <span className="text-[10px] text-text-muted font-normal">GPS</span>
            </button>

            <div className="h-px bg-border-subtle/80 my-2.5" />

            {/* City Selection List */}
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider px-2 mb-1.5">
              Pilih Kota Manual
            </p>
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {CITIES.map((city) => {
                const isSelected = city.name === selectedCity;
                return (
                  <button
                    key={city.id}
                    onClick={() => selectCity(city.name)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-text-ink text-surface-panel font-semibold shadow-xs"
                        : "text-text-ink hover:bg-bg-canvas"
                    }`}
                  >
                    <span>{city.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
