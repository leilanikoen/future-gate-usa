import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Play, Eye } from "lucide-react";
import { getPublicPortfolio, signedUrl } from "../../lib/db.js";
import { SECTIONS, groupItems } from "../../lib/constants.js";
import Logo from "../../components/ui/Logo.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import { Spinner } from "../../components/ui/Feedback.jsx";
import { cn } from "../../lib/cn.js";

const chipColor = (type) =>
  type === "Image" ? "bg-pink-100 text-pink-600" : type === "Video" ? "bg-violet-100 text-violet-600" : "bg-brand-50 text-brand-600";

export default function PublicPortfolio() {
  const { slug } = useParams();
  const [state, setState] = useState({ loading: true, data: null, blocked: false });

  useEffect(() => {
    (async () => {
      try {
        const data = await getPublicPortfolio(slug);
        if (!data || data.student.privacy === "Private") return setState({ loading: false, data: null, blocked: true });
        setState({ loading: false, data, blocked: false });
      } catch {
        setState({ loading: false, data: null, blocked: true });
      }
    })();
  }, [slug]);

  const open = async (it) => { const url = await signedUrl(it.storage_path); if (url) window.open(url, "_blank"); };

  if (state.loading) return <Spinner />;
  if (state.blocked || !state.data)
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center bg-canvas">
        <div>
          <h1 className="text-2xl font-bold">Portfolio not available</h1>
          <p className="text-muted mt-2">This portfolio is private or the link is incorrect.</p>
        </div>
      </div>
    );

  const { name, avatar_url, student, items } = state.data;
  const grouped = groupItems(items);
  const filled = SECTIONS.filter((s) => grouped[s.key].length > 0);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 pt-6 pb-16">
          <div className="mb-8"><Logo /></div>
          <div className="flex items-center gap-5">
            {avatar_url
              ? <img src={avatar_url} alt={name} className="w-20 h-20 rounded-2xl object-cover" />
              : <Avatar name={name} size="lg" />}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{name}</h1>
              <p className="text-slate-300 mt-1">
                {student.grade ? `Grade ${student.grade}` : "Student"} · Applying {student.term}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 sm:px-6 -mt-8 pb-16 space-y-5">
        {filled.length === 0 && (
          <div className="bg-white rounded-2xl border border-hairline p-8 text-center text-muted">
            This portfolio has no published sections yet.
          </div>
        )}
        {filled.map((s) => (
          <div key={s.key} className="bg-white rounded-2xl border border-hairline shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">{s.label}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {grouped[s.key].map((it) => (
                <div key={it.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-hairline">
                  <span className={cn("w-9 h-9 rounded-lg grid place-items-center", chipColor(it.type))}>
                    {it.type === "Video" ? <Play className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </span>
                  <div className="min-w-0 flex-1"><div className="font-semibold text-sm truncate">{it.name}</div><div className="text-xs text-muted">{it.type}</div></div>
                  <button onClick={() => open(it)} disabled={!it.storage_path}
                    className="text-xs font-semibold text-lime-600 hover:underline disabled:text-slate-300">
                    {it.type === "Video" ? "Watch" : "Preview"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
        <p className="text-center text-xs text-muted pt-4">
          Shared via Future Gate USA · {window.location.host}/student/{student.slug}
        </p>
      </div>
    </div>
  );
}
