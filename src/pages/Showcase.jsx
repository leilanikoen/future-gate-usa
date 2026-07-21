import { useState } from "react";
import {
  LayoutGrid, Briefcase, MessageSquare, Settings, ExternalLink, Share2, Check, Plus,
} from "lucide-react";
import AppShell from "../components/layout/AppShell.jsx";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import Progress from "../components/ui/Progress.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import Input, { Field } from "../components/ui/Input.jsx";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { key: "portfolio", label: "Portfolio Builder", icon: Briefcase },
  { key: "feedback", label: "Feedback", icon: MessageSquare, badge: 2 },
  { key: "settings", label: "Settings", icon: Settings },
];

const SECTIONS = [
  { name: "Academics", note: "2 documents", done: true },
  { name: "Extracurricular Activities", note: "2 activities", done: true },
  { name: "Leadership", note: "1 experience", done: true },
  { name: "Awards & Honors", note: "3 awards", done: true },
  { name: "Essays", note: "0 items", done: false },
  { name: "Recommendations", note: "0 items", done: false },
];

function Section({ title, children }) {
  return (
    <section className="mt-8">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">{title}</h2>
      {children}
    </section>
  );
}

export default function Showcase() {
  const [active, setActive] = useState("dashboard");

  return (
    <AppShell
      nav={NAV}
      active={active}
      onNavigate={setActive}
      subtitle="Design system"
      progress={{ value: 71, label: "Portfolio Progress" }}
      user={{ name: "John Smith", subtitle: "Grade 9" }}
      search="Search your portfolio..."
      topbarActions={
        <>
          <Button variant="ghost" className="hidden sm:inline-flex">
            <ExternalLink className="w-4 h-4" /> View public page
          </Button>
          <Button variant="primary"><Share2 className="w-4 h-4" /> Share</Button>
        </>
      }
    >
      <div className="max-w-6xl">
        {/* phase note */}
        <div className="flex items-center gap-2 text-xs font-medium text-brand-700 bg-brand-50 border border-brand-100 rounded-full px-3 py-1.5 w-fit mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
          Phase 1 — design system &amp; shell preview
        </div>

        <h1 className="text-3xl font-bold tracking-tight">Welcome back, John 👋</h1>
        <p className="text-muted mt-1">Applying for Fall 2026 · your portfolio is 71% complete.</p>

        {/* stat tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <StatCard label="Completion" value="71%" trend={{ dir: "up", text: "12%" }} note="vs last month" />
          <StatCard label="Sections Done" value="5/7" trend={{ dir: "up", text: "6.3%" }} note="2 remaining" />
          <StatCard label="Schools Shared" value="02" trend={{ dir: "up", text: "2" }} note="this month" />
          <StatCard label="Open Feedback" value="03" note="needs attention" />
        </div>

        {/* progress checklist */}
        <Card className="p-6 mt-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold">Application progress</h2>
            <Button variant="ghost" size="sm">Manage →</Button>
          </div>
          <p className="text-sm text-muted mb-4">Track your portfolio completion across all required sections.</p>
          <div className="space-y-2.5">
            {SECTIONS.map((s) => (
              <div key={s.name} className="flex items-center gap-3 p-3.5 rounded-xl border border-hairline">
                <span className={s.done
                  ? "grid place-items-center w-8 h-8 rounded-full bg-lime-100 text-lime-600"
                  : "grid place-items-center w-8 h-8 rounded-full bg-slate-100 text-slate-300"}>
                  {s.done ? <Check className="w-4 h-4" /> : <span className="w-2 h-2 rounded-full border-2 border-current" />}
                </span>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{s.name}</div>
                  <div className="text-xs text-muted">{s.note}</div>
                </div>
                <Badge tone={s.done ? "complete" : "pending"}>{s.done ? "Complete" : "To do"}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* component gallery */}
        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary"><Plus className="w-4 h-4" /> Primary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="subtle">Subtle</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="lg">Large</Button>
          </div>
        </Section>

        <Section title="Status badges">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="complete">Complete</Badge>
            <Badge tone="approved">Approved</Badge>
            <Badge tone="pending">Pending review</Badge>
            <Badge tone="review">Needs review</Badge>
            <Badge tone="progress">In progress</Badge>
            <Badge tone="neutral">Unassigned</Badge>
          </div>
        </Section>

        <Section title="Avatars & progress">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Avatar name="John Smith" size="sm" />
              <Avatar name="Maria Rivera" size="md" />
              <Avatar name="Seo-yeon Lee" size="lg" />
            </div>
            <div className="w-64"><Progress value={71} /></div>
          </div>
        </Section>

        <Section title="Form fields">
          <Card className="p-6 max-w-xl">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="First name"><Input placeholder="Enter first name" /></Field>
              <Field label="Last name"><Input placeholder="Enter last name" /></Field>
            </div>
            <div className="mt-4">
              <Field label="Email address"><Input type="email" placeholder="you@example.com" /></Field>
            </div>
            <div className="flex justify-end mt-5">
              <Button variant="primary">Save &amp; continue</Button>
            </div>
          </Card>
        </Section>

        <p className="text-xs text-muted mt-10">
          These are the shared building blocks. Every screen in later phases is assembled from them,
          so the whole product stays visually consistent.
        </p>
      </div>
    </AppShell>
  );
}
