import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Eye, Star } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getStudentForReview, addFeedback, signedUrl } from "../../lib/db.js";
import { buildHome, asTags, portfolioProgress } from "../../lib/portfolioHome.js";
import { timeAgo } from "../../lib/constants.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import { Spinner } from "../../components/ui/Feedback.jsx";
import { cn } from "../../lib/cn.js";

const chipColor = (t) => (t === "Image" ? "bg-pink-100 text-pink-600" : t === "Video" ? "bg-violet-100 text-violet-600" : "bg-brand-50 text-brand-600");

function entryFields(tpl, entry) {
  return tpl.fields
    .map((f) => {
      const raw = entry.fields?.[f.id];
      const val = f.type === "tags" ? asTags(raw).join(", ") : (raw || "");
      return val ? { label: f.label, value: String(val) } : null;
    })
    .filter(Boolean);
}

export default function MentorReview() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => { setData(await getStudentForReview(id)); }, [id]);
  useEffect(() => { load(); }, [load]);

  const home = useMemo(() => data?.bundle && buildHome({
    ...data.bundle,
    snapshot: {
      name: data.name, avatar_url: data.avatar_url, grade: data.student.grade,
      term: data.student.term, city: data.city, current_school: data.student.current_school,
    },
  }), [data]);

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    await addFeedback(id, user.id, text.trim());
    setText(""); await load(); setBusy(false);
  };
  const open = async (f) => { const url = await signedUrl(f.storage_path); if (url) window.open(url, "_blank", "noopener"); };

  if (!data || !home) return <Spinner />;
  const { student, name, avatar_url, feedback } = data;
  const pct = portfolioProgress(data.bundle.modules, data.bundle.entries);

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
          {home.sections.length === 0 && <Card className="p-6 text-sm text-muted">Nothing filled in yet.</Card>}
          <div className="space-y-4">
            {home.sections.map(({ module, tpl, entries }) => (
              <Card key={module.id} className="p-5">
                <h3 className="font-bold mb-3">{module.label}</h3>
                <div className="space-y-4">
                  {entries.map((e) => {
                    const vals = entryFields(tpl, e);
                    return (
                      <div key={e.id} className="border border-hairline rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold inline-flex items-center gap-2">
                              {e.title}
                              {e.featured && <Badge tone="pending"><Star className="w-3 h-3 mr-0.5" />Featured</Badge>}
                              {e.visibility === "Private" && <Badge tone="neutral">Private</Badge>}
                            </div>
                            {e.subtitle && <div className="text-sm text-muted">{e.subtitle}</div>}
                          </div>
                          {e.entry_date && <div className="text-xs text-muted shrink-0">{e.entry_date.slice(0, 4)}</div>}
                        </div>
                        {vals.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {vals.map((v) => (
                              <div key={v.label}>
                                <div className="text-xs uppercase tracking-wide text-slate-400">{v.label}</div>
                                <div className="text-sm text-ink whitespace-pre-line">{v.value}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {e.files.length > 0 && (
                          <div className="mt-3 grid sm:grid-cols-2 gap-2">
                            {e.files.map((f) => (
                              <div key={f.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-hairline">
                                <span className={cn("w-8 h-8 rounded-lg grid place-items-center shrink-0", chipColor(f.type))}>
                                  {f.type === "Video" ? <Play className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </span>
                                <span className="text-sm truncate flex-1">{f.name}</span>
                                <button onClick={() => open(f)} disabled={!f.storage_path}
                                  className="text-xs font-semibold text-brand-600 hover:underline disabled:text-slate-300">
                                  {f.type === "Video" ? "Watch" : "Open"}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
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