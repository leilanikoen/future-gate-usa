import { cn } from "../../lib/cn.js";

const SIZES = { sm: "w-8 h-8 text-[11px]", md: "w-10 h-10 text-sm", lg: "w-16 h-16 text-xl rounded-2xl" };

function initials(name = "") {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
}

export default function Avatar({ name, src, size = "md", className }) {
  const base = cn("shrink-0 overflow-hidden font-semibold text-white grid place-items-center",
    size === "lg" ? "rounded-2xl" : "rounded-full", SIZES[size], className);
  if (src) return <img src={src} alt={name} className={cn(base, "object-cover")} />;
  return <div className={cn(base, "bg-gradient-to-br from-brand-500 to-brand-700")}>{initials(name)}</div>;
}
