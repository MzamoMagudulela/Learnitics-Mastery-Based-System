import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RequireAuth, RequireRole, ROLE_HOME } from './components/common/ProtectedRoute';

// Eagerly loaded: Auth + Dashboards + Core Views (Zero chunk-fetch failure risk)
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';
import OfflineBanner from './components/common/OfflineBanner';
import DashboardPage from './pages/DashboardPage';
import TeacherDashboard from './components/dashboard/TeacherDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';
import CoursesPage from './pages/CoursesPage';

// Lazily loaded: Auxiliary secondary views
const CourseOverviewPage = lazy(() => import('./pages/CourseOverviewPage'));
const LessonPage = lazy(() => import('./pages/LessonPage'));
const AssessmentPage = lazy(() => import('./pages/AssessmentPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const MasteryMapPage = lazy(() => import('./pages/MasteryMapPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Error Boundary to prevent any blank page on rendering hiccups
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Learnitics UI error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
          background: '#f8fafc',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ color: '#0f172a', fontWeight: 800, marginBottom: '0.5rem' }}>
            We encountered an unexpected display issue
          </h2>
          <p style={{ color: '#64748b', maxWidth: 480, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {this.state.error?.message || 'A runtime error occurred.'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => {
                localStorage.removeItem('learnitics_token');
                localStorage.removeItem('learnitics_user');
                window.location.href = '/login';
              }}
              style={{
                background: '#1e3a8a',
                color: '#fff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: 8,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Re-Login
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                padding: '0.75rem 1.5rem',
                borderRadius: 8,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Loading fallback
const PageLoader = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8fafc',
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 48,
        height: 48,
        border: '4px solid #e2e8f0',
        borderTopColor: '#1e3a8a',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        margin: '0 auto 1rem',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Loading…</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <OfflineBanner />
          <Suspense fallback={<PageLoader />}>
            <Routes>
            {/* ======= PUBLIC ROUTES ======= */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* ======= STUDENT ROUTES ======= */}
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <RequireRole roles={['student', 'teacher', 'admin']}>
                    <DashboardPage />
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/courses"
              element={
                <RequireAuth>
                  <CoursesPage />
                </RequireAuth>
              }
            />
            <Route
              path="/courses/:id"
              element={
                <RequireAuth>
                  <CourseOverviewPage />
                </RequireAuth>
              }
            />
            <Route
              path="/lessons/:id"
              element={
                <RequireAuth>
                  <RequireRole roles={['student', 'teacher', 'admin']}>
                    <LessonPage />
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/quiz/:id"
              element={
                <RequireAuth>
                  <RequireRole roles={['student', 'teacher', 'admin']}>
                    <AssessmentPage />
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/mastery-map"
              element={
                <RequireAuth>
                  <RequireRole roles={['student']}>
                    <MasteryMapPage />
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/achievements"
              element={
                <RequireAuth>
                  <MasteryMapPage />
                </RequireAuth>
              }
            />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <ProfilePage />
                </RequireAuth>
              }
            />

            {/* ======= TEACHER ROUTES ======= */}
            <Route
              path="/teacher"
              element={
                <RequireAuth>
                  <RequireRole roles={['teacher', 'admin']}>
                    <TeacherDashboard />
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/teacher/analytics/:courseId"
              element={
                <RequireAuth>
                  <RequireRole roles={['teacher', 'admin']}>
                    <AnalyticsPage />
                  </RequireRole>
                </RequireAuth>
              }
            />

            {/* ======= ADMIN ROUTES ======= */}
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <RequireRole roles={['admin']}>
                    <AdminDashboard />
                  </RequireRole>
                </RequireAuth>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <RequireAuth>
                  <RequireRole roles={['admin']}>
                    <AnalyticsPage adminView />
                  </RequireRole>
                </RequireAuth>
              }
            />

            {/* 404 Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
