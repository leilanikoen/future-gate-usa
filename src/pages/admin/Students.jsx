import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Search, Plus, Pencil, Power } from "lucide-react";
import { assignMentor, approveStudent, setActive } from "../../lib/db.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Progress from "../../components/ui/Progress.jsx";
import Input from "../../components/ui/Input.jsx";
import CreateAccountForm from "./CreateAccountForm.jsx";
import { cn } from "../../lib/cn.js";

const statusTone = (s) => (s === "approved" ? "approved" : s === "pending" ? "pending" : "progress");
const statusText = (s) => (s === "approved" ? "Approved" : s === "pending" ? "Pending Review" : "In Progress");
const FILTERS = ["all", "pending", "in progress", "approved"];

export default function AdminStudents() {
  const { students, mentors, reload } = useOutletContext();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  const rows = students.filter((s) => {
    const okQ = s.name.toLowerCase().includes(q.toLowerCase());
    const okF = filter === "all"
      || (filter === "pending" && s.status === "pending")
      || (filter === "in progress" && s.status === "in_progress")
      || (filter === "approved" && s.status === "approved");
    return okQ && okF;
  });

  const onAssign = async (id, mentorId) => { await assignMentor(id, mentorId); await reload(); };
  const onApprove = async (id) => { await approveStudent(id); await reload(); };
  const onToggle = async (id, isActive) => { await setActive(id, !isActive); await reload(); };

  return (
    <div className="max-w-6xl">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted mt-1">Manage accounts, assign mentors, review portfolios, and approve submissions.</p>
        </div>
        <Button onClick={() => setShowCreate((v) => !v)}><Plus className="w-4 h-4" /> Add Student</Button>
      </div>

      {showCreate && <CreateAccountForm baseRole="student" onCreated={reload} />}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students…" className="pl-10" />
        </div>
        <div className="inline-flex bg-white border border-hairline rounded-xl p-1 overflow-x-auto">
          {FILTERS.map((t) => (
            <button key={t} onClick={() => setFilter(t)}
              className={cn("px-3.5 py-1.5 rounded-lg text-sm font-medium capitalize whitespace-nowrap",
                filter === t ? "bg-brand-600 text-white" : "text-muted hover:text-ink")}>{t}</button>
          ))}
        </div>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-hairline">
              <th className="py-3 px-5">Student</th><th className="px-3">Service</th><th className="px-3">Mentor</th>
              <th className="px-3">Completion</th><th className="px-3">Status</th><th className="px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className={cn("border-b border-slate-50 last:border-0", !s.is_active && "opacity-50")}>
                <td className="py-3 px-5">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} src={s.avatar_url} size="sm" />
                    <div><div className="font-semibold">{s.name}</div><div className="text-xs text-muted">Grade {s.grade || "—"}</div></div>
                  </div>
                </td>
                <td className="px-3 text-muted">{s.service}</td>
                <td className="px-3">
                  <select value={s.mentor_id || ""} onChange={(e) => onAssign(s.id, e.target.value || null)}
                    className="border border-hairline rounded-lg px-2 py-1.5 text-sm bg-white outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100">
                    <option value="">Unassigned</option>
                    {mentors.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </td>
                <td className="px-3"><div className="flex items-center gap-2 w-32"><Progress value={s.pct} /><span className="text-xs text-muted w-9">{s.pct}%</span></div></td>
                <td className="px-3"><Badge tone={statusTone(s.status)}>{statusText(s.status)}</Badge></td>
                <td className="px-3">
                  <div className="flex items-center gap-1.5 justify-end">
                    {s.status === "pending" && (
                      <button onClick={() => onApprove(s.id)} className="text-xs font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg px-2.5 py-1.5">Approve</button>
                    )}
                    <button onClick={() => nav(`/mentor/review/${s.id}`)} className="text-xs font-medium border border-hairline rounded-lg px-2.5 py-1.5 hover:bg-slate-50">View</button>
                    <button onClick={() => onToggle(s.id, s.is_active)} title={s.is_active ? "Deactivate" : "Activate"}
                      className={cn("w-7 h-7 grid place-items-center border rounded-lg hover:bg-slate-50",
                        s.is_active ? "border-hairline text-slate-400" : "border-emerald-200 text-emerald-600")}>
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-muted">No students match.</td></tr>}
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-muted mt-3">Deactivated accounts are greyed out and can’t sign in; toggle the power icon to restore access.</p>
    </div>
  );
}
