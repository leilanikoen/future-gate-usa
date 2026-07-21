import { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { listFeedbackForStudents, addReply, resolveFeedback } from "../../lib/db.js";
import { timeAgo } from "../../lib/constants.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Input from "../../components/ui/Input.jsx";
import { Spinner, EmptyState } from "../../components/ui/Feedback.jsx";
import { cn } from "../../lib/cn.js";

export default function MentorFeedback() {
  const { mentees } = useOutletContext();
  const [threads, setThreads] = useState(null);
  const [tab, setTab] = useState("open");

  const load = useCallback(async () => {
    setThreads(await listFeedbackForStudents(mentees.map((m) => m.id)));
  }, [mentees]);
  useEffect(() => { load(); }, [load]);

  if (threads === null) return <Spinner />;
  const list = tab === "open" ? threads.filter((t) => !t.resolved)
    : tab === "resolved" ? threads.filter((t) => t.resolved) : threads;

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
      <p className="text-muted mt-1 mb-5">Comments across your assigned students, with their replies.</p>

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
        <EmptyState title={`No ${tab === "all" ? "" : tab} feedback`} hint="Feedback you send to students appears here with their replies." />
      ) : (
        <div className="space-y-4">
          {list.map((f) => <Thread key={f.id} f={f} reload={load} />)}
        </div>
      )}
    </div>
  );
}

function Thread({ f, reload }) {
  const { user } = useAuth();
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async () => { if (!reply.trim()) return; setBusy(true); await addReply(f.id, user.id, reply.trim()); setReply(""); await reload(); setBusy(false); };
  const resolve = async () => { await resolveFeedback(f.id); await reload(); };

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <Avatar name={f.studentName} size="sm" />
        <b className="text-sm">{f.studentName}</b>
        <span className="ml-auto flex items-center gap-2">
          <Badge tone="progress">Feedback</Badge>
          {f.resolved ? <Badge tone="complete">Resolved</Badge> : <span className="text-xs text-muted">{timeAgo(f.created_at)}</span>}
        </span>
      </div>
      <p className="text-sm text-ink/80"><b className="text-ink">{f.author}:</b> {f.body}</p>
      {f.replies.map((r) => (
        <div key={r.id} className="mt-2 pl-3 border-l-2 border-hairline text-sm text-muted"><b className="text-ink">{r.author}:</b> {r.body}</div>
      ))}
      {!f.resolved && (
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply…" className="flex-1" />
          <div className="flex gap-2">
            <Button onClick={send} disabled={busy || !reply.trim()}>Reply</Button>
            <Button variant="ghost" onClick={resolve}>Resolve</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
