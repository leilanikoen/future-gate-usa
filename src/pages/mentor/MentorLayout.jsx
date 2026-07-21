import { useEffect, useState, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { LayoutGrid, Users, MessageSquare, Activity as ActivityIcon, Settings as SettingsIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { listMenteesFull, listFeedbackForStudents } from "../../lib/db.js";
import AppShell from "../../components/layout/AppShell.jsx";
import { Spinner } from "../../components/ui/Feedback.jsx";

const ROUTES = {
  dashboard: "/mentor", students: "/mentor/students", feedback: "/mentor/feedback",
  activity: "/mentor/activity", settings: "/mentor/settings",
};
const activeFromPath = (p) =>
  p.includes("/students") || p.includes("/review") ? "students"
  : p.includes("/feedback") ? "feedback"
  : p.includes("/activity") ? "activity"
  : p.includes("/settings") ? "settings"
  : "dashboard";

export default function MentorLayout() {
  const { user, profile, signOut } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [mentees, setMentees] = useState(null);
  const [openFeedback, setOpenFeedback] = useState(0);

  const reload = useCallback(async () => {
    const list = await listMenteesFull(user.id);
    setMentees(list);
    const threads = await listFeedbackForStudents(list.map((m) => m.id));
    setOpenFeedback(threads.filter((t) => !t.resolved).length);
  }, [user.id]);
  useEffect(() => { reload(); }, [reload]);

  const NAV = [
    { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { key: "students", label: "Assigned Students", icon: Users },
    { key: "feedback", label: "Feedback", icon: MessageSquare, badge: openFeedback || undefined },
    { key: "activity", label: "Activity", icon: ActivityIcon },
    { key: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <AppShell
      nav={NAV}
      active={activeFromPath(loc.pathname)}
      onNavigate={(k) => nav(ROUTES[k])}
      subtitle="Mentor workspace"
      user={{ name: profile?.full_name || profile?.email || "Mentor", subtitle: "Mentor", src: profile?.avatar_url }}
      onSignOut={signOut}
      search="Search students…"
    >
      {mentees === null ? <Spinner label="Loading your students…" />
        : <Outlet context={{ mentees, reload, mentorId: user.id }} />}
    </AppShell>
  );
}