import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Eye } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getStudentForReview, addFeedback, signedUrl } from "../../lib/db.js";
import { SECTIONS, groupItems, completion, timeAgo } from "../../lib/constants.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import { Spinner } from "../../components/ui/Feedback.jsx";
import { cn } from "../../lib/cn.js";

const chipColor = (t) => (t === "Image" ? "bg-pink-100 text-pink-600" : t === "Video" ? "bg-violet-100 text-violet-600" : "bg-brand-50 text-brand-600");

export default function MentorReview() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => { setData(await getStudentForReview(id)); }, [id]);
  useEffect(() => { load(); }, [load]);

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    await addFeedback(id, user.id, text.trim());
    setText(""); await load(); setBusy(false);
  };
  const open = async (it) => { const url = await signedUrl(it.storage_path); if (url) window.open(url, "_blank"); };

  if (!data) return <Spinner />;
  const { student, name, avatar_url, items, feedback } = data;
  const grouped = groupItems(items);
  const filled = SECTIONS.filter((s) => grouped[s.key].length > 0);
  const pct = completion(grouped).pct;

  return (
    <div className="max-w-6xl">
      <button onClick={() => nav("/mentor/students")} className="flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to students
      </button>

      <div className="flex items-center gap-4 mb-6">
        <Avatar name={name} src={avatar_url} size="lg" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
          <p className="text-muted">Grade {student.grade || "—"} · Applying {student.term} · {pct}% complete</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-bold mb-3">Portfolio</h2>
          {filled.length === 0 && <Card className="p-6 text-sm text-muted">No items uploaded yet.</Card>}
          <div className="space-y-4">
            {filled.map((s) => (
              <Card key={s.key} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">{s.label}</h3><Badge tone="complete">Complete</Badge>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {grouped[s.key].map((it) => (
                    <div key={it.id} className="flex items-center gap-3 p-3 rounded-lg border border-hairline">
                      <span className={cn("w-9 h-9 rounded-lg grid place-items-center", chipColor(it.type))}>
                        {it.type === "Video" ? <Play className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </span>
                      <div className="min-w-0 flex-1"><div className="font-semibold text-sm truncate">{it.name}</div><div className="text-xs text-muted">{it.type}</div></div>
                      <button onClick={() => open(it)} disabled={!it.storage_path} className="text-xs font-semibold text-lime-600 hover:underline disabled:text-slate-300">
                        {it.type === "Video" ? "Watch" : "Preview"}
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-3">Send Feedback</h2>
          <Card className="p-4 mb-4">
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
              placeholder="Write feedback for this student…"
              className="w-full text-sm outline-none resize-none placeholder:text-slate-400" />
            <div className="flex justify-end">
              <Button onClick={send} disabled={busy || !text.trim()}>{busy ? "Sending…" : "Send Feedback"}</Button>
            </div>
          </Card>
          <div className="space-y-3">
            {feedback.map((f) => (
              <Card key={f.id} className="p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge tone="progress">{f.author}</Badge>
                  {f.resolved ? <Badge tone="complete">Resolved</Badge> : <span className="text-xs text-muted">{timeAgo(f.created_at)}</span>}
                </div>
                <p className="text-sm text-ink/80">{f.body}</p>
                {f.replies.map((r) => (
                  <div key={r.id} className="mt-2 pl-3 border-l-2 border-hairline text-sm text-muted"><b className="text-ink">{r.author}:</b> {r.body}</div>
                ))}
              </Card>
            ))}
            {feedback.length === 0 && <p className="text-sm text-muted">No feedback yet — be the first to guide this student.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
