import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { listActivity } from "../../lib/db.js";
import { activityPhrase, timeAgo } from "../../lib/constants.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import Progress from "../../components/ui/Progress.jsx";

export default function Overview() {
  const { students, mentors } = useOutletContext();
  const nav = useNavigate();
  const [activity, setActivity] = useState([]);
  useEffect(() => { listActivity({ limit: 8 }).then(setActivity); }, []);

  const activeStudents = students.filter((s) => s.is_active).length;
  const pending = students.filter((s) => s.status === "pending").length;
  const activeMentors = mentors.filter((m) => m.is_active).length;
  const files = students.reduce((n, s) => n + Math.round((s.pct / 100) * 7), 0); // approx items-by-section
  const maxPct = 100;

  const serviceMix = Object.entries(
    students.reduce((m, s) => { m[s.service] = (m[s.service] || 0) + 1; return m; }, {})
  );

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
      <p className="text-muted mt-1 mb-6">Monitor student progress, mentor activity, and platform performance.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Students" value={String(activeStudents).padStart(2, "0")} note="on the platform" onOpen={() => nav("/admin/students")} />
        <StatCard label="Pending Reviews" value={String(pending).padStart(2, "0")} note="awaiting mentor feedback" onOpen={() => nav("/admin/students")} />
        <StatCard label="Active Mentors" value={String(activeMentors).padStart(2, "0")} note="currently assigned" onOpen={() => nav("/admin/mentors")} />
        <StatCard label="Portfolios" value={String(students.length).padStart(2, "0")} note="total portfolios" onOpen={() => nav("/admin/students")} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2 p-6">
          <h2 className="text-lg font-bold mb-6">Portfolio completion</h2>
          {students.length === 0 ? <p className="text-sm text-muted">No students yet.</p> : (
            <div className="flex items-end gap-3 h-48 overflow-x-auto">
              {students.map((s) => (
                <div key={s.id} className="flex-1 min-w-14 flex flex-col items-center gap-2">
                  <div className="text-xs font-semibold text-muted">{s.pct}%</div>
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-400"
                       style={{ height: `${Math.max((s.pct / maxPct) * 100, 3)}%` }} />
                  <div className="text-xs text-muted truncate w-full text-center">{s.name.split(" ")[0]}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">Service Mix</h2>
          {serviceMix.length === 0 ? <p className="text-sm text-muted">No data yet.</p> : (
            <div className="space-y-3">
              {serviceMix.map(([name, n]) => (
                <div key={name}>
                  <div className="flex justify-between text-sm mb-1"><span className="text-ink/80">{name}</span><span className="text-muted">{n}</span></div>
                  <Progress value={students.length ? (n / students.length) * 100 : 0} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Recent Activity</h2>
          <Button variant="ghost" size="sm" onClick={() => nav("/admin/activity")}>View all</Button>
        </div>
        {activity.length === 0 ? <p className="text-sm text-muted">No activity yet.</p> : (
          <div className="space-y-3">
            {activity.map((e) => (
              <div key={e.id} className="flex items-center gap-3">
                <Avatar name={e.actorName} src={e.actorAvatar} size="sm" />
                <div className="flex-1 min-w-0 text-sm text-ink/80">{activityPhrase(e)}</div>
                <span className="text-xs text-muted shrink-0">{timeAgo(e.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
