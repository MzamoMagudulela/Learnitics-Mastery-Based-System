import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../components/common/ProtectedRoute';
import api from '../services/api';

const LearnIcon = () => (
  <div style={{
    width: 52, height: 52, borderRadius: 14,
    background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 26, color: '#fff', fontWeight: 900,
    boxShadow: '0 6px 20px rgba(30,58,138,0.35)',
    margin: '0 auto',
  }}>L</div>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyCredentials, completeLogin } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Security Verification Step State (for teacher & admin)
  const [securityStep, setSecurityStep] = useState({
    active: false,
    role: null,
    authData: null,
  });
  const [secAnswers, setSecAnswers] = useState({ phrase: '', code: '' });
  const [secError, setSecError] = useState('');

  // Forgot Password State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1: verify email, 2: set new password
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [inactivePopupMessage, setInactivePopupMessage] = useState(''); // Pop-up alert when email not active

  const from = location.state?.from?.pathname;

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  // 1. Initial Login Credential Verification
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await verifyCredentials(form.email.trim(), form.password);
    setLoading(false);

    if (!result.success) {
      setError(result.message || 'Invalid email or password.');
      return;
    }

    const authUser = result.data.user;

    // Teacher or Admin requires 2-Factor Security Questions Verification
    if (authUser.role === 'teacher' || authUser.role === 'admin') {
      setSecurityStep({
        active: true,
        role: authUser.role,
        authData: result.data,
      });
      setSecAnswers({ phrase: '', code: '' });
      setSecError('');
    } else {
      // Student logs in directly
      completeLogin(result.data);
      let destination = '/dashboard';
      if (from && !['/teacher', '/admin', '/dashboard', '/login'].includes(from)) {
        destination = from;
      }
      window.location.href = destination;
    }
  };

  // 2. Security Questions Verification Handler
  const handleSecuritySubmit = (e) => {
    e.preventDefault();
    setSecError('');

    const cleanPhrase = secAnswers.phrase.trim().toLowerCase();
    const cleanCode = secAnswers.code.trim();

    if (securityStep.role === 'teacher') {
      // Teacher questions:
      // Q1: What unique verification phrase did you create specifically for teacher login verification? -> 'spu'
      // Q2: What unique digital code did you create for your login? -> '2026'
      if (cleanPhrase === 'spu' && cleanCode === '2026') {
        completeLogin(securityStep.authData);
        window.location.href = '/teacher';
      } else {
        setSecError('Incorrect answers to security questions. Verification failed.');
      }
    } else if (securityStep.role === 'admin') {
      // Admin questions:
      // Q1: What unique verification phrase did you create specifically for teacher login verification? -> 'SPU'
      // Q2: What unique digital code did you create for your login? -> '2025'
      if (cleanPhrase === 'spu' && cleanCode === '2025') {
        completeLogin(securityStep.authData);
        window.location.href = '/admin';
      } else {
        setSecError('Incorrect answers to security questions. Verification failed.');
      }
    }
  };

  // 3. Forgot Password Email Verification
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setInactivePopupMessage('');

    try {
      const res = await api.post('/auth/forgot-password/verify', {
        email: forgotEmail.trim(),
      });
      if (res.data.success && res.data.isActive) {
        setForgotStep(2);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Your email is not active on this system.';
      // Trigger user-specified popup message
      setInactivePopupMessage(msg);
      setForgotError(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  // 4. Forgot Password New Password Submission
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotError('Password must be at least 6 characters long.');
      return;
    }

    setForgotLoading(true);
    setForgotError('');

    try {
      const res = await api.post('/auth/forgot-password/reset', {
        email: forgotEmail.trim(),
        newPassword: forgotNewPassword,
        confirmPassword: forgotConfirmPassword,
      });

      if (res.data.success) {
        setForgotSuccess('Password changed successfully! You can now log in.');
        setTimeout(() => {
          setForgotModalOpen(false);
          setForgotStep(1);
          setForgotNewPassword('');
          setForgotConfirmPassword('');
          setForgotSuccess('');
          setForm((prev) => ({ ...prev, email: forgotEmail.trim() }));
        }, 1800);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password.';
      setForgotError(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 50%, #e0f2fe 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      position: 'relative',
    }}>
      {/* =========================================================================
          SECURITY QUESTIONS VERIFICATION CARD (for Teacher & Admin)
          ========================================================================= */}
      {securityStep.active ? (
        <div style={{
          width: '100%',
          maxWidth: 480,
          background: '#ffffff',
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 60px rgba(30,58,138,0.12), 0 4px 16px rgba(0,0,0,0.06)',
          padding: '2.5rem',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: 54, height: 54, borderRadius: 16,
              background: 'linear-gradient(135deg, #1e3a8a, #0284c7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, margin: '0 auto 0.75rem',
            }}>🔐</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
              Security & Encryption Verification
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              Please answer the 2 security questions to verify encrypted access for the{' '}
              <strong style={{ color: '#1e3a8a' }}>
                {securityStep.role === 'admin' ? 'Administrator' : 'Teacher'}
              </strong>{' '}
              portal.
            </p>
          </div>

          {secError && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 10,
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              color: '#b91c1c',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span>⚠️</span> {secError}
            </div>
          )}

          <form onSubmit={handleSecuritySubmit}>
            {/* Question 1 */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#1e293b',
                marginBottom: '0.4rem',
                lineHeight: 1.4,
              }}>
                1. What unique verification phrase did you create specifically for teacher login verification?
              </label>
              <input
                type="text"
                value={secAnswers.phrase}
                onChange={(e) => setSecAnswers({ ...secAnswers, phrase: e.target.value })}
                placeholder="Enter verification phrase"
                required
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: 10,
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.95rem',
                  color: '#0f172a',
                  boxSizing: 'border-box',
                  background: '#fafafa',
                  outline: 'none',
                }}
              />
            </div>

            {/* Question 2 */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#1e293b',
                marginBottom: '0.4rem',
                lineHeight: 1.4,
              }}>
                2. What unique digital code did you create for your login?
              </label>
              <input
                type="text"
                value={secAnswers.code}
                onChange={(e) => setSecAnswers({ ...secAnswers, code: e.target.value })}
                placeholder="Enter digital code"
                required
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: 10,
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.95rem',
                  color: '#0f172a',
                  boxSizing: 'border-box',
                  background: '#fafafa',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.9rem',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '1rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(30,58,138,0.3)',
                marginBottom: '0.75rem',
              }}
            >
              Verify & Enter Dashboard →
            </button>

            <button
              type="button"
              onClick={() => {
                setSecurityStep({ active: false, role: null, authData: null });
                setSecError('');
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 10,
                background: 'transparent',
                color: '#64748b',
                fontWeight: 600,
                fontSize: '0.9rem',
                border: '1px solid #cbd5e1',
                cursor: 'pointer',
              }}
            >
              Cancel & Return to Login
            </button>
          </form>
        </div>
      ) : (
        /* =========================================================================
            STANDARD LOGIN CARD
            ========================================================================= */
        <div style={{
          width: '100%',
          maxWidth: 420,
          background: '#ffffff',
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 60px rgba(30,58,138,0.1), 0 4px 16px rgba(0,0,0,0.06)',
          padding: '2.75rem 2.5rem',
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <LearnIcon />
            <div style={{ marginTop: '0.75rem', fontWeight: 800, fontSize: '1.25rem', color: '#1e3a8a' }}>
              Learnitics
            </div>
          </div>

          {/* Heading */}
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#0f172a',
            textAlign: 'center',
            marginBottom: '0.4rem',
            letterSpacing: '-0.03em',
          }}>
            Welcome Back
          </h1>
          <p style={{ color: '#64748b', textAlign: 'center', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Sign in to continue your learning journey
          </p>

          {/* Error Banner */}
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 10,
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              color: '#b91c1c',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem',
              }}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderRadius: 10,
                  border: '1.5px solid #d1d5db',
                  fontSize: '0.95rem',
                  color: '#0f172a',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box',
                  background: '#fafafa',
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    padding: '0.8rem 3rem 0.8rem 1rem',
                    borderRadius: 10,
                    border: '1.5px solid #d1d5db',
                    fontSize: '0.95rem',
                    color: '#0f172a',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                    background: '#fafafa',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    color: '#64748b',
                    padding: '0.25rem',
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div style={{ textAlign: 'right', marginBottom: '1.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  setForgotModalOpen(true);
                  setForgotStep(1);
                  setForgotEmail(form.email || '');
                  setForgotError('');
                  setForgotSuccess('');
                  setInactivePopupMessage('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1e3a8a',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.9rem',
                borderRadius: 12,
                background: loading
                  ? '#93c5fd'
                  : 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '1rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 6px 20px rgba(30,58,138,0.35)',
                transition: 'opacity 0.2s, transform 0.15s',
                letterSpacing: '0.02em',
              }}
            >
              {loading ? '⏳ Signing In…' : 'Sign In →'}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            margin: '1.75rem 0',
          }}>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            <span style={{ color: '#9ca3af', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
              New to Learnitics?
            </span>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          </div>

          {/* Sign Up Link */}
          <div style={{ textAlign: 'center' }}>
            <Link to="/register" style={{
              display: 'block',
              padding: '0.8rem',
              borderRadius: 12,
              border: '2px solid #1e3a8a',
              color: '#1e3a8a',
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
            }}>
              Don't have an account? Sign Up
            </Link>
          </div>
        </div>
      )}

      {/* Back to home */}
      <Link to="/" style={{
        marginTop: '1.5rem',
        color: '#64748b',
        fontSize: '0.875rem',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
      }}>
        ← Back to Learnitics
      </Link>

      {/* =========================================================================
          FORGOT PASSWORD MODAL
          ========================================================================= */}
      {forgotModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            maxWidth: 440,
            width: '100%',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative',
          }}>
            <button
              onClick={() => {
                setForgotModalOpen(false);
                setInactivePopupMessage('');
              }}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.25rem',
                cursor: 'pointer',
                color: '#64748b',
              }}
            >
              ✕
            </button>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>
              🔑 Reset Password
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
              {forgotStep === 1
                ? 'Enter your registered email address to check your account status.'
                : 'Create and confirm your new password.'}
            </p>

            {forgotError && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 8,
                padding: '0.75rem',
                marginBottom: '1rem',
                color: '#b91c1c',
                fontSize: '0.85rem',
              }}>
                ⚠️ {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 8,
                padding: '0.75rem',
                marginBottom: '1rem',
                color: '#15803d',
                fontSize: '0.85rem',
              }}>
                ✅ {forgotSuccess}
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleVerifyEmail}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="student@learnitics.com"
                    required
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: 8,
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: 10,
                    background: '#1e3a8a',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    border: 'none',
                    cursor: forgotLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {forgotLoading ? 'Checking…' : 'Verify Email →'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: 8,
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: 8,
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: 10,
                    background: '#16a34a',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    border: 'none',
                    cursor: forgotLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {forgotLoading ? 'Updating…' : 'Change Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          INACTIVE EMAIL POP-UP DIALOG (Requested specific prompt)
          ========================================================= */}
      {inactivePopupMessage && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '1rem',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            padding: '2rem',
            maxWidth: 380,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            borderTop: '4px solid #ef4444',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🚫</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              Account Notice
            </h3>
            <p style={{ color: '#b91c1c', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {inactivePopupMessage}
            </p>
            <button
              onClick={() => setInactivePopupMessage('')}
              style={{
                padding: '0.65rem 1.75rem',
                borderRadius: 8,
                background: '#1e3a8a',
                color: '#ffffff',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              OK, Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
