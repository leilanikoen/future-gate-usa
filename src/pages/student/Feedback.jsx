import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { addReply, resolveFeedback } from "../../lib/db.js";
import { timeAgo } from "../../lib/constants.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Input from "../../components/ui/Input.jsx";
import { EmptyState } from "../../components/ui/Feedback.jsx";
import { cn } from "../../lib/cn.js";

export default function Feedback() {
  const { feedback, reload } = useOutletContext();
  const [tab, setTab] = useState("open");
  const list = tab === "open" ? feedback.filter((f) => !f.resolved)
    : tab === "resolved" ? feedback.filter((f) => f.resolved) : feedback;

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold tracking-tight">Mentor Feedback</h1>
      <p className="text-muted mt-1 mb-5">Review mentor comments, respond to suggestions, and improve your portfolio before submitting it.</p>

      <div className="inline-flex bg-white border border-hairline rounded-xl p-1 mb-5">
        {["open", "resolved", "all"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-medium capitalize",
              tab === t ? "bg-brand-600 text-white" : "text-muted hover:text-ink")}>
            {t === "all" ? "All feedback" : t}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title={`No ${tab === "all" ? "" : tab} feedback yet`}
          hint="When a mentor reviews your portfolio, their comments show up here." />
      ) : (
        <div className="space-y-4">
          {list.map((f) => <FeedbackCard key={f.id} f={f} reload={reload} />)}
        </div>
      )}
    </div>
  );
}

function FeedbackCard({ f, reload }) {
  const { user } = useAuth();
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!reply.trim()) return;
    setBusy(true);
    await addReply(f.id, user.id, reply.trim());
    setReply(""); await reload(); setBusy(false);
  };
  const resolve = async () => { await resolveFeedback(f.id); await reload(); };

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <Avatar name={f.author} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <b className="text-sm">{f.author}</b>
            <span className="text-xs text-muted">Senior admissions mentor</span>
            <span className="ml-auto flex items-center gap-2">
              <Badge tone="progress">Feedback</Badge>
              {f.resolved ? <Badge tone="complete">Resolved</Badge> : <span className="text-xs text-muted">{timeAgo(f.created_at)}</span>}
            </span>
          </div>
          <p className="text-sm text-ink/80">{f.body}</p>

          {f.replies.map((r) => (
            <div key={r.id} className="mt-2 pl-3 border-l-2 border-hairline text-sm text-muted">
              <b className="text-ink">{r.author}:</b> {r.body}
            </div>
          ))}

          {!f.resolved && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3">
              <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply to your mentor…" className="flex-1" />
              <div className="flex gap-2">
                <Button onClick={send} disabled={busy || !reply.trim()}>Reply</Button>
                <Button variant="ghost" onClick={resolve}>Resolved</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
