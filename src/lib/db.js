import { supabase } from "./supabase.js";

/* ---------------- student + profile ---------------- */
export async function getMyStudent(userId) {
  const { data, error } = await supabase.from("students").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export const updateStudent = (id, patch) => supabase.from("students").update(patch).eq("id", id);
export const updateProfileFields = (id, patch) => supabase.from("profiles").update(patch).eq("id", id);

/* ---------------- portfolio items ---------------- */
export async function listItems(studentId) {
  const { data, error } = await supabase
    .from("portfolio_items").select("*").eq("student_id", studentId)
    .order("section").order("position");
  if (error) throw error;
  return data || [];
}

export async function uploadPortfolioFile(studentId, section, file) {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${studentId}/${section}/${Date.now()}_${safe}`;
  const { error } = await supabase.storage.from("portfolio").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

export async function addItem(studentId, section, { name, type, storage_path = null }) {
  const { data: existing } = await supabase
    .from("portfolio_items").select("position").eq("student_id", studentId).eq("section", section);
  const position = (existing || []).reduce((m, r) => Math.max(m, r.position), -1) + 1;
  return supabase.from("portfolio_items")
    .insert({ student_id: studentId, section, name, type, storage_path, position });
}

export const renameItem = (id, name) => supabase.from("portfolio_items").update({ name }).eq("id", id);
export const deleteItem = (id) => supabase.from("portfolio_items").delete().eq("id", id);

export async function swapItems(a, b) {
  await supabase.from("portfolio_items").update({ position: b.position }).eq("id", a.id);
  await supabase.from("portfolio_items").update({ position: a.position }).eq("id", b.id);
}

export async function signedUrl(path, expires = 3600) {
  if (!path) return null;
  const { data } = await supabase.storage.from("portfolio").createSignedUrl(path, expires);
  return data?.signedUrl || null;
}

/* ---------------- feedback ---------------- */
export async function listFeedback(studentId) {
  const { data: fb, error } = await supabase
    .from("feedback").select("*").eq("student_id", studentId).order("created_at", { ascending: false });
  if (error) throw error;
  const ids = (fb || []).map((f) => f.id);
  const { data: replies } = ids.length
    ? await supabase.from("feedback_replies").select("*").in("feedback_id", ids).order("created_at")
    : { data: [] };
  const authorIds = [...new Set([...(fb || []).map((f) => f.author_id), ...(replies || []).map((r) => r.author_id)])];
  const { data: authors } = authorIds.length
    ? await supabase.from("profiles").select("id, full_name, role").in("id", authorIds)
    : { data: [] };
  const info = Object.fromEntries((authors || []).map((a) => [a.id, a]));
  const nameOf = (id, fallback) => info[id]?.full_name || fallback;
  return (fb || []).map((f) => ({
    ...f,
    author: nameOf(f.author_id, "Mentor"),
    author_role: info[f.author_id]?.role,
    replies: (replies || []).filter((r) => r.feedback_id === f.id)
      .map((r) => ({ ...r, author: nameOf(r.author_id, "You") })),
  }));
}

export const addReply = (feedbackId, authorId, body) =>
  supabase.from("feedback_replies").insert({ feedback_id: feedbackId, author_id: authorId, body });

export const resolveFeedback = (id) => supabase.from("feedback").update({ resolved: true }).eq("id", id);

/* ---------------- sharing ---------------- */
export function monthStartISO() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

export async function shareCountThisMonth(studentId) {
  const { count } = await supabase
    .from("share_events").select("*", { count: "exact", head: true })
    .eq("student_id", studentId).gte("created_at", monthStartISO());
  return count || 0;
}

export const logShare = (studentId, sharedBy) =>
  supabase.from("share_events").insert({ student_id: studentId, shared_by: sharedBy, channel: "link" });

/* ---------------- public portfolio (by slug) ---------------- */
export async function getPublicPortfolio(slug) {
  const { data: student } = await supabase
    .from("students").select("id, grade, term, privacy, slug").eq("slug", slug).maybeSingle();
  if (!student) return null;
  const { data: profile } = await supabase
    .from("profiles").select("full_name, avatar_url").eq("id", student.id).maybeSingle();
  const items = await listItems(student.id);
  return { student, name: profile?.full_name || "Student", avatar_url: profile?.avatar_url, items };
}

/* ================= mentor ================= */

// Assigned students with completion %, for the mentor dashboard/table.
export async function listMenteesFull(mentorId) {
  const { data: students, error } = await supabase
    .from("students").select("id, grade, term, status, updated_at, slug").eq("mentor_id", mentorId);
  if (error) throw error;
  const ids = (students || []).map((s) => s.id);
  if (!ids.length) return [];
  const [{ data: profiles }, { data: items }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids),
    supabase.from("portfolio_items").select("student_id, section").in("student_id", ids),
  ]);
  const info = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
  const sections = {};
  (items || []).forEach((it) => { (sections[it.student_id] ||= new Set()).add(it.section); });
  return students.map((s) => ({
    ...s,
    name: info[s.id]?.full_name || "Student",
    avatar_url: info[s.id]?.avatar_url,
    pct: Math.round(((sections[s.id]?.size || 0) / 7) * 100),
  }));
}

export const addFeedback = (studentId, authorId, body) =>
  supabase.from("feedback").insert({ student_id: studentId, author_id: authorId, body });

export async function getStudentForReview(studentId) {
  const { data: student } = await supabase.from("students").select("*").eq("id", studentId).maybeSingle();
  if (!student) return null;
  const { data: profile } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", studentId).maybeSingle();
  const [items, feedback] = await Promise.all([listItems(studentId), listFeedback(studentId)]);
  return { student, name: profile?.full_name || "Student", avatar_url: profile?.avatar_url, items, feedback };
}

export async function feedbackSentThisMonth(authorId) {
  const { count } = await supabase.from("feedback").select("*", { count: "exact", head: true })
    .eq("author_id", authorId).gte("created_at", monthStartISO());
  return count || 0;
}

export async function listFeedbackForStudents(ids) {
  if (!ids.length) return [];
  const { data: fb } = await supabase.from("feedback").select("*").in("student_id", ids).order("created_at", { ascending: false });
  const fids = (fb || []).map((f) => f.id);
  const { data: replies } = fids.length
    ? await supabase.from("feedback_replies").select("*").in("feedback_id", fids).order("created_at")
    : { data: [] };
  const pids = [...new Set([...(fb || []).map((f) => f.author_id), ...(replies || []).map((r) => r.author_id), ...ids])];
  const { data: profs } = pids.length ? await supabase.from("profiles").select("id, full_name").in("id", pids) : { data: [] };
  const nameOf = Object.fromEntries((profs || []).map((p) => [p.id, p.full_name]));
  return (fb || []).map((f) => ({
    ...f,
    studentName: nameOf[f.student_id] || "Student",
    author: nameOf[f.author_id] || "You",
    replies: (replies || []).filter((r) => r.feedback_id === f.id).map((r) => ({ ...r, author: nameOf[r.author_id] || "User" })),
  }));
}

// Recent activity feed (RLS scopes rows to what the caller may see).
export async function listActivity({ limit = 30 } = {}) {
  const { data: ev } = await supabase.from("activity_events").select("*").order("created_at", { ascending: false }).limit(limit);
  const ids = [...new Set([...(ev || []).map((e) => e.actor_id), ...(ev || []).map((e) => e.student_id)].filter(Boolean))];
  const { data: profs } = ids.length ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids) : { data: [] };
  const info = Object.fromEntries((profs || []).map((p) => [p.id, p]));
  return (ev || []).map((e) => ({
    ...e,
    actorName: info[e.actor_id]?.full_name || "Someone",
    actorAvatar: info[e.actor_id]?.avatar_url,
    studentName: info[e.student_id]?.full_name || "a student",
  }));
}

export async function getMentorProfile(userId) {
  const { data } = await supabase.from("mentors").select("*").eq("id", userId).maybeSingle();
  return data;
}
export const updateMentor = (id, patch) => supabase.from("mentors").update(patch).eq("id", id);

/* ================= admin / super-admin ================= */

export async function listAllStudents() {
  const { data: students, error } = await supabase.from("students").select("*");
  if (error) throw error;
  const ids = (students || []).map((s) => s.id);
  if (!ids.length) return [];
  const mentorIds = [...new Set(students.map((s) => s.mentor_id).filter(Boolean))];
  const lookupIds = [...new Set([...ids, ...mentorIds])];
  const [{ data: profiles }, { data: items }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, avatar_url, is_active").in("id", lookupIds),
    supabase.from("portfolio_items").select("student_id, section").in("student_id", ids),
  ]);
  const info = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
  const sections = {};
  (items || []).forEach((it) => { (sections[it.student_id] ||= new Set()).add(it.section); });
  return students.map((s) => ({
    ...s,
    name: info[s.id]?.full_name || "Student",
    avatar_url: info[s.id]?.avatar_url,
    is_active: info[s.id]?.is_active ?? true,
    mentor_name: s.mentor_id ? (info[s.mentor_id]?.full_name || "Mentor") : null,
    pct: Math.round(((sections[s.id]?.size || 0) / 7) * 100),
  }));
}

export async function listAllMentors() {
  const { data: mentors, error } = await supabase.from("mentors").select("*");
  if (error) throw error;
  const ids = (mentors || []).map((m) => m.id);
  if (!ids.length) return [];
  const [{ data: profiles }, { data: students }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, avatar_url, is_active").in("id", ids),
    supabase.from("students").select("mentor_id"),
  ]);
  const info = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
  const counts = {};
  (students || []).forEach((s) => { if (s.mentor_id) counts[s.mentor_id] = (counts[s.mentor_id] || 0) + 1; });
  return mentors.map((m) => ({
    ...m,
    name: info[m.id]?.full_name || "Mentor",
    avatar_url: info[m.id]?.avatar_url,
    is_active: info[m.id]?.is_active ?? true,
    assigned: counts[m.id] || 0,
  }));
}

export async function listStaff() {
  const { data } = await supabase.from("profiles")
    .select("id, full_name, email, role, is_active, avatar_url")
    .in("role", ["admin", "super_admin"]).order("role");
  return data || [];
}

export const assignMentor = (studentId, mentorId) =>
  supabase.from("students").update({ mentor_id: mentorId || null }).eq("id", studentId);
export const approveStudent = (studentId) =>
  supabase.from("students").update({ status: "approved" }).eq("id", studentId);
export const setActive = (userId, isActive) =>
  supabase.from("profiles").update({ is_active: isActive }).eq("id", userId);

// Calls the guarded Edge Function. Returns { tempPassword, userId } or throws.
export async function createAccount({ email, full_name, role, title, focus }) {
  const { data, error } = await supabase.functions.invoke("admin-create-user", {
    body: { email, full_name, role, title, focus },
  });
  if (error) {
    // Edge function returns a JSON error body; surface its message when present.
    let msg = error.message;
    try { const j = await error.context?.json?.(); if (j?.error) msg = j.error; } catch { /* ignore */ }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}
