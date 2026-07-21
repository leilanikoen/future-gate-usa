import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Upload } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { supabase } from "../../lib/supabase.js";
import AuthLayout from "../../components/auth/AuthLayout.jsx";
import Button from "../../components/ui/Button.jsx";
import Input, { Field } from "../../components/ui/Input.jsx";

export default function CompleteProfile() {
  const { user, refreshProfile } = useAuth();
  const nav = useNavigate();
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({ first: "", last: "", dob: "", gender: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const save = async (e) => {
    e.preventDefault();
    setErr("");
    if (!form.first.trim() || !form.last.trim()) return setErr("Please enter your first and last name.");
    setBusy(true);
    try {
      let avatar_url = null;
      if (file) {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${user.id}/${Date.now()}_${safe}`;
        const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        avatar_url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }
      const full_name = `${form.first.trim()} ${form.last.trim()}`;
      const patch = {
        first_name: form.first.trim(),
        last_name: form.last.trim(),
        full_name,
        dob: form.dob || null,
        gender: form.gender || null,
        onboarded: true,
      };
      if (avatar_url) patch.avatar_url = avatar_url;
      const { error: updErr } = await supabase.from("profiles").update(patch).eq("id", user.id);
      if (updErr) throw updErr;
      await refreshProfile();
      nav("/app", { replace: true });
    } catch (e2) {
      setErr(e2.message || "Something went wrong.");
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      panelEyebrow="Almost there"
      panelHeadline="Complete your profile to get started."
      panelFoot="A few details help personalize your portfolio."
    >
      <h1 className="text-3xl font-bold tracking-tight">Complete your profile</h1>
      <p className="text-muted mt-1 mb-6">Add a few details to personalize your account.</p>

      <form onSubmit={save} className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-slate-100 grid place-items-center overflow-hidden">
              {preview
                ? <img src={preview} alt="" className="w-full h-full object-cover" />
                : <Camera className="w-6 h-6 text-slate-400" />}
            </div>
            <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-600 grid place-items-center text-white">
              <Camera className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
            <Button type="button" variant="subtle" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4" /> Upload photo
            </Button>
            <div className="text-xs text-muted mt-1.5">Drag &amp; drop or browse</div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="First name"><Input value={form.first} onChange={set("first")} placeholder="Enter first name" required /></Field>
          <Field label="Last name"><Input value={form.last} onChange={set("last")} placeholder="Enter last name" required /></Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Date of birth"><Input type="date" value={form.dob} onChange={set("dob")} /></Field>
          <Field label="Gender">
            <div className="flex gap-2">
              {["male", "female"].map((g) => (
                <button key={g} type="button" onClick={() => setForm({ ...form, gender: g })}
                  className={`flex-1 capitalize text-sm rounded-xl border py-2.5 ${
                    form.gender === g ? "border-brand-500 bg-brand-50 text-brand-700 font-semibold" : "border-hairline text-muted hover:bg-slate-50"
                  }`}>
                  {g}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {err && <p className="text-sm text-rose-600">{err}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Saving…" : "Save & Continue"}
        </Button>
      </form>
    </AuthLayout>
  );
}
