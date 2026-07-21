import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import AuthLayout from "../../components/auth/AuthLayout.jsx";
import Button from "../../components/ui/Button.jsx";
import Input, { Field } from "../../components/ui/Input.jsx";

export default function Reset() {
  const { updatePassword } = useAuth();
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    const { error } = await updatePassword(password);
    setBusy(false);
    if (error) return setErr(error.message);
    nav("/", { replace: true });
  };

  return (
    <AuthLayout panelHeadline="Set a new password" panelFoot="Choose something you’ll remember.">
      <h1 className="text-3xl font-bold tracking-tight">Set a new password</h1>
      <p className="text-muted mt-1 mb-6">Enter a new password for your account.</p>
      <form onSubmit={submit} className="space-y-4">
        <Field label="New password">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                 placeholder="New password" minLength={6} required />
        </Field>
        {err && <p className="text-sm text-rose-600">{err}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Saving…" : "Update password"}
        </Button>
      </form>
    </AuthLayout>
  );
}
