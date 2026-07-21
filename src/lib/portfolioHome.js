// ============================================================================
// Future Gate USA — dynamic Home model.
// Pure functions that turn a portfolio bundle (modules + entries + files) into
// the computed view used by BOTH the student dashboard and the public page:
// snapshot, highlight counts, featured items, growth timeline, media, summary
// cards, quick-nav, and the ordered sections. Nothing here is stored.
// ============================================================================
import { HIGHLIGHT_MODULES, templateFor } from "./portfolioTemplates.js";

const isFilled = (e) => (e?.title || "").trim() !== "";
export const asTags = (v) =>
  Array.isArray(v) ? v : (v ? String(v).split(",").map((t) => t.trim()).filter(Boolean) : []);

function latest(entries) {
  return [...entries].sort((a, b) => {
    const da = a.entry_date || "", db = b.entry_date || "";
    if (da && db) return db.localeCompare(da);
    if (da) return -1;
    if (db) return 1;
    return (a.position || 0) - (b.position || 0);
  })[0] || null;
}

// Share of non-computed modules that have at least one titled entry.
export function portfolioProgress(modules = [], entries = []) {
  const tracked = modules.filter((m) => m.kind !== "computed");
  if (!tracked.length) return 0;
  const filled = new Set(entries.filter(isFilled).map((e) => e.module_id));
  return Math.round((tracked.filter((m) => filled.has(m.id)).length / tracked.length) * 100);
}

export function buildHome({ modules = [], entries = [], files = [], snapshot = {} }) {
  const byId = Object.fromEntries(modules.map((m) => [m.id, m]));
  const byKey = Object.fromEntries(modules.map((m) => [m.key, m]));
  const filled = entries.filter(isFilled);
  const inModule = (key) => (byKey[key] ? filled.filter((e) => e.module_id === byKey[key].id) : []);

  const filesByEntry = {};
  files.forEach((f) => { (filesByEntry[f.entry_id] ||= []).push(f); });

  const about = byKey.about_me ? entries.find((e) => e.module_id === byKey.about_me.id) : null;
  const af = about?.fields || {};

  const hours = inModule("community").reduce((s, e) => s + (Number(e.fields?.hours) || 0), 0);

  const highlightOrder = [
    ["academic_journey", "Schools"], ["research", "Research Projects"], ["publications", "Publications"],
    ["leadership", "Leadership Programs"], ["community", "Volunteer Activities"],
    ["__hours__", "Service Hours"], ["reading", "Books Read"], ["athletics", "Athletics"], ["creative", "Creative Projects"],
  ];
  const highlights = highlightOrder
    .map(([key, label]) => ({ label, value: key === "__hours__" ? hours : inModule(key).length }))
    .filter((h) => h.value > 0);

  const featured = filled
    .filter((e) => e.featured)
    .map((e) => ({ id: e.id, category: byId[e.module_id]?.label || "", title: e.title, subtitle: e.subtitle || "" }))
    .slice(0, 6);

  const timeline = filled
    .filter((e) => e.entry_date)
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date))
    .map((e) => ({ id: e.id, year: e.entry_date.slice(0, 4), category: byId[e.module_id]?.label || "", title: e.title }))
    .slice(0, 10);

  const media = [];
  filled.forEach((e) => (filesByEntry[e.id] || []).forEach((f) => {
    if (f.type === "Image" || f.type === "Video") media.push(f);
  }));

  const schoolLatest = latest(inModule("academic_journey"));
  const summary = {
    research: {
      interests: asTags(af.academic_interests),
      currentProject: latest(inModule("research"))?.title || null,
      latestPublication: latest(inModule("publications"))?.title || null,
    },
    leadership: {
      programs: inModule("leadership").length,
      volunteering: inModule("community").length,
      hours,
      latestProject: latest(inModule("community"))?.title || null,
    },
    academic: {
      currentSchool: snapshot.current_school || schoolLatest?.title || null,
      gpa: schoolLatest?.fields?.gpa || null,
      coursework: asTags(schoolLatest?.fields?.coursework),
    },
  };

  const sections = modules
    .filter((m) => m.kind !== "computed" && !m.hidden)
    .map((m) => ({
      module: m,
      tpl: templateFor(m),
      entries: filled.filter((e) => e.module_id === m.id).map((e) => ({ ...e, files: filesByEntry[e.id] || [] })),
    }))
    .filter((s) => s.entries.length > 0);

  return {
    snapshot: {
      name: snapshot.name, avatar_url: snapshot.avatar_url, grade: snapshot.grade, term: snapshot.term,
      city: snapshot.city, current_school: snapshot.current_school,
      headline: af.headline || "", mission: af.mission || "", tags: asTags(af.academic_interests),
    },
    personalStatement: [af.bio, af.my_story].filter(Boolean),
    highlights, featured, timeline, media, summary, sections,
    quickNav: modules.filter((m) => m.kind !== "computed" && !m.hidden).map((m) => m.label),
    hasContent: filled.length > 0,
  };
}
