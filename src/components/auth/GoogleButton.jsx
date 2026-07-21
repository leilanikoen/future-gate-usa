import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";

// Google "G" mark
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.1 14.6 2.2 12 2.2 6.9 2.2 2.8 6.3 2.8 11.4S6.9 20.6 12 20.6c5.9 0 8.8-4.1 8.8-8.3 0-.6 0-1-.1-1.4H12z"/>
    </svg>
  );
}

/**
 * "Continue with Google". Wired to Supabase OAuth. It stays inert until the
 * Google provider is enabled in Supabase (a later setup step); clicking before
 * then surfaces Supabase's "provider not enabled" message rather than crashing.
 */
export default function GoogleButton({ label = "Continue with Google" }) {
  const { signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    const { error } = await signInWithGoogle();
    if (error) { setBusy(false); alert(error.message); }
  };
  return (
    <button
      onClick={go}
      disabled={busy}
      className="w-full inline-flex items-center justify-center gap-2 border border-hairline rounded-xl py-2.5
                 text-sm font-medium bg-white hover:bg-slate-50 disabled:opacity-60"
    >
      <GoogleIcon /> {busy ? "Redirecting…" : label}
    </button>
  );
}
