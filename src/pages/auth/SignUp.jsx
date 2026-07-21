import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import AuthLayout from "../../components/auth/AuthLayout.jsx";
import GoogleButton from "../../components/auth/GoogleButton.jsx";
import Button from "../../components/ui/Button.jsx";
import Input, { Field } from "../../components/ui/Input.jsx";

export default function SignUp() {
  const { signUp } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!agree) return setErr("Please accept the terms to continue.");
    setBusy(true);
    const { data, error } = await signUp(email, password);
    setBusy(false);
    if (error) return setErr(error.message);
    // If email confirmation is off, Supabase returns a session immediately and
    // the auth listener signs us in — let the root route handle onboarding.
    if (data?.session) { nav("/", { replace: true }); return; }
    setDone(true);   // confirmation on: prompt to check email
  };

  return (
    <AuthLayout
      panelHeadline="Your future. Your story."
      panelFoot="A secure platform to showcase your achievements, organize your portfolio, and share your journey with schools."
    >
      {done ? (
        <>
          <h1 className="text-3xl font-bold tracking-tight">Check your email</h1>
          <p className="text-muted mt-2">
            We sent a confirmation link to <b className="text-ink">{email}</b>. Confirm your address, then sign in.
          </p>
          <Link to="/login" className="inline-block mt-6 text-sm font-semibold text-brand-600 hover:underline">
            Back to sign in
          </Link>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
          <p className="text-muted mt-1 mb-6">Start building and sharing your student portfolio.</p>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Email address">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                     placeholder="Enter your email address" required />
            </Field>
            <Field label="Password">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                     placeholder="Create a password" minLength={6} required />
            </Field>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)}
                     className="w-4 h-4 accent-brand-600" />
              I agree to the terms of service &amp; privacy policy.
            </label>
            {err && <p className="text-sm text-rose-600">{err}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? "Creating…" : "Create Account"}
            </Button>
          </form>
          <div className="flex items-center gap-3 my-5 text-xs text-muted">
            <span className="h-px bg-hairline flex-1" /> Or continue with <span className="h-px bg-hairline flex-1" />
          </div>
          <GoogleButton />
          <p className="text-center text-sm text-muted mt-6">
            Already have an account? <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
