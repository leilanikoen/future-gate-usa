import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Upload } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { supabase } from "../../lib/supabase.js";
import { updateStudent, updateProfileFields } from "../../lib/db.js";
import { GRADES, PRIVACY } from "../../lib/constants.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Input, { Field } from "../../components/ui/Input.jsx";
import { cn } from "../../lib/cn.js";

export default function Settings() {
  const { user, refreshProfile } = useAuth();
  const { student, profile, reload } = useOutletContext();
  const [f, setF] = useState({
    first: profile?.first_name || "",
    last: profile?.last_name || "",
    dob: profile?.dob || "",
    gender: profile?.gender || "",
    nationality: profile?.nationality || "",
    city: profile?.city || "",
    grade: student?.grade || "",
    school: student?.current_school || "",
    privacy: student?.privacy || "Private",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(profile?.avatar_url || null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const pickAvatar = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setAvatarFile(file); setPreview(URL.createObjectURL(file));
  };

  const save = async () => {
    setBusy(true);
    try {
      let avatar_url;
      if (avatarFile) {
        const safe = avatarFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${user.id}/${Date.now()}_${safe}`;
        const { error } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
        if (error) throw error;
        avatar_url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }
      const profilePatch = {
        first_name: f.first.trim(), last_name: f.last.trim(),
        full_name: `${f.first.trim()} ${f.last.trim()}`.trim(),
        dob: f.dob || null, gender: f.gender || null,
        nationality: f.nationality || null, city: f.city || null,
      };
      if (avatar_url) profilePatch.avatar_url = avatar_url;
      const { error: pErr } = await updateProfileFields(user.id, profilePatch);
      if (pErr) throw pErr;
      const { error: sErr } = await updateStudent(student.id, {
        grade: f.grade || null, current_school: f.school || null, privacy: f.privacy,
      });
      if (sErr) throw sErr;
      await refreshProfile(); await reload();
      setSaved(true); setTimeout(() => setSaved(false), 1800);
    } catch (e) {
      alert("Could not save: " + e.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <p className="text-muted mt-1 mb-6">Manage your details and control who can open your portfolio.</p>

      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-4">
          <Avatar name={f.first || profile?.full_name} src={preview} size="lg" />
          <div>
            <label>
              <input type="file" accept="image/*" className="hidden" onChange={pickAvatar} />
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl px-4 py-2.5 cursor-pointer">
                <Upload className="w-4 h-4" /> Upload photo
              </span>
            </label>
            <div className="text-xs text-muted mt-1.5">Drag &amp; drop or browse</div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="First name"><Input value={f.first} onChange={set("first")} placeholder="Enter first name" /></Field>
          <Field label="Last name"><Input value={f.last} onChange={set("last")} placeholder="Enter last name" /></Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Email address"><Input value={user?.email || ""} disabled className="bg-slate-50 text-muted" /></Field>
          <Field label="Date of birth"><Input type="date" value={f.dob || ""} onChange={set("dob")} /></Field>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Gender">
            <select value={f.gender} onChange={set("gender")}
              className="w-full bg-white border border-hairline rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100">
              <option value="">Select</option><option value="male">Male</option><option value="female">Female</option>
            </select>
          </Field>
          <Field label="Nationality"><Input value={f.nationality} onChange={set("nationality")} placeholder="e.g. Canada" /></Field>
          <Field label="City"><Input value={f.city} onChange={set("city")} placeholder="e.g. Toronto" /></Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Current grade">
            <select value={f.grade} onChange={set("grade")}
              className="w-full bg-white border border-hairline rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100">
              <option value="">Select grade</option>
              {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          </Field>
          <Field label="Current school"><Input value={f.school} onChange={set("school")} placeholder="Current school name" /></Field>
        </div>

        <div>
          <div className="text-sm font-medium text-ink mb-1.5">Portfolio address</div>
          <div className="flex items-center bg-slate-50 border border-hairline rounded-xl px-3 py-2.5 text-sm text-muted">
            {window.location.host}/student/<span className="text-ink font-medium">{student?.slug}</span>
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-ink mb-1.5">Privacy</div>
          <div className="grid grid-cols-3 gap-2">
            {PRIVACY.map((p) => (
              <button key={p} type="button" onClick={() => setF({ ...f, privacy: p })}
                className={cn("text-sm rounded-xl border py-2.5",
                  f.privacy === p ? "border-brand-500 bg-brand-50 text-brand-700 font-semibold" : "border-hairline text-muted hover:bg-slate-50")}>
                {p}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted mt-2">
            {f.privacy === "Public" && "Anyone with the link can view your portfolio."}
            {f.privacy === "School-only" && "Only people you share the link with can view it."}
            {f.privacy === "Private" && "Your public page is hidden from everyone."}
          </p>
        </div>

        <div className="flex justify-end pt-1">
          <Button onClick={save} disabled={busy}>{saved ? "Saved ✓" : busy ? "Saving…" : "Save & Continue"}</Button>
        </div>
      </Card>
    </div>
  );
}
