// Future Gate USA — guarded account creation.
//
// Creates a student / mentor / admin account and returns a one-time temporary
// password. Enforces the role hierarchy on the SERVER (never trust the browser):
//   * super_admin  -> may create admin, mentor, student
//   * admin        -> may create mentor, student
//   * anyone else  -> rejected
// super_admin accounts are never created here (bootstrap them manually).
//
// Deploy: `npx supabase functions deploy admin-create-user`
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

function tempPassword(len = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let out = "";
  for (const b of bytes) out += chars[b % chars.length];
  return out + "1!"; // guarantee a digit + symbol for password policies
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  // 1) Identify the caller from their bearer token.
  const authHeader = req.headers.get("Authorization") || "";
  const asCaller = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userErr } = await asCaller.auth.getUser();
  if (userErr || !user) return json({ error: "Not authenticated" }, 401);

  // 2) Look up the caller's role with the service client.
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: me } = await admin.from("profiles").select("role, is_active").eq("id", user.id).maybeSingle();
  if (!me || me.is_active === false) return json({ error: "Not authorized" }, 403);
  const callerRole = me.role;
  if (callerRole !== "admin" && callerRole !== "super_admin")
    return json({ error: "Not authorized" }, 403);

  // 3) Validate the request + enforce the hierarchy.
  let body: { email?: string; full_name?: string; role?: string; title?: string; focus?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid request body" }, 400); }
  const email = (body.email || "").trim().toLowerCase();
  const full_name = (body.full_name || "").trim();
  const role = body.role || "student";
  if (!email || !full_name) return json({ error: "Name and email are required." }, 400);
  if (!["student", "mentor", "admin"].includes(role)) return json({ error: "Invalid role." }, 400);
  if (role === "admin" && callerRole !== "super_admin")
    return json({ error: "Only a super admin can create admins." }, 403);

  // 4) Create the account (auto-confirmed) with the role in app_metadata so the
  //    DB trigger provisions the right profile + role-specific row.
  const password = tempPassword();
  const user_metadata: Record<string, string> = { full_name };
  if (role === "mentor") {
    user_metadata.title = body.title?.trim() || "Admissions Mentor";
    if (body.focus?.trim()) user_metadata.focus = body.focus.trim();
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
    user_metadata,
  });
  if (createErr) return json({ error: createErr.message }, 400);

  const newId = created.user?.id;
  if (!newId) return json({ error: "Account created but no user id was returned." }, 500);

  // 5) Reconcile the profile deterministically.
  //    The on-signup trigger provisions a row from app_metadata, but for
  //    admin-created users that metadata is not reliably visible to the trigger
  //    at INSERT time, so the account can land as the default 'student'. The
  //    service role is authoritative about the role it just created, so we set
  //    it explicitly here rather than depending on trigger timing.
  const { error: roleErr } = await admin
    .from("profiles").update({ role, email, full_name }).eq("id", newId);
  if (roleErr) return json({ error: roleErr.message }, 400);

  if (role === "mentor") {
    await admin.from("mentors").upsert(
      { id: newId, title: user_metadata.title || "Admissions Mentor", focus: user_metadata.focus ?? null },
      { onConflict: "id" },
    );
    await admin.from("students").delete().eq("id", newId);   // remove the row the trigger made
  } else if (role === "admin") {
    await admin.from("students").delete().eq("id", newId);
  }
  // role === "student": the trigger already created the student row + slug; leave it.

  return json({ userId: newId, tempPassword: password, role });
});