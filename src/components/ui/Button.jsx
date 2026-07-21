import { cn } from "../../lib/cn.js";

const VARIANTS = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  ghost:   "bg-white text-ink border border-hairline hover:bg-slate-50",
  subtle:  "bg-brand-50 text-brand-700 hover:bg-brand-100",
  danger:  "bg-white text-rose-600 border border-rose-200 hover:bg-rose-50",
};
const SIZES = {
  sm: "text-xs px-3 py-2 rounded-lg gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-xl gap-2",
  lg: "text-sm px-5 py-3 rounded-xl gap-2",
};

export default function Button({ variant = "primary", size = "md", className, children, ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-colors",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        VARIANTS[variant], SIZES[size], className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
