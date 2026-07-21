import { cn } from "../../lib/cn.js";

// Status vocabulary is shared across roles so a status always looks the same.
const TONES = {
  complete:   "bg-lime-100 text-lime-700",
  approved:   "bg-emerald-100 text-emerald-700",
  pending:    "bg-amber-100 text-amber-700",
  review:     "bg-orange-100 text-orange-700",
  progress:   "bg-brand-100 text-brand-700",
  neutral:    "bg-slate-100 text-slate-600",
};

export default function Badge({ tone = "neutral", className, children }) {
  return (
    <span className={cn("inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full",
      TONES[tone], className)}>
      {children}
    </span>
  );
}
