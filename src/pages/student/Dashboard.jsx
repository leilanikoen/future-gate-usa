import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { ArrowRight, Star, ExternalLink } from "lucide-react";
import { getPortfolioBundle, signedUrl } from "../../lib/db.js";
import { buildHome } from "../../lib/portfolioHome.js";
import { timeAgo } from "../../lib/constants.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import { Spinner } from "../../components/ui/Feedback.jsx";

function Tag({ children }) {
  return <span className="text-xs font-medium bg-white/15 text-white px-2.5 py-1 rounded-full">{children}</span>;
}
function Chip({ children }) {
  return <span className="text-xs font-medium bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full">{children}</span>;
}
function SectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-bold">{children}</h3>
      {action}
    </div>
  );
}

export default function Dashboard() {
  const { student, profile, feedback, publicUrl } = useOutletContext();
  const nav = useNavigate();
  const [bundle, setBundle] = useState(null);
  const [thumbs, setThumbs] = useState({});

  useEffect(() => { (async () => setBundle(await getPortfolioBundle(student.id)))(); }, [student.id]);

  const home = useMemo(() => bundle && buildHome({
    ...bundle,
    snapshot: {
      name: profile?.full_name, avatar_url: profile?.avatar_url, grade: student?.grade,
      term: student?.term, city: profile?.city, current_school: student?.current_school,
    },
  }), [bundle, profile, student]);

  useEffect(() => {
    if (!home?.media?.length) return;
    (async () => {
      const out = {};
      for (const f of home.media) { const u = await signedUrl(f.storage_path); if (u) out[f.id] = u; }
      setThumbs(out);
    })();
  }, [home]);

  if (!home) return <Spinner label="Loading your dashboard…" />;

  const s = home.snapshot;
  const recent = (feedback || []).slice(0, 3);

  return (
    <div className="max-w-6xl space-y-6">
      {/* hero */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          {s.avatar_url ? <img src={s.avatar_url} alt={s.name} className="w-20 h-20 rounded-2xl object-cover" /> : <Avatar name={s.name} size="lg" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{s.name}</h1>
                <p className="text-slate-300 mt-1 text-sm">
                  {s.grade ? `Grade ${s.grade}` : "Student"}{s.headline ? ` · ${s.headline}` : ""} · Applying {s.term}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => nav("/app/portfolio")}>Edit portfolio</Button>
            </div>
            {s.tags.length > 0 && <div className="flex flex-wrap gap-2 mt-3">{s.tags.map((t) => <Tag key={t}>{t}</Tag>)}</div>}
            {s.mission && <p className="text-slate-200 mt-4 text-sm leading-relaxed max-w-2xl">{s.mission}</p>}
          </div>
        </div>
      </div>

      {!home.hasContent && (
        <Card className="p-8 text-center">
          <h2 className="text-lg font-bold">Let’s build your portfolio</h2>
          <p className="text-sm text-muted mt-1">Your Home page fills in automatically as you add entries.</p>
          <Button className="mt-4" onClick={() => nav("/app/portfolio")}><ArrowRight className="w-4 h-4" /> Start building</Button>
        </Card>
      )}

      {/* highlights */}
      {home.highlights.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Portfolio highlights</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {home.highlights.map((h) => (
              <Card key={h.label} className="p-4">
                <div className="text-2xl font-bold text-brand-700">{h.value}</div>
                <div className="text-xs text-muted mt-1">{h.label}</div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* featured */}
        <Card className="lg:col-span-2 p-6">
          <SectionTitle action={<Button variant="ghost" size="sm" onClick={() => nav("/app/portfolio")}>Manage</Button>}>Featured achievements</SectionTitle>
          {home.featured.length === 0 ? (
            <p className="text-sm text-muted">Mark entries “Feature on Home page” to spotlight them here.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
              {home.featured.map((f) => (
                <div key={f.id}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-brand-500">{f.category}</div>
                  <div className="font-semibold text-sm mt-0.5">{f.title}</div>
                  {f.subtitle && <div className="text-sm text-muted">{f.subtitle}</div>}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* recent feedback */}
        <Card className="p-5">
          <SectionTitle action={<Button variant="ghost" size="sm" onClick={() => nav("/app/feedback")}>All</Button>}>Recent feedback</SectionTitle>
          {recent.length === 0 ? (
            <p className="text-sm text-muted">No feedback yet.</p>
          ) : (
            <div className="space-y-4">
              {recent.map((f) => (
                <div key={f.id} className="flex gap-3">
                  <Avatar name={f.author} size="sm" />
                  <div className="min-w-0"><div className="text-sm font-semibold">{f.author}</div><p className="text-sm text-muted line-clamp-2">{f.body}</p></div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* summary cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-5">
          <h3 className="font-bold mb-3">Research summary</h3>
          {home.summary.research.interests.length > 0 && (
            <>
              <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">Interests</div>
              <div className="flex flex-wrap gap-1.5 mb-3">{home.summary.research.interests.map((t) => <Chip key={t}>{t}</Chip>)}</div>
            </>
          )}
          {home.summary.research.currentProject && (<><div className="text-xs uppercase tracking-wide text-slate-400">Current project</div><div className="text-sm font-medium mb-2">{home.summary.research.currentProject}</div></>)}
          {home.summary.research.latestPublication && (<><div className="text-xs uppercase tracking-wide text-slate-400">Latest publication</div><div className="text-sm font-medium">{home.summary.research.latestPublication}</div></>)}
        </Card>
        <Card className="p-5">
          <h3 className="font-bold mb-3">Leadership &amp; service</h3>
          <div className="flex gap-6 mb-3">
            <div><div className="text-xl font-bold">{home.summary.leadership.programs}</div><div className="text-xs text-muted">Programs</div></div>
            <div><div className="text-xl font-bold">{home.summary.leadership.volunteering}</div><div className="text-xs text-muted">Volunteering</div></div>
            <div><div className="text-xl font-bold">{home.summary.leadership.hours}</div><div className="text-xs text-muted">Hours</div></div>
          </div>
          {home.summary.leadership.latestProject && (<><div className="text-xs uppercase tracking-wide text-slate-400">Latest project</div><div className="text-sm font-medium">{home.summary.leadership.latestProject}</div></>)}
        </Card>
        <Card className="p-5">
          <h3 className="font-bold mb-3">Academic journey</h3>
          {home.summary.academic.currentSchool && (<><div className="text-xs uppercase tracking-wide text-slate-400">Current school</div><div className="text-sm font-medium mb-2">{home.summary.academic.currentSchool}</div></>)}
          {home.summary.academic.gpa && (<><div className="text-xs uppercase tracking-wide text-slate-400">GPA</div><div className="text-sm font-medium mb-2">{home.summary.academic.gpa}</div></>)}
          {home.summary.academic.coursework.length > 0 && (
            <><div className="text-xs uppercase tracking-wide text-slate-400 mb-1">Recent coursework</div>
            <div className="flex flex-wrap gap-1.5">{home.summary.academic.coursework.map((t) => <Chip key={t}>{t}</Chip>)}</div></>
          )}
        </Card>
      </div>

      {/* timeline */}
      {home.timeline.length > 0 && (
        <Card className="p-6">
          <SectionTitle>Personal growth timeline</SectionTitle>
          <div className="space-y-3">
            {home.timeline.map((t) => (
              <div key={t.id} className="flex gap-4">
                <div className="text-sm font-bold text-brand-600 w-12 shrink-0">{t.year}</div>
                <div><div className="text-xs uppercase tracking-wide text-slate-400">{t.category}</div><div className="text-sm font-medium">{t.title}</div></div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* featured media */}
      {home.media.length > 0 && (
        <Card className="p-6">
          <SectionTitle>Featured media</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {home.media.map((f) => (
              <div key={f.id} className="aspect-video rounded-xl overflow-hidden bg-slate-100 border border-hairline">
                {thumbs[f.id] && f.type === "Image"
                  ? <img src={thumbs[f.id]} alt={f.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full grid place-items-center text-xs text-muted">{f.type}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* personal statement */}
      {home.personalStatement.length > 0 && (
        <Card className="p-6">
          <SectionTitle>Personal statement</SectionTitle>
          <div className="space-y-3 text-sm text-ink leading-relaxed">{home.personalStatement.map((p, i) => <p key={i}>{p}</p>)}</div>
        </Card>
      )}

      {/* quick nav */}
      <Card className="p-6">
        <SectionTitle action={<a href={publicUrl} target="_blank" rel="noreferrer"><Button variant="ghost" size="sm"><ExternalLink className="w-4 h-4" /> View public page</Button></a>}>Quick navigation</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {home.quickNav.map((label) => (
            <button key={label} onClick={() => nav("/app/portfolio")} className="text-sm border border-hairline rounded-lg px-3 py-1.5 hover:bg-slate-50">{label}</button>
          ))}
        </div>
      </Card>
    </div>
  );
}