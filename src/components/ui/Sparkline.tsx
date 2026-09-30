import { useState, useRef, useId } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TrendingUp, TrendingDown } from "lucide-react";

export type SparklinePoint = {
  date: string;
  price: number;
};

interface SparklineProps {
  data: SparklinePoint[];
  width?: number;
  height?: number;
}

export function Sparkline({ data, height = 64 }: SparklineProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gradientId = useId();

  if (!data || data.length < 2) {
    return (
      <div style={{ height }} className="w-full flex items-center justify-center text-xs text-text-muted">
        Data riwayat belum cukup
      </div>
    );
  }

  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;

  // ViewBox coordinates
  const svgWidth = 280;
  const svgHeight = height;
  const paddingY = 8;
  const usableHeight = svgHeight - paddingY * 2;

  // Map data to SVG points
  const points = data.map((d, index) => {
    const x = (index / (data.length - 1)) * svgWidth;
    const normalizedY = (d.price - minPrice) / range;
    const y = svgHeight - paddingY - normalizedY * usableHeight;
    return { x, y, ...d };
  });

  // Generate smooth SVG path
  const linePath = points.reduce((acc, curr, idx) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    const prev = points[idx - 1];
    const cX1 = prev.x + (curr.x - prev.x) / 2;
    const cY1 = prev.y;
    const cX2 = prev.x + (curr.x - prev.x) / 2;
    const cY2 = curr.y;
    return `${acc} C ${cX1} ${cY1}, ${cX2} ${cY2}, ${curr.x} ${curr.y}`;
  }, "");

  // Area path for gradient fill under the line
  const areaPath = `${linePath} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`;

  // Calculate 14-day trend
  const firstPrice = data[0].price;
  const lastPrice = data[data.length - 1].price;
  const priceDelta = lastPrice - firstPrice;
  const percentDelta = ((priceDelta / firstPrice) * 100).toFixed(1);
  const isUp = priceDelta > 0;

  // Magnetic Scrubber
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const ratio = relativeX / rect.width;
    const nearestIndex = Math.min(
      data.length - 1,
      Math.max(0, Math.round(ratio * (data.length - 1)))
    );
    setActiveIndex(nearestIndex);
  };

  const activePoint = activeIndex !== null ? points[activeIndex] : null;

  const formatDate = (isoStr: string) => {
    try {
      const parts = isoStr.split("-");
      if (parts.length === 3) {
        const d = parseInt(parts[2], 10);
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        const m = months[parseInt(parts[1], 10) - 1];
        return `${d} ${m}`;
      }
    } catch {
      // fallback
    }
    return isoStr;
  };

  const formatIDR = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);

  return (
    <div className="w-full select-none">
      {/* Sparkline Header / Scrubber Tooltip with CLS = 0 */}
      <div className="flex items-center justify-between text-xs mb-2 h-6">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
            Riwayat 14 Hari
          </span>
          <span
            className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
              isUp
                ? "bg-delta-expensive/10 text-delta-expensive"
                : "bg-delta-cheap/10 text-delta-cheap"
            }`}
          >
            {isUp ? (
              <TrendingUp className="w-2.5 h-2.5 stroke-[2.5]" />
            ) : (
              <TrendingDown className="w-2.5 h-2.5 stroke-[2.5]" />
            )}
            {isUp ? `+${percentDelta}%` : `${percentDelta}%`}
          </span>
        </div>

        {/* Magnetic Value Indicator */}
        <div className="h-6 flex items-center">
          <AnimatePresence mode="wait">
            {activePoint ? (
              <motion.div
                key={activePoint.date}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.12 }}
                className="flex items-center gap-1.5 font-mono text-[11px]"
              >
                <span className="text-text-muted">{formatDate(activePoint.date)}:</span>
                <span className="font-semibold text-text-ink bg-bg-canvas px-1.5 py-0.5 rounded border border-border-subtle shadow-2xs">
                  {formatIDR(activePoint.price)}
                </span>
              </motion.div>
            ) : (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[11px] text-text-muted italic"
              >
                Geser untuk telusuri
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* SVG Canvas Container with fixed aspect ratio */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setActiveIndex(null)}
        onPointerDown={handlePointerMove}
        style={{ height }}
        className="relative w-full overflow-hidden cursor-crosshair touch-none rounded-xl bg-bg-canvas/40 border border-border-subtle/50"
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent-grain, #c2883e)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--color-accent-grain, #c2883e)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Fill Area */}
          <path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Stroke Line */}
          <path
            d={linePath}
            fill="none"
            stroke="var(--color-accent-grain, #c2883e)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Magnetic Scrubber Elements */}
          {activePoint && (
            <>
              {/* Vertical Guide Line */}
              <line
                x1={activePoint.x}
                y1={paddingY}
                x2={activePoint.x}
                y2={svgHeight - paddingY}
                stroke="var(--color-text-muted, #827c73)"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.6"
              />

              {/* Glowing Outer Dot */}
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="5"
                fill="var(--color-accent-grain, #c2883e)"
                opacity="0.3"
              />

              {/* Solid Center Dot */}
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="3"
                fill="var(--color-surface-panel, #ffffff)"
                stroke="var(--color-accent-grain, #c2883e)"
                strokeWidth="2"
              />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
