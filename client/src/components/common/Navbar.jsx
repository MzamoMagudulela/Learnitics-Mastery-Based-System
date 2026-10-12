import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function Navbar({ streakCount = 0 }) {
  const { currentUser, logout, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);

  const navLinks = [
    { label: 'Dashboard', path: role === 'teacher' ? '/teacher' : role === 'admin' ? '/admin' : '/dashboard' },
    { label: 'Courses', path: '/courses' },
    { label: 'Achievements', path: '/achievements' },
  ];

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // Ignore background notification fetch errors
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleNotificationClick = async (notif) => {
    setSelectedNotif(notif);
    if (!notif.isRead) {
      try {
        await api.put(`/notifications/${notif._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (e) {
        // Ignore error
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 1.5rem',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Brand */}
        <Link to={role === 'teacher' ? '/teacher' : role === 'admin' ? '/admin' : '/dashboard'} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            color: '#fff',
            fontWeight: 900,
          }}>
            L
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#1e3a8a', letterSpacing: '-0.025em' }}>
            Learnitics
          </span>
        </Link>

        {/* Desktop Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.label}
                to={link.path}
                style={{
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#1e3a8a' : '#475569',
                  borderBottom: isActive ? '2px solid #1e3a8a' : '2px solid transparent',
                  padding: '0.5rem 0.25rem',
                  transition: 'color 0.15s',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User controls, Notification Bell & streak */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Notification Bell */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setNotifDropdownOpen((o) => !o)}
              title="Notifications & Instructor Feedback"
              style={{
                position: 'relative',
                background: notifDropdownOpen ? '#eff6ff' : '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '50%',
                width: 38,
                height: 38,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  borderRadius: 999,
                  minWidth: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  boxShadow: '0 2px 5px rgba(239,68,68,0.4)',
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Menu */}
            {notifDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 48,
                right: 0,
                width: 340,
                background: '#ffffff',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                zIndex: 60,
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '0.9rem 1rem',
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>
                    Instructor Notifications
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {unreadCount} unread
                  </span>
                </div>

                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => handleNotificationClick(n)}
                        style={{
                          padding: '0.85rem 1rem',
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                          background: n.isRead ? '#ffffff' : '#f0f9ff',
                          transition: 'background 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e3a8a' }}>
                            {n.senderName || 'Instructor'}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: n.isRead ? 400 : 600 }}>
                          {n.message.length > 70 ? `${n.message.slice(0, 70)}...` : n.message}
                        </div>
                        {n.courseTitle && (
                          <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem' }}>
                            📚 {n.courseTitle}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Streak Badge (for students) */}
          {role === 'student' && (
            <div
              title="Your continuous daily study streak"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                padding: '0.3rem 0.75rem',
                borderRadius: 999,
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#dc2626',
              }}
            >
              <span>🔥</span>
              <span>{streakCount} {streakCount === 1 ? 'Day' : 'Days'}</span>
            </div>
          )}

          {/* User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: role === 'admin' ? '#fef3c7' : role === 'teacher' ? '#e0f2fe' : '#e0e7ff',
              color: role === 'admin' ? '#b45309' : role === 'teacher' ? '#0369a1' : '#3730a3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}>
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
              {currentUser?.name ? currentUser.name.split(' ')[0] : 'User'}
            </span>
          </div>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* =========================================================================
          SELECTED NOTIFICATION DETAIL MODAL
          ========================================================================= */}
      {selectedNotif && (
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
            maxWidth: 460,
            width: '100%',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative',
          }}>
            <button
              onClick={() => setSelectedNotif(null)}
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: '#eff6ff',
                color: '#1e3a8a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}>
                💬
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Feedback from {selectedNotif.senderName || 'Instructor'}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {new Date(selectedNotif.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {selectedNotif.courseTitle && (
              <div style={{
                background: '#f8fafc',
                padding: '0.5rem 0.75rem',
                borderRadius: 8,
                fontSize: '0.825rem',
                color: '#1e3a8a',
                fontWeight: 600,
                marginBottom: '1rem',
                border: '1px solid #e2e8f0',
              }}>
                📚 Course: {selectedNotif.courseTitle}
              </div>
            )}

            <div style={{
              background: '#f8fafc',
              borderLeft: '4px solid #1e3a8a',
              padding: '1rem',
              borderRadius: '0 8px 8px 0',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              color: '#334155',
              marginBottom: '1.5rem',
            }}>
              "{selectedNotif.message}"
            </div>

            <button
              onClick={() => setSelectedNotif(null)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 8,
                background: '#1e3a8a',
                color: '#ffffff',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
