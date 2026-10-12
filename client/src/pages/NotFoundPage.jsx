import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>🗺️</div>
      <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', marginBottom: '0.5rem' }}>
        404
      </h1>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '1rem' }}>
        Page Not Found
      </h2>
      <p style={{ color: '#64748b', maxWidth: 420, lineHeight: 1.7, marginBottom: '2.5rem' }}>
        This page doesn't exist or has been moved. Let's get you back to learning.
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '0.75rem 2rem',
            borderRadius: 10,
            border: '2px solid #1e3a8a',
            color: '#1e3a8a',
            fontWeight: 700,
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '0.95rem',
          }}
        >
          ← Go Back
        </button>
        <Link to="/" style={{
          padding: '0.75rem 2rem',
          borderRadius: 10,
          background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.95rem',
          textDecoration: 'none',
          boxShadow: '0 4px 12px rgba(30,58,138,0.3)',
        }}>
          Go Home →
        </Link>
      </div>
    </div>
  );
}
