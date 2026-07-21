import { useState } from "react";
import { Check } from "lucide-react";
import { createAccount } from "../../lib/db.js";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Input, { Field } from "../../components/ui/Input.jsx";
import { cn } from "../../lib/cn.js";

/**
 * Inline "create account" form.
 * baseRole: "student" | "mentor" (the default this form creates)
 * allowAdmin: when true (super-admin, on the mentors page), adds a Mentor/Admin toggle
 */
export default function CreateAccountForm({ baseRole, allowAdmin = false, onCreated }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("Admissions Mentor");
  const [focus, setFocus] = useState("");
  const [role, setRole] = useState(baseRole);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null); // { tempPassword }

  const noun = role === "admin" ? "admin" : role === "mentor" ? "mentor" : "student";

  const submit = async () => {
    setErr(""); setResult(null);
    if (!name.trim() || !email.trim()) return setErr("Please enter a name and email.");
    setBusy(true);
    try {
      const res = await createAccount({
        email: email.trim(), full_name: name.trim(), role,
        ...(role === "mentor" ? { title: title.trim(), focus: focus.trim() } : {}),
      });
      setResult(res);
      setName(""); setEmail(""); setFocus("");
      onCreated?.();
    } catch (e) {
      setErr(e.message || "Could not create the account.");
    } finally { setBusy(false); }
  };

  return (
    <Card className="p-5 mb-5">
      {allowAdmin && (
        <div className="inline-flex bg-white border border-hairline rounded-xl p-1 mb-4">
          {["mentor", "admin"].map((r) => (
            <button key={r} onClick={() => setRole(r)}
              className={cn("px-4 py-1.5 rounded-lg text-sm font-medium capitalize",
                role === r ? "bg-brand-600 text-white" : "text-muted hover:text-ink")}>
              {r === "admin" ? "Admin" : "Mentor"}
            </button>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Full name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder={`${noun[0].toUpperCase()}${noun.slice(1)} name`} /></Field>
        <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={`${noun}@example.com`} /></Field>
      </div>

      {role === "mentor" && (
        <div className="grid sm:grid-cols-2 gap-4 mt-4">
          <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Admissions Mentor" /></Field>
          <Field label="Focus area"><Input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. Essays & interviews" /></Field>
        </div>
      )}

      {err && <p className="text-sm text-rose-600 mt-3">{err}</p>}

      {result && (
        <div className="mt-4 flex items-start gap-2 text-sm bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl px-3 py-2.5">
          <Check className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            Created. Temporary password: <b className="font-mono">{result.tempPassword}</b> — share it once, or they can
            use “Forgot password”. <span className="opacity-70">(Shown only now.)</span>
          </span>
        </div>
      )}

      <div className="flex justify-end mt-4">
        <Button onClick={submit} disabled={busy}>{busy ? "Creating…" : `Create ${noun}`}</Button>
      </div>
    </Card>
  );
}
