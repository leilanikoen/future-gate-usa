import { useOutletContext } from "react-router-dom";
import { Power } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { setActive } from "../../lib/db.js";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import CreateAccountForm from "./CreateAccountForm.jsx";
import { cn } from "../../lib/cn.js";

export default function AdminMentors() {
  const { mentors, staff, reload, isSuper } = useOutletContext();
  const { user } = useAuth();
  const toggle = async (id, isActive) => { await setActive(id, !isActive); await reload(); };

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold tracking-tight">Mentors &amp; Guardians</h1>
      <p className="text-muted mt-1 mb-5">Manage the mentors and teachers who guide your students. Assign students from the Students page.</p>

      <CreateAccountForm baseRole="mentor" allowAdmin={isSuper} onCreated={reload} />

      {mentors.length === 0 ? (
        <Card className="p-8 text-center text-muted">No mentors yet — create one above.</Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {mentors.map((m) => (
            <Card key={m.id} className={cn("p-5", !m.is_active && "opacity-60")}>
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={m.name} src={m.avatar_url} size="md" />
                <div className="min-w-0">
                  <div className="font-bold truncate">{m.name}</div>
                  <div className="text-sm text-brand-600">{m.title}</div>
                </div>
                <button onClick={() => toggle(m.id, m.is_active)} title={m.is_active ? "Deactivate" : "Activate"}
                  className={cn("ml-auto w-8 h-8 grid place-items-center border rounded-lg hover:bg-slate-50 shrink-0",
                    m.is_active ? "border-hairline text-slate-400" : "border-emerald-200 text-emerald-600")}>
                  <Power className="w-4 h-4" />
                </button>
              </div>
              {m.focus && <p className="text-sm text-muted border-t border-hairline pt-3">{m.focus}</p>}
              <div className="flex items-center justify-between mt-3">
                <div><div className="text-2xl font-bold">{m.assigned}</div><div className="text-xs text-muted">students assigned</div></div>
                {!m.is_active && <Badge tone="neutral">Deactivated</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Team / admins */}
      <h2 className="text-lg font-bold mt-8 mb-3">Team</h2>
      <Card className="divide-y divide-slate-50">
        {staff.map((p) => {
          const canToggle = isSuper && p.role !== "super_admin" && p.id !== user.id;
          return (
            <div key={p.id} className={cn("flex items-center gap-3 px-5 py-3.5", !p.is_active && "opacity-60")}>
              <Avatar name={p.full_name || p.email} src={p.avatar_url} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm truncate">{p.full_name || p.email}</div>
                <div className="text-xs text-muted truncate">{p.email}</div>
              </div>
              <Badge tone={p.role === "super_admin" ? "progress" : "neutral"}>
                {p.role === "super_admin" ? "Super admin" : "Admin"}
              </Badge>
              {canToggle && (
                <button onClick={() => toggle(p.id, p.is_active)} title={p.is_active ? "Deactivate" : "Activate"}
                  className={cn("w-8 h-8 grid place-items-center border rounded-lg hover:bg-slate-50",
                    p.is_active ? "border-hairline text-slate-400" : "border-emerald-200 text-emerald-600")}>
                  <Power className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </Card>
      {!isSuper && <p className="text-xs text-muted mt-2">Only a super admin can create or deactivate admins.</p>}
    </div>
  );
}
