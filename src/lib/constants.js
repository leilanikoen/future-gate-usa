// Section vocabulary — keys match the DB check constraint; labels match the Figma.
export const SECTIONS = [
  { key: "academics",        label: "Academics",                unit: "documents" },
  { key: "extracurriculars", label: "Extracurricular Activities", unit: "activities" },
  { key: "leadership",       label: "Leadership",               unit: "experiences" },
  { key: "awards",           label: "Awards & Honors",          unit: "awards" },
  { key: "essays",           label: "Essays",                   unit: "essays" },
  { key: "media",            label: "Media & Portfolio",        unit: "items" },
  { key: "recommendations",  label: "Recommendations",          unit: "letters" },
];
export const SECTION_LABEL = Object.fromEntries(SECTIONS.map((s) => [s.key, s.label]));
export const SECTION_UNIT  = Object.fromEntries(SECTIONS.map((s) => [s.key, s.unit]));

export const GRADES = ["6", "7", "8", "9", "10", "11", "12"];
export const PRIVACY = ["Public", "School-only", "Private"];

export function fileType(name = "") {
  const ext = name.split(".").pop().toLowerCase();
  if (["mp4", "mov", "webm", "avi", "mkv"].includes(ext)) return "Video";
  if (["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(ext)) return "Image";
  return "Document";
}

export function groupItems(items = []) {
  const g = Object.fromEntries(SECTIONS.map((s) => [s.key, []]));
  for (const it of items) if (g[it.section]) g[it.section].push(it);
  for (const k of Object.keys(g)) g[k].sort((a, b) => a.position - b.position);
  return g;
}

export function completion(grouped) {
  const done = SECTIONS.filter((s) => (grouped[s.key] || []).length > 0).length;
  return { done, total: SECTIONS.length, pct: Math.round((done / SECTIONS.length) * 100) };
}

// Completion as it stood at a past date, reconstructed from item timestamps.
export function completionAsOf(items, date) {
  const seen = new Set();
  for (const it of items) if (new Date(it.created_at) <= date) seen.add(it.section);
  const done = SECTIONS.filter((s) => seen.has(s.key)).length;
  return Math.round((done / SECTIONS.length) * 100);
}

export function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function activityPhrase(e) {
  switch (e.verb) {
    case "joined":    return `${e.studentName} joined the platform`;
    case "uploaded":  return `${e.studentName} uploaded ${e.meta?.name || "a file"}`;
    case "feedback":  return `${e.actorName} left feedback for ${e.studentName}`;
    case "submitted": return `${e.studentName} submitted their portfolio`;
    case "approved":  return `${e.studentName}'s portfolio was approved`;
    case "shared":    return `${e.studentName} shared their portfolio`;
    default:          return `${e.studentName} — activity`;
  }
}
