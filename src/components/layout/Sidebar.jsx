import { LogOut, X } from "lucide-react";
import Logo from "../ui/Logo.jsx";
import Avatar from "../ui/Avatar.jsx";
import Progress from "../ui/Progress.jsx";
import { cn } from "../../lib/cn.js";

/**
 * Left navigation rail.
 * Desktop (md+): a static column in the flow.
 * Mobile/tablet (< md): a fixed slide-in drawer with a dimmed backdrop.
 * Selecting an item both navigates and closes the drawer.
 */
export default function Sidebar({
  nav, active, onNavigate, progress, user, subtitle, onSignOut, open, onClose,
}) {
  return (
    <>
      <div
        className={cn("fixed inset-0 bg-black/30 z-30 md:hidden transition-opacity",
          open ? "opacity-100" : "opacity-0 pointer-events-none")}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed z-40 inset-y-0 left-0 w-64 bg-surface border-r border-hairline p-4 flex flex-col",
          "transition-transform duration-200 ease-out",
          "md:static md:z-auto md:shrink-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-start justify-between px-2 py-1 mb-5">
          <div>
            <Logo />
            {subtitle && <div className="text-xs text-slate-400 mt-1.5 ml-11">{subtitle}</div>}
          </div>
          <button className="md:hidden text-slate-400 hover:text-ink" onClick={onClose} aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto">
          {nav.map((item) => {
            const isActive = item.key === active;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => { onNavigate?.(item.key); onClose?.(); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive ? "bg-brand-600 text-white shadow-sm" : "text-muted hover:bg-slate-100 hover:text-ink"
                )}
              >
                {Icon && <Icon className="w-[18px] h-[18px]" />}
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge != null && (
                  <span className={cn(
                    "text-[11px] font-semibold min-w-5 h-5 px-1.5 grid place-items-center rounded-full",
                    isActive ? "bg-white/25 text-white" : "bg-amber-400 text-white"
                  )}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {progress && (
          <div className="rounded-xl border border-hairline p-4 mb-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">{progress.label}</span>
              <span className="font-semibold text-brand-600">{progress.value}%</span>
            </div>
            <Progress value={progress.value} />
            {progress.onClick && (
              <button onClick={() => { progress.onClick(); onClose?.(); }}
                className="text-xs font-medium text-brand-600 mt-3 hover:underline">
                Finish your portfolio →
              </button>
            )}
          </div>
        )}

        {user && (
          <div className="flex items-center gap-3 px-1 pt-3 border-t border-hairline">
            <Avatar name={user.name} src={user.src} size="sm" />
            <div className="flex-1 leading-tight min-w-0">
              <div className="text-sm font-semibold truncate">{user.name}</div>
              <div className="text-xs text-slate-400 truncate">{user.subtitle}</div>
            </div>
            <button onClick={onSignOut} className="text-slate-400 hover:text-ink" aria-label="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}