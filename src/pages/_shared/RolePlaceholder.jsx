import {
  LayoutGrid, Briefcase, MessageSquare, Settings, Users, Shield, Activity as ActivityIcon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import AppShell from "../../components/layout/AppShell.jsx";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";

const NAVS = {
  student: {
    subtitle: "Student",
    phase: 5,
    nav: [
      { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
      { key: "portfolio", label: "Portfolio Builder", icon: Briefcase },
      { key: "feedback", label: "Feedback", icon: MessageSquare },
      { key: "settings", label: "Settings", icon: Settings },
    ],
  },
  mentor: {
    subtitle: "Mentor workspace",
    phase: 6,
    nav: [
      { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
      { key: "students", label: "Assigned Students", icon: Users },
      { key: "feedback", label: "Feedback", icon: MessageSquare },
      { key: "activity", label: "Activity", icon: ActivityIcon },
      { key: "settings", label: "Settings", icon: Settings },
    ],
  },
  admin: {
    subtitle: "Admin portal",
    phase: 7,
    nav: [
      { key: "overview", label: "Overview", icon: LayoutGrid },
      { key: "students", label: "Students", icon: Users },
      { key: "mentors", label: "Mentors & Guardians", icon: Shield },
      { key: "activity", label: "Activity", icon: ActivityIcon },
    ],
  },
};

export default function RolePlaceholder({ area }) {
  const { profile, signOut } = useAuth();
  const cfg = NAVS[area];
  const roleLabel = profile?.role === "super_admin" ? "Super admin" : cfg.subtitle;

  return (
    <AppShell
      nav={cfg.nav}
      active={cfg.nav[0].key}
      subtitle={roleLabel}
      user={{ name: profile?.full_name || profile?.email || "You", subtitle: roleLabel }}
      onSignOut={signOut}
    >
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 mb-4">
          <Badge tone="progress">Signed in</Badge>
          <span className="text-sm text-muted">Authentication, roles &amp; onboarding are working.</span>
        </div>
        <Card className="p-8">
          <h1 className="text-2xl font-bold tracking-tight">
            {area === "admin" ? "Admin" : area === "mentor" ? "Mentor" : "Student"} workspace
          </h1>
          <p className="text-muted mt-2">
            You’re signed in as <b className="text-ink">{roleLabel}</b> and landed in the right place, so login,
            role routing, and the guards are all live. The screens for this area are built in
            <b className="text-ink"> Phase {cfg.phase}</b>.
          </p>
          <p className="text-sm text-muted mt-4">
            Try the sidebar (or the menu button on a phone), and sign out from the bottom of the rail.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
