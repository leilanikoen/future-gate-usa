import { cn } from "../../lib/cn.js";

export default function Progress({ value = 0, className }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-1.5 w-full rounded-full bg-slate-200 overflow-hidden", className)}>
      <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600"
           style={{ width: `${pct}%` }} />
    </div>
  );
}
