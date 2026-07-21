import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Spinner } from "./ui/Feedback.jsx";

export const homeFor = (role) =>
  role === "admin" || role === "super_admin" ? "/admin"
  : role === "mentor" ? "/mentor"
  : "/app";

/**
 * Wrap a route to require a signed-in user.
 * - role:      restrict to a role bucket ("student" | "mentor" | "admin")
 *              ("admin" also admits super_admin)
 * - allowUnonboarded: let the onboarding route through even if not onboarded
 */
export default function ProtectedRoute({ role, allowUnonboarded = false, children }) {
  const { session, profile, loading, signOut } = useAuth();
  const loc = useLocation();

  // A deactivated account is signed out immediately.
  useEffect(() => {
    if (!loading && profile && profile.is_active === false) signOut();
  }, [loading, profile, signOut]);

  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (profile && profile.is_active === false)
    return <Navigate to="/login" replace state={{ deactivated: true }} />;

  // Students must finish onboarding before entering their workspace.
  if (profile && profile.role === "student" && !profile.onboarded && !allowUnonboarded)
    return <Navigate to="/onboarding" replace />;

  if (role && profile) {
    const bucket = profile.role === "super_admin" ? "admin" : profile.role;
    if (bucket !== role) return <Navigate to={homeFor(profile.role)} replace />;
  }

  return children;
}
