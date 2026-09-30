import { motion, HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

export interface TacticalButtonProps extends HTMLMotionProps<"button"> {
  label: string;
}

export function TacticalButton({ label, onClick, className, ...props }: TacticalButtonProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 450, damping: 30, mass: 0.8 }}
      onClick={onClick}
      className={cn(
        "bg-surface-panel border border-border-subtle text-text-ink px-5 py-2.5 rounded-lg shadow-sm font-sans font-medium text-sm hover:shadow-md transition-shadow cursor-pointer select-none",
        className
      )}
      {...props}
    >
      {label}
    </motion.button>
  );
}
