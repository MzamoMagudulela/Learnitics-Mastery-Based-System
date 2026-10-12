import React, { useState, useEffect } from 'react';
import Navbar from '../components/common/Navbar';
import analyticsService from '../services/analyticsService';

const SYSTEM_ACHIEVEMENTS = [
  {
    slug: 'first-quiz-passed',
    title: 'First Quiz Passed',
    description: 'Demonstrate initial mastery by achieving a passing score on your first module assessment.',
    badgeIcon: '🏆',
    category: 'quiz',
    points: 50,
  },
  {
    slug: '5-day-streak',
    title: '5-Day Streak',
    description: 'Demonstrated exceptional consistency by learning 5 consecutive calendar days in a row.',
    badgeIcon: '🔥',
    category: 'streak',
    points: 100,
  },
  {
    slug: 'score-100',
    title: 'Score 100%',
    description: 'Attain flawless mastery by answering every question correctly on a module quiz.',
    badgeIcon: '⚡',
    category: 'quiz',
    points: 150,
  },
  {
    slug: 'course-completed',
    title: 'Course Completed',
    description: 'Demonstrate holistic competency by mastering all modules and checkpoints across an entire course.',
    badgeIcon: '🎓',
    category: 'course',
    points: 300,
  },
  {
    slug: 'mastery-champion',
    title: 'Mastery Champion',
    description: 'Earn mastery verification (>= 80%) across 5 distinct module checkpoints.',
    badgeIcon: '👑',
    category: 'mastery',
    points: 250,
  },
  {
    slug: 'speed-learner',
    title: 'Speed Learner',
    description: 'Attain passing mastery on an assessment in under 180 seconds with focused precision.',
    badgeIcon: '⏱️',
    category: 'quiz',
    points: 75,
  },
  {
    slug: 'knowledge-explorer',
    title: 'Knowledge Explorer',
    description: 'Complete 10 interactive text and video lessons across your enrolled courses.',
    badgeIcon: '🧭',
    category: 'general',
    points: 80,
  },
  {
    slug: 'first-attempt-ace',
    title: 'First Attempt Ace',
    description: 'Conquer a mastery checkpoint quiz on your very first try without requiring remediation.',
    badgeIcon: '🎯',
    category: 'quiz',
    points: 120,
  },
];

export default function AchievementsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const res = await analyticsService.getStudentAnalytics();
        if (res.success && res.data) {
          setAnalytics(res.data);
        }
      } catch (err) {
        console.error('Failed to load achievements:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAchievements();
  }, []);

  const unlockedMap = {};
  if (analytics?.recentAchievements) {
    analytics.recentAchievements.forEach((a) => {
      unlockedMap[a.title?.toLowerCase()] = a;
    });
  }

  const streakCount = analytics?.studyStreak || 1;
  const totalPoints = analytics?.totalPoints || 350;
  const masteryLevel = analytics?.masteryLevel || 'intermediate';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar streakCount={streakCount} />

      {/* Header Banner */}
      <section style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
        color: '#ffffff',
        padding: '3rem 1.5rem',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.25rem 0.75rem', borderRadius: 999, fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              <span>🏅</span>
              <span>GAMIFIED RECOGNITION</span>
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
              Mastery Badges & Achievements
            </h1>
            <p style={{ color: '#cbd5e1', maxWidth: 560, fontSize: '0.95rem' }}>
              Every badge represents verified competency, discipline, and milestones conquered on your learning path.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Total Points Card */}
            <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '1.25rem 1.75rem', borderRadius: 16, textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase' }}>Total Points</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#38bdf8' }}>{totalPoints}</div>
            </div>

            {/* Mastery Level Card */}
            <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '1.25rem 1.75rem', borderRadius: 16, textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase' }}>Mastery Rank</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#4ade80', textTransform: 'capitalize', marginTop: '0.35rem' }}>
                {masteryLevel} 🌟
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Badges Grid (Coloured vs Greyed Out) */}
      <main style={{ maxWidth: 1200, margin: '2.5rem auto', padding: '0 1.5rem 4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
            Available System Badges
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Earned: <strong style={{ color: '#16a34a' }}>{Object.keys(unlockedMap).length}</strong> / {SYSTEM_ACHIEVEMENTS.length}
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
          gap: '1.5rem',
        }}>
          {SYSTEM_ACHIEVEMENTS.map((ach) => {
            const unlocked = !!unlockedMap[ach.title.toLowerCase()];
            const earnedInfo = unlockedMap[ach.title.toLowerCase()];

            return (
              <div
                key={ach.slug}
                style={{
                  background: '#ffffff',
                  borderRadius: 18,
                  padding: '1.75rem',
                  border: unlocked ? '2px solid #86efac' : '1px solid #e2e8f0',
                  boxShadow: unlocked
                    ? '0 10px 25px rgba(22, 163, 74, 0.12)'
                    : '0 2px 6px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.2s',
                }}
              >
                {/* Glow bar on top of earned badges */}
                {unlocked && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: 'linear-gradient(90deg, #16a34a, #22c55e)',
                  }} />
                )}

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    {/* Badge Icon: Coloured vs Greyed out */}
                    <div style={{
                      width: 58,
                      height: 58,
                      borderRadius: 16,
                      background: unlocked ? 'linear-gradient(135deg, #dcfce7, #bbf7d0)' : '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 30,
                      filter: unlocked ? 'none' : 'grayscale(1)',
                      opacity: unlocked ? 1 : 0.45,
                      boxShadow: unlocked ? '0 4px 12px rgba(22,163,74,0.2)' : 'none',
                    }}>
                      {ach.badgeIcon}
                    </div>

                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '0.25rem 0.6rem',
                      borderRadius: 6,
                      background: unlocked ? '#dcfce7' : '#f1f5f9',
                      color: unlocked ? '#166534' : '#94a3b8',
                    }}>
                      {unlocked ? 'UNLOCKED ✅' : 'LOCKED 🔒'}
                    </div>
                  </div>

                  <h3 style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: unlocked ? '#0f172a' : '#64748b',
                    marginBottom: '0.4rem',
                  }}>
                    {ach.title}
                  </h3>

                  <p style={{
                    fontSize: '0.85rem',
                    color: unlocked ? '#475569' : '#94a3b8',
                    lineHeight: 1.5,
                    marginBottom: '1.25rem',
                  }}>
                    {ach.description}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ fontWeight: 700, color: unlocked ? '#2563eb' : '#94a3b8' }}>
                    +{ach.points} Mastery Points
                  </span>

                  {unlocked && earnedInfo?.earnedAt ? (
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>
                      Earned {new Date(earnedInfo.earnedAt).toLocaleDateString()}
                    </span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                      Not yet unlocked
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
