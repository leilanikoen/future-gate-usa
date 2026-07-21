import { cn } from "../../lib/cn.js";

export function Field({ label, children }) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-ink mb-1.5">{label}</span>}
      {children}
    </label>
  );
}

export default function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "w-full bg-white border border-hairline rounded-xl px-3.5 py-2.5 text-sm",
        "placeholder:text-slate-400 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100",
        className
      )}
      {...props}
    />
  );
}
