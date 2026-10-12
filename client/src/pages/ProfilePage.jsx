import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { currentUser } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', background: '#fff', padding: '2rem', borderRadius: 16, border: '1px solid #e2e8f0' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
          👤 User Profile
        </h1>
        <div style={{ marginBottom: '1.5rem', lineHeight: '2' }}>
          <div><strong>Name:</strong> {currentUser?.name}</div>
          <div><strong>Email:</strong> {currentUser?.email}</div>
          <div><strong>Role:</strong> {currentUser?.role}</div>
        </div>
        <Link to="/dashboard" style={{ color: '#1e3a8a', fontWeight: 600, textDecoration: 'none' }}>
          ← Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
