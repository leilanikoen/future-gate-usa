import { useEffect, useState, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { LayoutGrid, Users, Shield, Activity as ActivityIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { listAllStudents, listAllMentors, listStaff } from "../../lib/db.js";
import AppShell from "../../components/layout/AppShell.jsx";
import Button from "../../components/ui/Button.jsx";
import { Spinner } from "../../components/ui/Feedback.jsx";

const ROUTES = { overview: "/admin", students: "/admin/students", mentors: "/admin/mentors", activity: "/admin/activity" };
const activeFromPath = (p) =>
  p.includes("/students") ? "students" : p.includes("/mentors") ? "mentors" : p.includes("/activity") ? "activity" : "overview";

export default function AdminLayout() {
  const { profile, role, signOut } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [data, setData] = useState(null);

  const reload = useCallback(async () => {
    const [students, mentors, staff] = await Promise.all([listAllStudents(), listAllMentors(), listStaff()]);
    setData({ students, mentors, staff });
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const isSuper = role === "super_admin";
  const NAV = [
    { key: "overview", label: "Overview", icon: LayoutGrid },
    { key: "students", label: "Students", icon: Users },
    { key: "mentors", label: "Mentors & Guardians", icon: Shield },
    { key: "activity", label: "Activity", icon: ActivityIcon },
  ];

  return (
    <AppShell
      nav={NAV}
      active={activeFromPath(loc.pathname)}
      onNavigate={(k) => nav(ROUTES[k])}
      subtitle={isSuper ? "Super admin" : "Admin portal"}
      user={{ name: profile?.full_name || profile?.email || "Admin", subtitle: isSuper ? "Super admin" : "Administrator", src: profile?.avatar_url }}
      onSignOut={signOut}
      topbarActions={<>
        <span className="hidden sm:block text-sm text-muted mr-1">Admissions cycle <b className="text-ink">2026</b></span>
        <Button variant="ghost">Export report</Button>
      </>}
    >
      {data === null ? <Spinner label="Loading the admin console…" />
        : <Outlet context={{ ...data, reload, isSuper }} />}
    </AppShell>
  );
}
