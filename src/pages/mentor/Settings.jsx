import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { supabase } from "../../lib/supabase.js";
import { getMentorProfile, updateMentor, updateProfileFields } from "../../lib/db.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Input, { Field } from "../../components/ui/Input.jsx";

export default function MentorSettings() {
  const { user, profile, refreshProfile } = useAuth();
  const [f, setF] = useState({ name: profile?.full_name || "", title: "", focus: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(profile?.avatar_url || null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    getMentorProfile(user.id).then((m) => { if (m) setF((s) => ({ ...s, title: m.title || "", focus: m.focus || "" })); });
  }, [user.id]);

  const pickAvatar = (e) => { const file = e.target.files?.[0]; if (!file) return; setAvatarFile(file); setPreview(URL.createObjectURL(file)); };

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
      const pPatch = { full_name: f.name.trim() };
      if (avatar_url) pPatch.avatar_url = avatar_url;
      const { error: e1 } = await updateProfileFields(user.id, pPatch);
      if (e1) throw e1;
      const { error: e2 } = await updateMentor(user.id, { title: f.title.trim() || "Admissions Mentor", focus: f.focus.trim() || null });
      if (e2) throw e2;
      await refreshProfile();
      setSaved(true); setTimeout(() => setSaved(false), 1800);
    } catch (e) { alert("Could not save: " + e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <p className="text-muted mt-1 mb-6">Manage your mentor profile.</p>
      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-4">
          <Avatar name={f.name} src={preview} size="lg" />
          <label>
            <input type="file" accept="image/*" className="hidden" onChange={pickAvatar} />
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl px-4 py-2.5 cursor-pointer">
              <Upload className="w-4 h-4" /> Upload photo
            </span>
          </label>
        </div>
        <Field label="Full name"><Input value={f.name} onChange={set("name")} placeholder="Your name" /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Title"><Input value={f.title} onChange={set("title")} placeholder="Admissions Mentor" /></Field>
          <Field label="Focus area"><Input value={f.focus} onChange={set("focus")} placeholder="e.g. Essays & interviews" /></Field>
        </div>
        <div className="flex justify-end">
          <Button onClick={save} disabled={busy}>{saved ? "Saved ✓" : busy ? "Saving…" : "Save changes"}</Button>
        </div>
      </Card>
    </div>
  );
}
