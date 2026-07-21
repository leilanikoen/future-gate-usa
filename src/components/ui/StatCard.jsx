import { ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import Card from "./Card.jsx";
import { cn } from "../../lib/cn.js";

/**
 * Dashboard metric tile.
 * - label:   quiet uppercase caption
 * - value:   the big number/text
 * - trend:   { dir: "up"|"down", text: "12%" }  (optional)
 * - note:    small sublabel under the trend (optional)
 * The corner arrow is a link affordance to the detailed view.
 */
export default function StatCard({ label, value, trend, note, onOpen, className }) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        <button
          onClick={onOpen}
          className="grid place-items-center w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-ink transition-colors"
          aria-label={`Open ${label}`}
        >
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
      <div className="text-3xl font-bold tracking-tight mt-2">{value}</div>
      <div className="flex items-center gap-2 mt-3 min-h-[20px]">
        {trend && (
          <span className={cn(
            "inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-md",
            trend.dir === "down" ? "bg-rose-100 text-rose-600" : "bg-lime-100 text-lime-700"
          )}>
            {trend.dir === "down" ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
            {trend.text}
          </span>
        )}
        {note && <span className="text-xs text-muted">{note}</span>}
      </div>
    </Card>
  );
}
