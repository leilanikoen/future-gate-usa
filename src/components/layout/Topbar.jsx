import { Search, Menu } from "lucide-react";
import { cn } from "../../lib/cn.js";

/**
 * Top bar: hamburger (mobile only) + optional search + right-aligned actions.
 */
export default function Topbar({ search, actions, onMenu, className }) {
  return (
    <header className={cn("flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-4", className)}>
      <button
        className="md:hidden grid place-items-center w-10 h-10 rounded-xl border border-hairline bg-white text-ink shrink-0"
        onClick={onMenu}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {search ? (
        <div className="relative flex-1 min-w-0 max-w-lg">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            placeholder={search}
            className="w-full bg-white border border-hairline rounded-xl pl-10 pr-3 py-2.5 text-sm
                       placeholder:text-slate-400 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          />
        </div>
      ) : (
        <div className="flex-1" />
      )}
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
