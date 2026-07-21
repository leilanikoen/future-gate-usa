import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import AuthLayout from "../../components/auth/AuthLayout.jsx";
import GoogleButton from "../../components/auth/GoogleButton.jsx";
import Button from "../../components/ui/Button.jsx";
import Input, { Field } from "../../components/ui/Input.jsx";

export default function Login() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const deactivated = loc.state?.deactivated;

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) return setErr(error.message);
    nav("/", { replace: true });
  };

  return (
    <AuthLayout
      panelEyebrow="You can easily"
      panelHeadline="Create your student portfolio and share it with schools"
      panelFoot="Secure. Private. Built for students and trusted by schools."
    >
      <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
      <p className="text-muted mt-1 mb-6">Access your portfolio, feedback, and progress in one secure place.</p>

      {deactivated && (
        <div className="mb-4 text-sm bg-amber-50 text-amber-800 border border-amber-200 rounded-xl px-3 py-2">
          This account has been deactivated. Contact an administrator if you think this is a mistake.
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <Field label="Email address">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                 placeholder="you@example.com" required />
        </Field>
        <div>
          <Field label="Password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                   placeholder="Enter your password" required />
          </Field>
          <div className="text-right mt-1.5">
            <Link to="/forgot" className="text-sm text-brand-600 hover:underline">Forgot password?</Link>
          </div>
        </div>
        {err && <p className="text-sm text-rose-600">{err}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      <div className="flex items-center gap-3 my-5 text-xs text-muted">
        <span className="h-px bg-hairline flex-1" /> Or continue with <span className="h-px bg-hairline flex-1" />
      </div>
      <GoogleButton />

      <p className="text-center text-sm text-muted mt-6">
        Don’t have an account? <Link to="/signup" className="text-brand-600 font-medium hover:underline">Sign up</Link>
      </p>
    </AuthLayout>
  );
}
