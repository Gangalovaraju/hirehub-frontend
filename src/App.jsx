import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './store';

// Auth
import { LoginPage, RegisterPage } from './pages/AuthPages';

// Public
import LandingPage from './pages/LandingPage';

// Shared (all roles)
import Profile    from './pages/shared/Profile';
import JobDetail  from './pages/shared/JobDetail';
import Messages   from './pages/shared/Messages';

// Seeker
import SeekerDashboard  from './pages/seeker/SeekerDashboard';
import BrowseJobs       from './pages/seeker/BrowseJobs';
import MyApplications   from './pages/seeker/MyApplications';
import SavedJobs        from './pages/seeker/SavedJobs';
import Recommendations  from './pages/seeker/Recommendations';

// Recruiter
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import CandidateSearch    from './pages/recruiter/CandidateSearch';
import Candidates         from './pages/recruiter/Candidates';
import PostJob            from './pages/recruiter/PostJob';
import RecruiterJobs      from './pages/recruiter/RecruiterJobs';
import Pipeline           from './pages/recruiter/Pipeline';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers     from './pages/admin/AdminUsers';
import AdminJobs      from './pages/admin/AdminJobs';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useSelector((s) => s.auth);
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useSelector((s) => s.auth);

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        {/* ── Public ── */}
        <Route path="/"         element={user
          ? <Navigate to={
              user.role === 'RECRUITER' ? '/recruiter/dashboard' :
              user.role === 'ADMIN'     ? '/admin/dashboard'     :
              '/seeker/dashboard'
            } replace />
          : <LandingPage />
        } />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ── Public job detail (SEO-friendly, redirect to login for apply) ── */}
        <Route path="/jobs/:id" element={<JobDetail />} />

        {/* ── Shared (all logged-in roles) ── */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/messages/:userId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />

        {/* ── Seeker ── */}
        <Route path="/seeker/dashboard" element={
          <ProtectedRoute allowedRoles={['SEEKER']}><SeekerDashboard /></ProtectedRoute>
        } />
        <Route path="/seeker/jobs" element={
          <ProtectedRoute allowedRoles={['SEEKER']}><BrowseJobs /></ProtectedRoute>
        } />
        <Route path="/seeker/applications" element={
          <ProtectedRoute allowedRoles={['SEEKER']}><MyApplications /></ProtectedRoute>
        } />
        <Route path="/seeker/saved" element={
          <ProtectedRoute allowedRoles={['SEEKER']}><SavedJobs /></ProtectedRoute>
        } />
        <Route path="/seeker/recommendations" element={
          <ProtectedRoute allowedRoles={['SEEKER']}><Recommendations /></ProtectedRoute>
        } />
        {/* Legacy aliases */}
        <Route path="/seeker/profile" element={<Navigate to="/profile" replace />} />

        {/* ── Recruiter ── */}
        <Route path="/recruiter/dashboard" element={
          <ProtectedRoute allowedRoles={['RECRUITER']}><RecruiterDashboard /></ProtectedRoute>
        } />
        <Route path="/recruiter/jobs" element={
          <ProtectedRoute allowedRoles={['RECRUITER']}><RecruiterJobs /></ProtectedRoute>
        } />
        <Route path="/recruiter/candidates" element={
          <ProtectedRoute allowedRoles={['RECRUITER']}><Candidates /></ProtectedRoute>
        } />
        <Route path="/recruiter/search" element={
          <ProtectedRoute allowedRoles={['RECRUITER']}><CandidateSearch /></ProtectedRoute>
        } />
        <Route path="/recruiter/pipeline" element={
          <ProtectedRoute allowedRoles={['RECRUITER']}><Pipeline /></ProtectedRoute>
        } />
        <Route path="/recruiter/post-job" element={
          <ProtectedRoute allowedRoles={['RECRUITER']}><PostJob /></ProtectedRoute>
        } />

        {/* ── Admin ── */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['ADMIN']}><AdminUsers /></ProtectedRoute>
        } />
        <Route path="/admin/jobs" element={
          <ProtectedRoute allowedRoles={['ADMIN']}><AdminJobs /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
}