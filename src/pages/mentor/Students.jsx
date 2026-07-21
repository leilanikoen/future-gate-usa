import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { timeAgo } from "../../lib/constants.js";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import Progress from "../../components/ui/Progress.jsx";
import Input from "../../components/ui/Input.jsx";
import { cn } from "../../lib/cn.js";

const statusTone = (s) => (s === "approved" ? "approved" : s === "pending" ? "pending" : "progress");
const statusText = (s) => (s === "approved" ? "Approved" : s === "pending" ? "Pending" : "In Progress");
const FILTERS = ["all", "pending", "in progress", "approved"];

export default function MentorStudents() {
  const { mentees } = useOutletContext();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const assigned = mentees.length;
  const pending = mentees.filter((m) => m.status === "pending").length;
  const avg = assigned ? Math.round(mentees.reduce((s, m) => s + m.pct, 0) / assigned) : 0;
  const approved = mentees.filter((m) => m.status === "approved").length;

  const rows = mentees.filter((m) => {
    const okQ = m.name.toLowerCase().includes(q.toLowerCase());
    const okF = filter === "all"
      || (filter === "pending" && m.status === "pending")
      || (filter === "in progress" && m.status === "in_progress")
      || (filter === "approved" && m.status === "approved");
    return okQ && okF;
  });

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold tracking-tight">Assigned Students</h1>
      <p className="text-muted mt-1 mb-6">Manage your assigned students, review portfolios, and track their progress.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Assigned Students" value={String(assigned).padStart(2, "0")} note="students assigned to you" />
        <StatCard label="Pending Reviews" value={String(pending).padStart(2, "0")} note="awaiting your feedback" />
        <StatCard label="Average Completion" value={`${avg}%`} note="across portfolios" />
        <StatCard label="Approved Portfolios" value={String(approved).padStart(2, "0")} note="ready for submission" />
      </div>

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students…" className="pl-10" />
          </div>
          <div className="inline-flex bg-white border border-hairline rounded-xl p-1 overflow-x-auto">
            {FILTERS.map((t) => (
              <button key={t} onClick={() => setFilter(t)}
                className={cn("px-3.5 py-1.5 rounded-lg text-sm font-medium capitalize whitespace-nowrap",
                  filter === t ? "bg-brand-600 text-white" : "text-muted hover:text-ink")}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-hairline">
                <th className="py-3 px-2">Student</th><th className="px-2">Grade</th><th className="px-2">Progress</th>
                <th className="px-2">Updated</th><th className="px-2">Status</th><th className="px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.name} src={m.avatar_url} size="sm" />
                      <span className="font-semibold">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-2 text-muted">{m.grade || "—"}</td>
                  <td className="px-2"><div className="flex items-center gap-2 w-36"><Progress value={m.pct} /><span className="text-xs text-muted w-9">{m.pct}%</span></div></td>
                  <td className="px-2 text-muted">{timeAgo(m.updated_at)}</td>
                  <td className="px-2"><Badge tone={statusTone(m.status)}>{statusText(m.status)}</Badge></td>
                  <td className="px-2 text-right">
                    <button onClick={() => nav(`/mentor/review/${m.id}`)} className="text-sm font-semibold text-lime-600 hover:underline">View Portfolio</button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-muted">No students match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
