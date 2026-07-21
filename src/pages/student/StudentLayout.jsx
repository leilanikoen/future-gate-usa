import { useEffect, useState, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { LayoutGrid, Briefcase, MessageSquare, Settings as SettingsIcon, ExternalLink, Share2, Check } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getMyStudent, listItems, listFeedback, shareCountThisMonth, logShare } from "../../lib/db.js";
import { groupItems, completion } from "../../lib/constants.js";
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
  const [state, setState] = useState({ loading: true, student: null, items: [], feedback: [], shareCount: 0 });
  const [copied, setCopied] = useState(false);

  const reload = useCallback(async () => {
    const student = await getMyStudent(user.id);
    if (!student) { setState((s) => ({ ...s, loading: false, student: null })); return; }
    const [items, feedback, shareCount] = await Promise.all([
      listItems(student.id), listFeedback(student.id), shareCountThisMonth(student.id),
    ]);
    setState({ loading: false, student, items, feedback, shareCount });
  }, [user.id]);

  useEffect(() => { reload(); }, [reload]);

  if (state.loading) return <Spinner label="Loading your portfolio…" />;

  const { student, items, feedback, shareCount } = state;
  const grouped = groupItems(items);
  const pct = completion(grouped).pct;
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
      progress={{ value: pct, label: "Portfolio Progress" }}
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
      <Outlet context={{ student, profile, items, grouped, feedback, shareCount, pct, openCount, publicUrl, reload, share }} />
    </AppShell>
  );
}
