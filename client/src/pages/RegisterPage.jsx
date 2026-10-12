import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../components/common/ProtectedRoute';

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

const FIELDS = [
  { name: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Jane Doe', autoComplete: 'name' },
  { name: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com', autoComplete: 'email' },
  { name: 'password', label: 'Password', type: 'password', placeholder: 'Min. 8 characters', autoComplete: 'new-password' },
  { name: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: 'Repeat your password', autoComplete: 'new-password' },
];

const inputStyle = {
  width: '100%',
  padding: '0.8rem 1rem',
  borderRadius: 10,
  border: '1.5px solid #d1d5db',
  fontSize: '0.95rem',
  color: '#0f172a',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fafafa',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
    if (serverError) setServerError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required.';
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim() || !emailRe.test(form.email.trim())) {
      newErrors.email = 'A valid email address is required.';
    }
    if (!form.password || form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setServerError('');

    const result = await register({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
    });

    setLoading(false);

    if (result.success) {
      const destination = ROLE_HOME[result.user.role] || '/dashboard';
      navigate(destination, { replace: true });
    } else {
      setServerError(result.message || 'Registration failed. Please try again.');
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
    }}>
      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 440,
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
          Create an Account
        </h1>
        <p style={{ color: '#64748b', textAlign: 'center', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Join thousands of mastery-driven learners
        </p>

        {/* Server Error Banner */}
        {serverError && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 10,
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            color: '#b91c1c',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
          }}>
            <span>⚠️</span> {serverError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {FIELDS.map((field) => (
            <div key={field.name} style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem',
              }}>
                {field.label}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={
                    field.type === 'password'
                      ? (showPasswords ? 'text' : 'password')
                      : field.type
                  }
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  autoComplete={field.autoComplete}
                  style={{
                    ...inputStyle,
                    borderColor: errors[field.name] ? '#f87171' : '#d1d5db',
                    paddingRight: field.type === 'password' ? '2.75rem' : '1rem',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = errors[field.name] ? '#f87171' : '#1e3a8a';
                    e.target.style.boxShadow = `0 0 0 3px rgba(${errors[field.name] ? '248,113,113' : '30,58,138'},0.1)`;
                    e.target.style.background = '#fff';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors[field.name] ? '#f87171' : '#d1d5db';
                    e.target.style.boxShadow = 'none';
                    e.target.style.background = '#fafafa';
                  }}
                />
                {/* Password visibility toggle on first password field */}
                {field.name === 'password' && (
                  <button
                    type="button"
                    onClick={() => setShowPasswords((s) => !s)}
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
                    {showPasswords ? '🙈' : '👁️'}
                  </button>
                )}
              </div>
              {errors[field.name] && (
                <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                  {errors[field.name]}
                </p>
              )}
            </div>
          ))}

          {/* Terms notice */}
          <p style={{ color: '#94a3b8', fontSize: '0.78rem', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            By signing up, you agree to our{' '}
            <a href="#terms" style={{ color: '#1e3a8a', fontWeight: 600 }}>Terms of Service</a>
            {' '}and{' '}
            <a href="#privacy" style={{ color: '#1e3a8a', fontWeight: 600 }}>Privacy Policy</a>.
          </p>

          {/* Sign Up Button */}
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
              transition: 'transform 0.15s',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
            }}
          >
            {loading ? '⏳ Creating Account…' : 'Sign Up Free →'}
          </button>
        </form>

        {/* Divider + Login Link */}
        <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
          <Link to="/login" style={{
            display: 'block',
            padding: '0.8rem',
            borderRadius: 12,
            border: '2px solid #1e3a8a',
            color: '#1e3a8a',
            fontWeight: 700,
            fontSize: '0.95rem',
            textDecoration: 'none',
            transition: 'background 0.2s',
          }}
            onMouseEnter={(e) => (e.target.style.background = '#eff6ff')}
            onMouseLeave={(e) => (e.target.style.background = 'transparent')}
          >
            Already have an account? Log In
          </Link>
        </div>
      </div>

      {/* Back to home */}
      <Link to="/" style={{
        marginTop: '1.5rem',
        color: '#64748b',
        fontSize: '0.875rem',
        textDecoration: 'none',
      }}>
        ← Back to Learnitics
      </Link>
    </div>
  );
}
