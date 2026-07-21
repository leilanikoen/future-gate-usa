// Shared vocabulary + small helpers used across roles.
export const GRADES = ["6", "7", "8", "9", "10", "11", "12"];
export const PRIVACY = ["Public", "School-only", "Private"];

export function fileType(name = "") {
  const ext = name.split(".").pop().toLowerCase();
  if (["mp4", "mov", "webm", "avi", "mkv"].includes(ext)) return "Video";
  if (["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(ext)) return "Image";
  return "Document";
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