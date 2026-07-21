import { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

/**
 * The frame every signed-in screen sits inside: responsive rail + top bar +
 * scrolling content. The rail collapses into a drawer below the md breakpoint.
 */
export default function AppShell({
  nav, active, onNavigate, progress, user, subtitle, onSignOut,
  search, topbarActions, children,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen flex bg-canvas text-ink">
      <Sidebar
        nav={nav} active={active} onNavigate={onNavigate}
        progress={progress} user={user} subtitle={subtitle} onSignOut={onSignOut}
        open={menuOpen} onClose={() => setMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar search={search} actions={topbarActions} onMenu={() => setMenuOpen(true)} />
        <main className="flex-1 px-4 sm:px-6 pb-10 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
