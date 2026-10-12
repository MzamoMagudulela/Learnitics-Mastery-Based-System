import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import heroBg from '../assets/hero-bg.png';

const NAV_LINKS = ['Features', 'Courses', 'Testimonials', 'About'];

const STATS = [
  { value: '95%', label: 'Success Rate' },
  { value: '50K+', label: 'Active Learners' },
  { value: '100%', label: 'Learning Potential' },
];

const FEATURES = [
  {
    icon: '🧠',
    title: 'Mastery-Based Progression',
    desc: 'Unlock next modules only when you truly master the current one. No skipping allowed.',
  },
  {
    icon: '📊',
    title: 'Adaptive Analytics',
    desc: 'Real-time dashboards surface exactly where you struggle so you can level up fast.',
  },
  {
    icon: '🏅',
    title: 'Gamified Achievements',
    desc: 'Earn badges, extend streaks, and accumulate mastery points as you learn.',
  },
  {
    icon: '🎯',
    title: 'Smart Quiz Engine',
    desc: 'Instant AI-powered feedback on every answer with remediation explanations.',
  },
  {
    icon: '📹',
    title: 'Video & Text Content',
    desc: 'Mixed-media lessons structured for maximum knowledge retention.',
  },
  {
    icon: '👩‍🏫',
    title: 'Expert Instructors',
    desc: 'Industry practitioners deliver battle-tested curriculum from real-world experience.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Asavela Tshonisile',
    role: 'ICT student at SPU',
    avatar: '👨‍💻',
    text: 'Learnitics forced me to actually understand each concept before moving on. My interview pass rate doubled.',
  },
  {
    name: 'Mzamo Magudulela',
    role: 'ICT student at SPU',
    avatar: '👩‍🔬',
    text: 'The mastery algorithm identified gaps I didn\'t even know I had. Absolutely transformative learning experience.',
  },
  {
    name: 'Sandile Mzinyane',
    role: 'ICT student at SPU',
    avatar: '👨‍💼',
    text: 'Finally an LMS that doesn\'t let you click through without understanding. My DevOps skills went from novice to hired in 3 months.',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", overflowX: 'hidden' }}>

      {/* ========== NAVIGATION ========== */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 2rem',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 68,
        }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, color: '#fff', fontWeight: 800,
            }}>L</div>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#1e3a8a', letterSpacing: '-0.03em' }}>
              Learnitics
            </span>
          </Link>

          {/* Nav Links — Desktop */}
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }} className="nav-links">
            {NAV_LINKS.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                style={{
                  textDecoration: 'none',
                  color: '#374151',
                  fontWeight: 500,
                  fontSize: '0.925rem',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.target.style.color = '#1e3a8a')}
                onMouseLeave={(e) => (e.target.style.color = '#374151')}
              >
                {link}
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link to="/login" style={{
              padding: '0.5rem 1.25rem',
              borderRadius: 8,
              border: '2px solid #1e3a8a',
              color: '#1e3a8a',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
              onMouseEnter={(e) => {
                e.target.style.background = '#1e3a8a';
                e.target.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#1e3a8a';
              }}
            >
              Log In
            </Link>
            <Link to="/register" style={{
              padding: '0.5rem 1.25rem',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(30,58,138,0.3)',
            }}>
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* ========== HERO SECTION ========== */}
      <section style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.55)), url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5rem 2rem 4rem',
        position: 'relative',
        overflow: 'hidden',
      }}>


        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(2.75rem, 6vw, 4.5rem)',
          fontWeight: 900,
          color: '#ffffff',
          textAlign: 'center',
          lineHeight: 1.08,
          letterSpacing: '-0.04em',
          maxWidth: 900,
          marginBottom: '1.5rem',
        }}>
          Master Skills with{' '}
          <span style={{
            background: 'linear-gradient(90deg, #93c5fd, #60a5fa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Learnitics
          </span>
        </h1>

        {/* Tagline */}
        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
          color: '#bfdbfe',
          textAlign: 'center',
          maxWidth: 680,
          lineHeight: 1.7,
          marginBottom: '3rem',
          fontWeight: 400,
        }}>
          Adaptive mastery-based curriculum that adapts to <em>your</em> knowledge gaps.
          Unlock every next lesson only when you truly own the previous one.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '4rem' }}>
          <button
            onClick={() => navigate('/register')}
            style={{
              padding: '0.9rem 2.5rem',
              borderRadius: 12,
              background: '#ffffff',
              color: '#1e3a8a',
              fontWeight: 800,
              fontSize: '1.05rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 12px 36px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 30px rgba(0,0,0,0.2)';
            }}
          >
            Get Started Free →
          </button>
          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              padding: '0.9rem 2.5rem',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1.05rem',
              border: '2px solid rgba(255,255,255,0.3)',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.background = 'rgba(255,255,255,0.15)')}
            onMouseLeave={(e) => (e.target.style.background = 'rgba(255,255,255,0.1)')}
          >
            Explore Features
          </button>
        </div>

        {/* Stats Row */}
        <div style={{
          display: 'flex',
          gap: '3rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {STATS.map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}>
                {stat.value}
              </div>
              <div style={{ color: '#93c5fd', fontWeight: 500, fontSize: '0.9rem', marginTop: '0.25rem' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== FEATURES SECTION ========== */}
      <section id="features" style={{
        padding: '6rem 2rem',
        background: '#f8fafc',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <span style={{
              display: 'inline-block',
              color: '#1e3a8a',
              fontWeight: 700,
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '0.75rem',
            }}>
              Why Learnitics
            </span>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 900,
              color: '#0f172a',
              letterSpacing: '-0.03em',
              marginBottom: '1rem',
            }}>
              Built Different. Built Better.
            </h2>
            <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: 560, margin: '0 auto' }}>
              Every feature engineered to maximize how fast you go from knowing nothing to knowing everything.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}>
            {FEATURES.map((feature) => (
              <div key={feature.title} style={{
                background: '#ffffff',
                borderRadius: 16,
                padding: '2rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(30,58,138,0.12)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 12,
                  background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, marginBottom: '1.25rem',
                }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                  {feature.title}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS SECTION ========== */}
      <section id="testimonials" style={{ padding: '6rem 2rem', background: '#ffffff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
              fontWeight: 900,
              color: '#0f172a',
              letterSpacing: '-0.03em',
              marginBottom: '1rem',
            }}>
              What Our Learners Say
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}>
            {TESTIMONIALS.map((t) => (
              <div key={t.name} style={{
                background: '#f8fafc',
                borderRadius: 16,
                padding: '2rem',
                border: '1px solid #e2e8f0',
              }}>
                <p style={{
                  color: '#374151',
                  fontSize: '1rem',
                  lineHeight: 1.7,
                  marginBottom: '1.5rem',
                  fontStyle: 'italic',
                }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                  }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{t.name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section style={{
        background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
        padding: '5rem 2rem',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '-0.03em',
          marginBottom: '1rem',
        }}>
          Ready to Master Something New?
        </h2>
        <p style={{ color: '#bfdbfe', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
          Join thousands of learners who stopped memorizing and started mastering.
        </p>
        <button
          onClick={() => navigate('/register')}
          style={{
            padding: '1rem 3rem',
            borderRadius: 12,
            background: '#ffffff',
            color: '#1e3a8a',
            fontWeight: 800,
            fontSize: '1.1rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}
        >
          Get Started Free →
        </button>
      </section>

      {/* ========== FOOTER ========== */}
      <footer style={{
        background: '#0f172a',
        color: '#94a3b8',
        textAlign: 'center',
        padding: '2rem',
        fontSize: '0.875rem',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.5rem', marginBottom: '1rem',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: '#fff', fontWeight: 800,
            }}>L</div>
            <span style={{ fontWeight: 800, color: '#fff' }}>Learnitics</span>
          </div>
          <p>© {new Date().getFullYear()} Learnitics. Learning Management System.</p>
        </div>
      </footer>
    </div>
  );
}
