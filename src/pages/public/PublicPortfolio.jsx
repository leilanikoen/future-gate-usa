import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Play, Eye, Download, Star } from "lucide-react";
import { getPublicPortfolioV2, signedUrl } from "../../lib/db.js";
import { buildHome, asTags } from "../../lib/portfolioHome.js";
import Logo from "../../components/ui/Logo.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import { Spinner } from "../../components/ui/Feedback.jsx";
import { cn } from "../../lib/cn.js";

const chipColor = (type) =>
  type === "Image" ? "bg-pink-100 text-pink-600" : type === "Video" ? "bg-violet-100 text-violet-600" : "bg-brand-50 text-brand-600";

function fieldValue(tpl, entry) {
  // non-empty template fields as {label, value} for display
  return tpl.fields
    .map((f) => {
      const raw = entry.fields?.[f.id];
      const val = f.type === "tags" ? asTags(raw).join(", ") : (raw || "");
      return val ? { label: f.label, value: String(val) } : null;
    })
    .filter(Boolean);
}

export default function PublicPortfolio() {
  const { slug } = useParams();
  const [state, setState] = useState({ loading: true, data: null, blocked: false });
  const [thumbs, setThumbs] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const data = await getPublicPortfolioV2(slug);
        if (!data) return setState({ loading: false, data: null, blocked: true });
        setState({ loading: false, data, blocked: false });
      } catch {
        setState({ loading: false, data: null, blocked: true });
      }
    })();
  }, [slug]);

  const home = useMemo(() => state.data && buildHome({
    modules: state.data.modules, entries: state.data.entries, files: state.data.files,
    snapshot: {
      name: state.data.name, avatar_url: state.data.avatar_url, grade: state.data.student.grade,
      term: state.data.student.term, city: state.data.city, current_school: state.data.student.current_school,
    },
  }), [state.data]);

  useEffect(() => {
    if (!home?.media?.length) return;
    (async () => {
      const out = {};
      for (const f of home.media) { const u = await signedUrl(f.storage_path); if (u) out[f.id] = u; }
      setThumbs(out);
    })();
  }, [home]);

  const openFile = async (f) => { const url = await signedUrl(f.storage_path); if (url) window.open(url, "_blank", "noopener"); };

  if (state.loading) return <Spinner />;
  if (state.blocked || !home) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center bg-canvas">
        <div>
          <h1 className="text-2xl font-bold">Portfolio not available</h1>
          <p className="text-muted mt-2">This portfolio is private or the link is incorrect.</p>
        </div>
      </div>
    );
  }

  const s = home.snapshot;

  return (
    <div className="min-h-screen bg-canvas">
      <style>{`@media print { .no-print { display: none !important; } .print-hero { background: #0f172a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>

      {/* hero */}
      <div className="print-hero bg-gradient-to-br from-slate-900 to-slate-950 text-white">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 pt-6 pb-16">
          <div className="mb-8 flex items-center justify-between">
            <Logo />
            <button onClick={() => window.print()} className="no-print inline-flex items-center gap-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2">
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {s.avatar_url ? <img src={s.avatar_url} alt={s.name} className="w-20 h-20 rounded-2xl object-cover" /> : <Avatar name={s.name} size="lg" />}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{s.name}</h1>
              <p className="text-slate-300 mt-1">
                {s.grade ? `Grade ${s.grade}` : "Student"}{s.headline ? ` · ${s.headline}` : ""} · Applying {s.term}
              </p>
              {s.tags.length > 0 && <div className="flex flex-wrap gap-2 mt-3">{s.tags.map((t) => <span key={t} className="text-xs bg-white/15 px-2.5 py-1 rounded-full">{t}</span>)}</div>}
            </div>
          </div>
          {s.mission && <p className="text-slate-200 mt-6 max-w-2xl leading-relaxed">{s.mission}</p>}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 sm:px-6 -mt-8 pb-16 space-y-5">
        {/* highlights */}
        {home.highlights.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {home.highlights.map((h) => (
              <div key={h.label} className="bg-white rounded-2xl border border-hairline shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-brand-700">{h.value}</div>
                <div className="text-xs text-muted mt-1">{h.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* featured */}
        {home.featured.length > 0 && (
          <div className="bg-white rounded-2xl border border-hairline shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4 inline-flex items-center gap-2"><Star className="w-4 h-4 text-amber-500" /> Featured achievements</h2>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
              {home.featured.map((f) => (
                <div key={f.id}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-brand-500">{f.category}</div>
                  <div className="font-semibold text-sm mt-0.5">{f.title}</div>
                  {f.subtitle && <div className="text-sm text-muted">{f.subtitle}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* timeline */}
        {home.timeline.length > 0 && (
          <div className="bg-white rounded-2xl border border-hairline shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">Personal growth timeline</h2>
            <div className="space-y-3">
              {home.timeline.map((t) => (
                <div key={t.id} className="flex gap-4">
                  <div className="text-sm font-bold text-brand-600 w-12 shrink-0">{t.year}</div>
                  <div><div className="text-xs uppercase tracking-wide text-slate-400">{t.category}</div><div className="text-sm font-medium">{t.title}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* module sections */}
        {home.sections.map(({ module, tpl, entries }) => (
          <div key={module.id} className="bg-white rounded-2xl border border-hairline shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">{module.label}</h2>
            <div className="space-y-5">
              {entries.map((e) => {
                const vals = fieldValue(tpl, e);
                return (
                  <div key={e.id} className="border border-hairline rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{e.title}</div>
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
                            <button onClick={() => openFile(f)} disabled={!f.storage_path}
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
          </div>
        ))}

        {home.sections.length === 0 && (
          <div className="bg-white rounded-2xl border border-hairline p-8 text-center text-muted">
            This portfolio has no published sections yet.
          </div>
        )}

        <p className="text-center text-xs text-muted pt-4">
          Shared via Future Gate USA · {window.location.host}/student/{state.data.student.slug}
        </p>
      </div>
    </div>
  );
}