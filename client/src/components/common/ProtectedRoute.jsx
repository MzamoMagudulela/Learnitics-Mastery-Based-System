import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/* ------------------------------------------------------------------
 * ROLE-BASED REDIRECT MAP
 * After successful login, redirect each role to their home dashboard
 * ------------------------------------------------------------------ */
export const ROLE_HOME = {
  student: '/dashboard',
  teacher: '/teacher',
  admin: '/admin',
};

/* ------------------------------------------------------------------
 * RequireAuth
 * Redirects unauthenticated users to /login, preserving attempted URL
 * ------------------------------------------------------------------ */
export const RequireAuth = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Check localStorage token synchronously to prevent race condition when navigating immediately upon login
  const token = typeof window !== 'undefined' ? localStorage.getItem('learnitics_token') : null;
  const authed = isAuthenticated || !!token;

  if (loading && !authed) {
    return (
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
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Loading Learnitics…</p>
        </div>
      </div>
    );
  }

  if (!authed) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

/* ------------------------------------------------------------------
 * RequireRole
 * Redirects authenticated users who lack the required role(s)
 * ------------------------------------------------------------------ */
export const RequireRole = ({ children, roles }) => {
  const { role: contextRole, isAuthenticated } = useAuth();
  const token = typeof window !== 'undefined' ? localStorage.getItem('learnitics_token') : null;
  const authed = isAuthenticated || !!token;

  if (!authed) {
    return <Navigate to="/login" replace />;
  }

  let effectiveRole = contextRole;
  if (!effectiveRole && typeof window !== 'undefined') {
    try {
      const savedUser = JSON.parse(localStorage.getItem('learnitics_user') || '{}');
      effectiveRole = savedUser?.role || null;
    } catch {
      effectiveRole = null;
    }
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  if (!effectiveRole || !allowedRoles.includes(effectiveRole)) {
    // Redirect to their own role home instead of 403
    const fallback = (effectiveRole && ROLE_HOME[effectiveRole]) || '/';
    return <Navigate to={fallback} replace />;
  }

  return children;
};
