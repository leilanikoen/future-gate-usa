export function Spinner({ label = "Loading…" }) {
  return (
    <div className="min-h-[60vh] grid place-items-center">
      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="w-4 h-4 border-2 border-slate-300 border-t-brand-500 rounded-full animate-spin" />
        {label}
      </div>
    </div>
  );
}

export function EmptyState({ title, hint, action }) {
  return (
    <div className="border border-dashed border-hairline rounded-2xl p-10 text-center">
      <div className="font-semibold">{title}</div>
      {hint && <div className="text-sm text-muted mt-1">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
