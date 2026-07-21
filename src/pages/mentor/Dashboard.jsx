import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { feedbackSentThisMonth, listActivity } from "../../lib/db.js";
import { activityPhrase, timeAgo } from "../../lib/constants.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import Progress from "../../components/ui/Progress.jsx";

const statusTone = (s) => (s === "approved" ? "approved" : s === "pending" ? "pending" : "progress");
const statusText = (s) => (s === "approved" ? "Approved" : s === "pending" ? "Pending" : "In Progress");

export default function MentorDashboard() {
  const { mentees } = useOutletContext();
  const { user, profile } = useAuth();
  const nav = useNavigate();
  const [sent, setSent] = useState(0);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    feedbackSentThisMonth(user.id).then(setSent);
    listActivity({ limit: 6 }).then(setActivity);
  }, [user.id]);

  const assigned = mentees.length;
  const pending = mentees.filter((m) => m.status === "pending");
  const avg = assigned ? Math.round(mentees.reduce((s, m) => s + m.pct, 0) / assigned) : 0;
  const first = (profile?.full_name || "there").split(" ")[0];

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold tracking-tight">Welcome back, {first}</h1>
      <p className="text-muted mt-1 mb-6">Review assigned students and provide guidance throughout their application journey.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Assigned Students" value={String(assigned).padStart(2, "0")} note="this semester" onOpen={() => nav("/mentor/students")} />
        <StatCard label="Pending Reviews" value={String(pending.length).padStart(2, "0")} note="need attention" onOpen={() => nav("/mentor/students")} />
        <StatCard label="Avg. Completion" value={`${avg}%`} note="across students" onOpen={() => nav("/mentor/students")} />
        <StatCard label="Feedback Sent" value={String(sent).padStart(2, "0")} note="this month" onOpen={() => nav("/mentor/feedback")} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Assigned Students</h2>
            <Button variant="ghost" size="sm" onClick={() => nav("/mentor/students")}>View all →</Button>
          </div>
          {mentees.length === 0 ? (
            <p className="text-sm text-muted">No students assigned yet. An administrator assigns students to you.</p>
          ) : (
            <div className="space-y-2">
              {mentees.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-hairline">
                  <Avatar name={m.name} src={m.avatar_url} size="sm" />
                  <div className="min-w-0 w-40"><div className="font-semibold text-sm truncate">{m.name}</div><div className="text-xs text-muted">Grade {m.grade || "—"}</div></div>
                  <div className="flex-1 hidden sm:flex items-center gap-2"><Progress value={m.pct} /><span className="text-xs text-muted w-9">{m.pct}%</span></div>
                  <Badge tone={statusTone(m.status)}>{statusText(m.status)}</Badge>
                  <button onClick={() => nav(`/mentor/review/${m.id}`)} className="text-sm font-semibold text-lime-600 hover:underline shrink-0">View Portfolio</button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="font-bold mb-3">Pending Reviews</h3>
            {pending.length === 0 ? <p className="text-sm text-muted">Nothing waiting on you 🎉</p> : (
              <div className="space-y-3">
                {pending.slice(0, 5).map((m) => (
                  <button key={m.id} onClick={() => nav(`/mentor/review/${m.id}`)} className="w-full flex items-center gap-3 text-left">
                    <Avatar name={m.name} src={m.avatar_url} size="sm" />
                    <div className="min-w-0"><div className="text-sm font-semibold truncate">{m.name}</div><div className="text-xs text-muted">Needs review</div></div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="font-bold mb-3">Recent Activity</h3>
            {activity.length === 0 ? <p className="text-sm text-muted">No activity yet.</p> : (
              <div className="space-y-3">
                {activity.map((e) => (
                  <div key={e.id} className="flex items-center gap-3">
                    <Avatar name={e.actorName} src={e.actorAvatar} size="sm" />
                    <div className="flex-1 min-w-0 text-sm"><span className="text-ink/80">{activityPhrase(e)}</span></div>
                    <span className="text-xs text-muted shrink-0">{timeAgo(e.created_at)}</span>
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
