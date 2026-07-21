import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null); // full profiles row
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) { setProfile(null); return; }
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    setProfile(data || null);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadProfile(data.session?.user?.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      await loadProfile(s?.user?.id);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [loadProfile]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });

  const signUp = (email, password) =>
    supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${origin}/login` } });

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: origin } });

  const resetPassword = (email) =>
    supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/reset` });

  const updatePassword = (password) => supabase.auth.updateUser({ password });

  const signOut = () => supabase.auth.signOut();

  const value = {
    session,
    user: session?.user || null,
    profile,
    role: profile?.role || null,
    loading,
    signIn, signUp, signInWithGoogle, resetPassword, updatePassword, signOut,
    refreshProfile: () => loadProfile(session?.user?.id),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
