import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Check, Copy, ExternalLink, ArrowRight } from "lucide-react";
import { SECTIONS, SECTION_UNIT, completion, completionAsOf, timeAgo } from "../../lib/constants.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import StatCard from "../../components/ui/StatCard.jsx";

export default function Dashboard() {
  const { student, profile, items, grouped, feedback, shareCount, publicUrl, share } = useOutletContext();
  const nav = useNavigate();
  const [copied, setCopied] = useState(false);

  const { done, total, pct } = completion(grouped);
  const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
  const prevPct = completionAsOf(items, monthAgo);
  const delta = pct - prevPct;
  const open = feedback.filter((f) => !f.resolved);
  const recent = feedback.slice(0, 2);
  const first = (profile?.full_name || "there").split(" ")[0];

  const copy = async () => { await share(); setCopied(true); setTimeout(() => setCopied(false), 1600); };

  return (
    <div className="max-w-6xl">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {first} 👋</h1>
          <p className="text-muted mt-1">Applying for {student?.term || "Fall 2026"} · your portfolio is {pct}% complete.</p>
        </div>
        <Button onClick={() => nav("/app/portfolio")}><ArrowRight className="w-4 h-4" /> Add to portfolio</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Completion" value={`${pct}%`}
          trend={delta !== 0 ? { dir: delta > 0 ? "up" : "down", text: `${Math.abs(delta)}%` } : undefined}
          note="vs last month" onOpen={() => nav("/app/portfolio")} />
        <StatCard label="Sections Done" value={`${done}/${total}`} note={`${total - done} remaining`}
          onOpen={() => nav("/app/portfolio")} />
        <StatCard label="Schools Shared" value={String(shareCount).padStart(2, "0")} note="this month"
          onOpen={share} />
        <StatCard label="Open Feedback" value={String(open.length).padStart(2, "0")} note="needs attention"
          onOpen={() => nav("/app/feedback")} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold">Application progress</h2>
            <Button variant="ghost" size="sm" onClick={() => nav("/app/portfolio")}>Manage →</Button>
          </div>
          <p className="text-sm text-muted mb-4">Track your portfolio completion across all required sections.</p>
          <div className="space-y-2.5">
            {SECTIONS.map((s) => {
              const count = grouped[s.key].length;
              const isDone = count > 0;
              return (
                <div key={s.key} className="flex items-center gap-3 p-3.5 rounded-xl border border-hairline">
                  <span className={isDone
                    ? "grid place-items-center w-8 h-8 rounded-full bg-lime-100 text-lime-600"
                    : "grid place-items-center w-8 h-8 rounded-full bg-slate-100 text-slate-300"}>
                    {isDone ? <Check className="w-4 h-4" /> : <span className="w-2 h-2 rounded-full border-2 border-current" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{s.label}</div>
                    <div className="text-xs text-muted">{count} {SECTION_UNIT[s.key]}</div>
                  </div>
                  <Badge tone={isDone ? "complete" : "pending"}>{isDone ? "Complete" : "To do"}</Badge>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5 bg-brand-50 border-brand-100">
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-500 mb-3">Your public portfolio</div>
            <p className="text-sm text-muted mb-3">Share this link with schools and admissions officers.</p>
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 text-sm text-muted mb-3">
              <span className="truncate flex-1">{publicUrl.replace(/^https?:\/\//, "")}</span>
              <a href={publicUrl} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4 text-slate-400 hover:text-brand-600" /></a>
            </div>
            <Button className="w-full" onClick={copy}>
              {copied ? <><Check className="w-4 h-4" /> Link copied</> : <><Copy className="w-4 h-4" /> Copy link to share</>}
            </Button>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Recent feedback</h3>
              <Button variant="ghost" size="sm" onClick={() => nav("/app/feedback")}>All</Button>
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-muted">No feedback yet. Share your portfolio with a mentor to get started.</p>
            ) : (
              <div className="space-y-4">
                {recent.map((f) => (
                  <div key={f.id} className="flex gap-3">
                    <Avatar name={f.author} size="sm" />
                    <div className="min-w-0">
                      <div className="text-sm"><b>{f.author}</b> <span className="text-slate-400">· {timeAgo(f.created_at)}</span></div>
                      <p className="text-sm text-muted line-clamp-2">{f.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
