import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import AuthLayout from "../../components/auth/AuthLayout.jsx";
import Button from "../../components/ui/Button.jsx";
import Input, { Field } from "../../components/ui/Input.jsx";

export default function Forgot() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    await resetPassword(email);
    setBusy(false);
    setSent(true);
  };

  return (
    <AuthLayout panelHeadline="Reset your password" panelFoot="We’ll email you a secure link to set a new one.">
      <h1 className="text-3xl font-bold tracking-tight">Reset your password</h1>
      {sent ? (
        <p className="text-muted mt-3">
          If an account exists for <b className="text-ink">{email}</b>, a reset link is on its way.
        </p>
      ) : (
        <>
          <p className="text-muted mt-1 mb-6">Enter your email and we’ll send a reset link.</p>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Email address">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                     placeholder="you@example.com" required />
            </Field>
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </>
      )}
      <Link to="/login" className="inline-block mt-6 text-sm font-medium text-muted hover:text-brand-600">
        ← Back to sign in
      </Link>
    </AuthLayout>
  );
}
