import { useEffect, useState, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { LayoutGrid, Briefcase, MessageSquare, Settings as SettingsIcon, ExternalLink, Share2, Check } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getMyStudent, listFeedback, shareCountThisMonth, logShare, listModules, listEntryStubs } from "../../lib/db.js";
import { portfolioProgress } from "../../lib/portfolioHome.js";
import AppShell from "../../components/layout/AppShell.jsx";
import Button from "../../components/ui/Button.jsx";
import { Spinner } from "../../components/ui/Feedback.jsx";

const ROUTES = { dashboard: "/app", portfolio: "/app/portfolio", feedback: "/app/feedback", settings: "/app/settings" };
const activeFromPath = (p) =>
  p.endsWith("/portfolio") ? "portfolio" : p.endsWith("/feedback") ? "feedback" : p.endsWith("/settings") ? "settings" : "dashboard";

export default function StudentLayout() {
  const { user, profile, signOut } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [state, setState] = useState({ loading: true, student: null, feedback: [], shareCount: 0, modules: [], entryStubs: [] });
  const [copied, setCopied] = useState(false);

  const reload = useCallback(async () => {
    const student = await getMyStudent(user.id);
    if (!student) { setState((s) => ({ ...s, loading: false, student: null })); return; }
    const [feedback, shareCount, modules, entryStubs] = await Promise.all([
      listFeedback(student.id), shareCountThisMonth(student.id),
      listModules(student.id), listEntryStubs(student.id),
    ]);
    setState({ loading: false, student, feedback, shareCount, modules, entryStubs });
  }, [user.id]);

  useEffect(() => { reload(); }, [reload]);

  if (state.loading) return <Spinner label="Loading your portfolio…" />;

  const { student, feedback, shareCount, modules, entryStubs } = state;
  const pct = portfolioProgress(modules, entryStubs);
  const openCount = feedback.filter((f) => !f.resolved).length;
  const publicUrl = `${window.location.origin}/student/${student?.slug || ""}`;

  const share = async () => {
    try { await navigator.clipboard?.writeText(publicUrl); } catch { /* clipboard may be blocked */ }
    await logShare(student.id, user.id);
    setCopied(true); setTimeout(() => setCopied(false), 1600);
    reload();
  };

  const NAV = [
    { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { key: "portfolio", label: "Portfolio Builder", icon: Briefcase },
    { key: "feedback", label: "Feedback", icon: MessageSquare, badge: openCount || undefined },
    { key: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <AppShell
      nav={NAV}
      active={activeFromPath(loc.pathname)}
      onNavigate={(k) => nav(ROUTES[k])}
      subtitle="Student"
      progress={{ value: pct, label: "Portfolio Progress", onClick: () => nav("/app/portfolio") }}
      user={{ name: profile?.full_name || profile?.email || "Student", subtitle: student?.grade ? `Grade ${student.grade}` : "Student", src: profile?.avatar_url }}
      onSignOut={signOut}
      search="Search your portfolio…"
      topbarActions={
        <>
          <a href={publicUrl} target="_blank" rel="noreferrer" className="hidden sm:inline-flex">
            <Button variant="ghost"><ExternalLink className="w-4 h-4" /> View public page</Button>
          </a>
          <Button variant="primary" onClick={share}>
            {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Share2 className="w-4 h-4" /> Share</>}
          </Button>
        </>
      }
    >
      <Outlet context={{ student, profile, feedback, shareCount, modules, entryStubs, pct, openCount, publicUrl, reload, share }} />
    </AppShell>
  );
}