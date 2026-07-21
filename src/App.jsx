import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute, { homeFor } from "./components/ProtectedRoute.jsx";
import { Spinner } from "./components/ui/Feedback.jsx";

import Login from "./pages/auth/Login.jsx";
import SignUp from "./pages/auth/SignUp.jsx";
import Forgot from "./pages/auth/Forgot.jsx";
import Reset from "./pages/auth/Reset.jsx";
import CompleteProfile from "./pages/onboarding/CompleteProfile.jsx";
import Showcase from "./pages/Showcase.jsx";

import StudentLayout from "./pages/student/StudentLayout.jsx";
import Dashboard from "./pages/student/Dashboard.jsx";
import Portfolio from "./pages/student/Portfolio.jsx";
import Feedback from "./pages/student/Feedback.jsx";
import Settings from "./pages/student/Settings.jsx";
import PublicPortfolio from "./pages/public/PublicPortfolio.jsx";

import MentorLayout from "./pages/mentor/MentorLayout.jsx";
import MentorDashboard from "./pages/mentor/Dashboard.jsx";
import MentorStudents from "./pages/mentor/Students.jsx";
import MentorReview from "./pages/mentor/Review.jsx";
import MentorFeedback from "./pages/mentor/Feedback.jsx";
import MentorActivity from "./pages/mentor/Activity.jsx";
import MentorSettings from "./pages/mentor/Settings.jsx";

import AdminLayout from "./pages/admin/AdminLayout.jsx";
import Overview from "./pages/admin/Overview.jsx";
import AdminStudents from "./pages/admin/Students.jsx";
import AdminMentors from "./pages/admin/Mentors.jsx";
import AdminActivity from "./pages/admin/Activity.jsx";

function RootRedirect() {
  const { loading, session, profile } = useAuth();
  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/login" replace />;
  if (profile?.role === "student" && !profile?.onboarded) return <Navigate to="/onboarding" replace />;
  return <Navigate to={homeFor(profile?.role)} replace />;
}

function PublicOnly({ children }) {
  const { loading, session, profile } = useAuth();
  if (loading) return <Spinner />;
  if (session) {
    if (profile?.role === "student" && !profile?.onboarded) return <Navigate to="/onboarding" replace />;
    return <Navigate to={homeFor(profile?.role)} replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      {/* auth */}
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><SignUp /></PublicOnly>} />
      <Route path="/forgot" element={<Forgot />} />
      <Route path="/reset" element={<Reset />} />

      {/* public shareable portfolio */}
      <Route path="/student/:slug" element={<PublicPortfolio />} />

      {/* onboarding */}
      <Route path="/onboarding" element={
        <ProtectedRoute role="student" allowUnonboarded><CompleteProfile /></ProtectedRoute>
      } />

      {/* student workspace */}
      <Route path="/app" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* mentor workspace */}
      <Route path="/mentor" element={<ProtectedRoute role="mentor"><MentorLayout /></ProtectedRoute>}>
        <Route index element={<MentorDashboard />} />
        <Route path="students" element={<MentorStudents />} />
        <Route path="review/:id" element={<MentorReview />} />
        <Route path="feedback" element={<MentorFeedback />} />
        <Route path="activity" element={<MentorActivity />} />
        <Route path="settings" element={<MentorSettings />} />
      </Route>

      {/* admin / super-admin workspace */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Overview />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="mentors" element={<AdminMentors />} />
        <Route path="activity" element={<AdminActivity />} />
      </Route>

      <Route path="/preview" element={<Showcase />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
