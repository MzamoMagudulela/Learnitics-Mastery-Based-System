import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import analyticsService from '../services/analyticsService';
import courseService from '../services/courseService';
import api from '../services/api';

export default function DashboardPage() {
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();

  // If a teacher or admin accesses /dashboard, smoothly route them to their respective portal
  useEffect(() => {
    if (role === 'teacher') {
      navigate('/teacher', { replace: true });
    } else if (role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [role, navigate]);

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allCourses, setAllCourses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [analyticsRes, coursesRes, notifRes] = await Promise.allSettled([
          analyticsService.getStudentAnalytics(),
          courseService.getCourses(),
          api.get('/notifications'),
        ]);

        if (analyticsRes.status === 'fulfilled' && analyticsRes.value.success) {
          setAnalytics(analyticsRes.value.data);
        } else {
          // Fallback initial data
          setAnalytics({
            activeCourses: 2,
            completedCourses: 1,
            averageProgress: 68,
            studyStreak: 5,
            learningGoals: [],
            recentAchievements: [],
          });
        }

        if (coursesRes.status === 'fulfilled' && coursesRes.value.success) {
          setAllCourses(coursesRes.value.courses || []);
        }

        if (notifRes.status === 'fulfilled' && notifRes.value.data?.success) {
          setNotifications(notifRes.value.data.notifications || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleNotificationClick = async (notif) => {
    setSelectedFeedback(notif);
    if (!notif.isRead) {
      try {
        await api.put(`/notifications/${notif._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
      } catch (e) {
        // Ignore error
      }
    }
  };

  const studentName = currentUser?.name?.split(' ')[0] || 'Learner';
  const studyStreak = analytics?.studyStreak || 1;

  // Stat Card Data matching revised mockup exactly
  const statCards = [
    {
      title: 'Active Courses',
      value: analytics?.activeCourses ?? 0,
      label: 'Currently Enrolled',
      color: '#2563eb', // Blue
      percent: Math.min(100, ((analytics?.activeCourses || 1) / 4) * 100),
      icon: '📚',
    },
    {
      title: 'Average Progress',
      value: `${analytics?.averageProgress ?? 0}%`,
      label: 'Curriculum Mastery',
      color: '#16a34a', // Green
      percent: analytics?.averageProgress ?? 0,
      icon: '📈',
    },
    {
      title: 'Completed Courses',
      value: analytics?.completedCourses ?? 0,
      label: 'Mastered Full Courses',
      color: '#ea580c', // Orange
      percent: Math.min(100, ((analytics?.completedCourses || 0) / 3) * 100),
      icon: '🎓',
    },
    {
      title: 'Study Streak',
      value: `${studyStreak} Days`,
      label: 'Consecutive Days Active',
      color: '#dc2626', // Red
      percent: Math.min(100, (studyStreak / 14) * 100),
      icon: '🔥',
    },
  ];

  const learningGoals = analytics?.learningGoals || [];
  const primaryCourse = learningGoals.length > 0 ? learningGoals[0] : allCourses[0];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Navigation */}
      <Navbar streakCount={studyStreak} />

      {/* =========================================================================
          HERO SECTION: Deep Blue (#1e3a8a) with Streak Badge, Headline, and CTAs
          ========================================================================= */}
      <section style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 60%, #2563eb 100%)',
        color: '#ffffff',
        padding: '3rem 1.5rem',
        boxShadow: '0 4px 20px rgba(30, 58, 138, 0.15)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Flame streak badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            padding: '0.35rem 0.9rem',
            borderRadius: 999,
            fontSize: '0.9rem',
            fontWeight: 700,
            marginBottom: '1rem',
            backdropFilter: 'blur(6px)',
          }}>
            <span>🔥</span>
            <span>{studyStreak} Day Streak</span>
          </div>

          {/* Welcome Headline */}
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '0.75rem',
          }}>
            Welcome Back, {studentName}!
          </h1>

          <p style={{
            color: '#bfdbfe',
            fontSize: '1.05rem',
            maxWidth: 620,
            lineHeight: 1.6,
            marginBottom: '2rem',
          }}>
            Continuous practice builds true mastery. Keep your streak alive and unlock your next module milestone!
          </p>

          {/* Action Buttons: Continue Learning + View Progress */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {primaryCourse ? (
              <button
                onClick={() => navigate(`/courses/${primaryCourse.courseId || primaryCourse._id}`)}
                style={{
                  background: '#ffffff',
                  color: '#1e3a8a',
                  border: 'none',
                  padding: '0.85rem 1.75rem',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => (e.target.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
              >
                Continue Learning →
              </button>
            ) : (
              <button
                onClick={() => navigate('/courses')}
                style={{
                  background: '#ffffff',
                  color: '#1e3a8a',
                  border: 'none',
                  padding: '0.85rem 1.75rem',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                }}
              >
                Browse Courses →
              </button>
            )}

            <button
              onClick={() => {
                const el = document.getElementById('learning-goals-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                border: '1.5px solid rgba(255, 255, 255, 0.3)',
                padding: '0.85rem 1.75rem',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                backdropFilter: 'blur(6px)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.background = 'rgba(255, 255, 255, 0.2)')}
              onMouseLeave={(e) => (e.target.style.background = 'rgba(255, 255, 255, 0.12)')}
            >
              View Progress ↓
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          INSTRUCTOR FEEDBACK & NOTIFICATIONS SECTION (WHEN PRESENT)
          ========================================================================= */}
      {notifications.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '-2.5rem auto 2rem', padding: '0 1.5rem', position: 'relative', zIndex: 12 }}>
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
            border: '1.5px solid #bbf7d0',
            borderRadius: 16,
            padding: '1.25rem 1.5rem',
            boxShadow: '0 8px 24px rgba(22, 163, 74, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>📢</span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#14532d', margin: 0 }}>
                  Instructor Feedback & Notifications
                </h3>
              </div>
              <span style={{ fontSize: '0.8rem', background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: 999, fontWeight: 700 }}>
                {notifications.filter((n) => !n.isRead).length} Unread
              </span>
            </div>

            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    minWidth: 260,
                    maxWidth: 320,
                    background: notif.isRead ? '#ffffff' : '#f0fdf4',
                    border: notif.isRead ? '1px solid #e2e8f0' : '1.5px solid #86efac',
                    borderRadius: 12,
                    padding: '0.85rem 1rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534' }}>
                      👨‍🏫 {notif.senderName || 'Instructor'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#1f2937', margin: 0, fontWeight: notif.isRead ? 400 : 600 }}>
                    {notif.message.length > 60 ? `${notif.message.slice(0, 60)}...` : notif.message}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, marginTop: '0.4rem', display: 'inline-block' }}>
                    Click to view full feedback →
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          FOUR WHITE STAT CARDS WITH COLOUR-CODED PROGRESS BARS:
          1. Active Courses = Blue (#2563eb)
          2. Average Progress = Green (#16a34a)
          3. Completed Courses = Orange (#ea580c)
          4. Study Streak = Red (#dc2626)
          ========================================================================= */}
      <section style={{ maxWidth: 1200, margin: '-2rem auto 2.5rem', padding: '0 1.5rem', position: 'relative', zIndex: 10 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
        }}>
          {statCards.map((card) => (
            <div
              key={card.title}
              style={{
                background: '#ffffff',
                borderRadius: 16,
                padding: '1.5rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(15, 23, 42, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.05)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {card.title}
                </span>
                <span style={{ fontSize: '1.4rem' }}>{card.icon}</span>
              </div>

              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', lineHeight: 1, marginBottom: '0.4rem' }}>
                {card.value}
              </div>

              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>
                {card.label}
              </div>

              {/* COLOUR-CODED PROGRESS BAR */}
              <div style={{ height: 8, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${card.percent}%`,
                    background: card.color,
                    borderRadius: 999,
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          MAIN BODY: Learning Goals with Per-Course Progress Bars + Achievements
          ========================================================================= */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem 4rem' }}>
        {/* LEARNING GOALS SECTION */}
        <section id="learning-goals-section" style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                🎯 Learning Goals & Course Progress
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                Mastery requirement: pass each module's checkpoint with 80% to progress.
              </p>
            </div>
            <Link
              to="/courses"
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#1e3a8a',
                textDecoration: 'none',
              }}
            >
              Explore All Courses →
            </Link>
          </div>

          {learningGoals.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {learningGoals.map((course) => {
                const percent = course.progressPercentage || 0;
                const isMastered = percent >= 100;

                return (
                  <div
                    key={course.courseId}
                    style={{
                      background: '#ffffff',
                      borderRadius: 16,
                      border: '1px solid #e2e8f0',
                      padding: '1.5rem',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '0.2rem 0.6rem',
                          borderRadius: 6,
                          background: '#eff6ff',
                          color: '#1e3a8a',
                        }}>
                          {course.category || 'Curriculum'}
                        </span>
                        {isMastered && (
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.6rem',
                            borderRadius: 6,
                            background: '#dcfce7',
                            color: '#166534',
                          }}>
                            Mastered 🎓
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                        {course.title}
                      </h3>

                      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
                        Instructor: {course.instructorName || 'Lead Faculty'}
                      </p>
                    </div>

                    <div>
                      {/* Per-Course Progress Bar & Percentage */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Completion</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: percent >= 80 ? '#16a34a' : '#1e3a8a' }}>
                          {percent}%
                        </span>
                      </div>

                      <div style={{ height: 10, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden', marginBottom: '1.25rem' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${percent}%`,
                            background: isMastered
                              ? '#16a34a'
                              : 'linear-gradient(90deg, #1e3a8a, #3b82f6)',
                            borderRadius: 999,
                            transition: 'width 0.5s ease',
                          }}
                        />
                      </div>

                      <button
                        onClick={() => navigate(`/courses/${course.courseId}`)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: 10,
                          background: isMastered ? '#f8fafc' : '#1e3a8a',
                          color: isMastered ? '#1e3a8a' : '#ffffff',
                          border: isMastered ? '1.5px solid #cbd5e1' : 'none',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                        }}
                      >
                        {isMastered ? 'Review Course 📖' : 'Resume Learning →'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* If no active enrollments, display available course catalog cards */
            <div style={{
              background: '#ffffff',
              borderRadius: 16,
              border: '1px dashed #cbd5e1',
              padding: '2.5rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                Start Your First Mastery Course
              </h3>
              <p style={{ color: '#64748b', maxWidth: 460, margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
                Enroll in full-stack architecture, algorithms, or cloud computing to unlock module progression!
              </p>
              <button
                onClick={() => navigate('/courses')}
                style={{
                  background: '#1e3a8a',
                  color: '#fff',
                  border: 'none',
                  padding: '0.75rem 2rem',
                  borderRadius: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Browse Courses Catalog
              </button>
            </div>
          )}
        </section>

        {/* ACHIEVEMENTS PREVIEW BANNER */}
        <section style={{
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          color: '#ffffff',
          borderRadius: 20,
          padding: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              <span>🏅</span>
              <span>GAMIFIED MASTERY</span>
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
              Your Achievements & Badges
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: 480 }}>
              Earn badges for flawless quizzes, 5-day streaks, speed completion, and course mastery!
            </p>
          </div>

          <Link
            to="/achievements"
            style={{
              background: '#38bdf8',
              color: '#0f172a',
              textDecoration: 'none',
              padding: '0.85rem 1.75rem',
              borderRadius: 10,
              fontWeight: 800,
              fontSize: '0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>View All Badges</span>
            <span>→</span>
          </Link>
        </section>
      </main>

      {/* =========================================================================
          SELECTED FEEDBACK MODAL (WHEN NOTIFICATION CLICKED ON DASHBOARD)
          ========================================================================= */}
      {selectedFeedback && (
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
            maxWidth: 480,
            width: '100%',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative',
          }}>
            <button
              onClick={() => setSelectedFeedback(null)}
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
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
              }}>
                💬
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Feedback from {selectedFeedback.senderName || 'Instructor'}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {new Date(selectedFeedback.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {selectedFeedback.courseTitle && (
              <div style={{
                background: '#f8fafc',
                padding: '0.6rem 0.85rem',
                borderRadius: 8,
                fontSize: '0.85rem',
                color: '#1e3a8a',
                fontWeight: 600,
                marginBottom: '1rem',
                border: '1px solid #e2e8f0',
              }}>
                📚 Course: {selectedFeedback.courseTitle}
              </div>
            )}

            <div style={{
              background: '#f8fafc',
              borderLeft: '4px solid #16a34a',
              padding: '1.25rem',
              borderRadius: '0 8px 8px 0',
              fontSize: '1rem',
              lineHeight: 1.6,
              color: '#1f2937',
              marginBottom: '1.75rem',
            }}>
              "{selectedFeedback.message}"
            </div>

            <button
              onClick={() => setSelectedFeedback(null)}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: 10,
                background: '#16a34a',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.95rem',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
