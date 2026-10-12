import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import courseService from '../services/courseService';
import {
  saveLessonForOffline,
  queueOfflineProgress,
  getOfflineLesson,
} from '../utils/offlineStorage';

export default function CourseOverviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeLesson, setActiveLesson] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [offlineToast, setOfflineToast] = useState('');

  // Fetch course details with modules & mastery lock state
  const loadCourse = async () => {
    try {
      setLoading(true);
      const res = await courseService.getCourseById(id);
      if (res.success && res.course) {
        setCourse(res.course);

        // Find first unlocked lesson to set as active
        if (res.course.modules && res.course.modules.length > 0) {
          for (const m of res.course.modules) {
            if (!m.isLocked && m.lessons && m.lessons.length > 0) {
              setActiveLesson(m.lessons[0]);
              break;
            }
          }
        }
      } else {
        setError('Course not found.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [id]);

  // Handle student enrollment
  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      await courseService.enrollInCourse(course._id);
      await loadCourse();
    } catch (err) {
      alert(err.response?.data?.message || 'Enrollment failed.');
    } finally {
      setEnrolling(false);
    }
  };

  // Handle Mark Complete button (Online or Offline Queue)
  const handleMarkComplete = async (lesson) => {
    if (!lesson || !course) return;
    try {
      setCompleting(true);

      if (navigator.onLine) {
        await courseService.updateLessonProgress(lesson._id, {
          percentCompleted: 100,
          status: 'completed',
          timeSpent: (lesson.duration || 10) * 60,
        });
      } else {
        // Offline: Queue in IndexedDB
        await queueOfflineProgress(lesson._id, {
          percentCompleted: 100,
          status: 'completed',
          timeSpent: (lesson.duration || 10) * 60,
        });
        setOfflineToast('Offline: Completion recorded locally & queued for cloud sync! 🔄');
        setTimeout(() => setOfflineToast(''), 4000);
      }

      // Update local state
      setCourse((prevCourse) => {
        if (!prevCourse) return prevCourse;
        const updatedModules = prevCourse.modules.map((m) => ({
          ...m,
          lessons: m.lessons.map((l) =>
            l._id === lesson._id
              ? { ...l, progress: { ...l.progress, status: 'completed' } }
              : l
          ),
        }));
        return { ...prevCourse, modules: updatedModules };
      });

      setActiveLesson((prev) =>
        prev && prev._id === lesson._id
          ? { ...prev, progress: { ...prev.progress, status: 'completed' } }
          : prev
      );
    } catch (err) {
      // Fallback offline queue on network failure
      await queueOfflineProgress(lesson._id, {
        percentCompleted: 100,
        status: 'completed',
        timeSpent: (lesson.duration || 10) * 60,
      });
      setOfflineToast('Network unavailable: Progress queued for cloud sync! 🔄');
      setTimeout(() => setOfflineToast(''), 4000);
    } finally {
      setCompleting(false);
    }
  };

  // Handle Download for Offline (Stores in IndexedDB + Triggers Local File Export)
  const handleDownloadOffline = async (lesson) => {
    if (!lesson) return;

    try {
      // 1. Store in IndexedDB (with localStorage fallback)
      const saveRes = await saveLessonForOffline(lesson, course);
      setOfflineToast(`Saved "${lesson.title}" to ${saveRes.storage} offline database! 💾`);
      setTimeout(() => setOfflineToast(''), 4000);

      // 2. Also trigger markdown file download for offline reading
      const offlineContent = `# ${lesson.title}
Course: ${course.title}
Content Type: ${lesson.contentType.toUpperCase()}
Duration: ~${lesson.duration || 10} minutes
==================================================

${lesson.content || 'Video Lesson Resource: ' + (lesson.videoUrl || 'N/A')}

==================================================
Downloaded from Learnitics Mastery LMS
Offline PWA Study Package - ${new Date().toLocaleDateString()}
`;

      const blob = new Blob([offlineContent], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${lesson.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-offline.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Offline download error:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '5rem 1rem', color: '#64748b' }}>
          <div style={{
            width: 44,
            height: 44,
            border: '4px solid #e2e8f0',
            borderTopColor: '#1e3a8a',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p>Loading course curriculum & mastery tree...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Navbar />
        <div style={{ maxWidth: 600, margin: '4rem auto', padding: '2rem', textAlign: 'center', background: '#fff', borderRadius: 16 }}>
          <h2>Course Error</h2>
          <p style={{ color: '#ef4444', margin: '1rem 0' }}>{error}</p>
          <Link to="/courses" style={{ color: '#1e3a8a', fontWeight: 700 }}>← Return to Catalog</Link>
        </div>
      </div>
    );
  }

  const isEnrolled = course.isEnrolled;
  const progressPercent = course.enrollment?.progressPercentage || 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />

      {/* Course Header Banner */}
      <section style={{
        background: 'linear-gradient(135deg, #0f172a, #1e3a8a)',
        color: '#ffffff',
        padding: '2.5rem 1.5rem',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{
              background: '#2563eb',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: 4,
              textTransform: 'uppercase',
            }}>
              {course.category}
            </span>
            <span style={{ color: '#93c5fd', fontSize: '0.85rem' }}>• {course.level} Level</span>
          </div>

          <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 900, marginBottom: '0.75rem', letterSpacing: '-0.025em' }}>
            {course.title}
          </h1>

          <p style={{ color: '#cbd5e1', maxWidth: 750, lineHeight: 1.6, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            {course.description}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
              <div>👨‍🏫 Instructor: <strong style={{ color: '#fff' }}>{course.instructor?.name || 'Faculty Lead'}</strong></div>
              <div>🎯 Mastery Bar: <strong style={{ color: '#fff' }}>{course.passingScore || 80}% per module</strong></div>
              <div>👥 Enrolled: <strong style={{ color: '#fff' }}>{course.enrollmentCount || 0} students</strong></div>
            </div>

            {!isEnrolled ? (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.75rem 1.75rem',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: enrolling ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                }}
              >
                {enrolling ? 'Enrolling...' : 'Enroll in Course (Free) →'}
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#93c5fd' }}>Course Progress:</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8' }}>{progressPercent}%</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Offline Toast Notification */}
      {offlineToast && (
        <div style={{
          maxWidth: 1200,
          margin: '1rem auto -1rem',
          padding: '0 1.5rem',
        }}>
          <div style={{
            background: '#eff6ff',
            border: '1.5px solid #93c5fd',
            borderRadius: 10,
            padding: '0.75rem 1.25rem',
            color: '#1e3a8a',
            fontSize: '0.9rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 2px 8px rgba(30, 58, 138, 0.08)',
          }}>
            <span>💾</span>
            <span>{offlineToast}</span>
          </div>
        </div>
      )}

      {/* Main Course Content Layout: Modules Sidebar + Lesson Viewer */}
      <div style={{ maxWidth: 1200, margin: '2rem auto', padding: '0 1.5rem', display: 'grid', gridTemplateColumns: 'minmax(300px, 380px) 1fr', gap: '2rem' }} className="course-view-layout">
        
        {/* =========================================================================
            1. MODULES LIST (With 🔒 Lock Icons on Locked Modules)
            ========================================================================= */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Curriculum Modules</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
              {course.modules?.length || 0} Modules
            </span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {course.modules?.map((module, mIdx) => {
              const isLocked = module.isLocked;

              return (
                <div
                  key={module._id}
                  style={{
                    background: isLocked ? '#f8fafc' : '#ffffff',
                    borderRadius: 12,
                    border: isLocked ? '1px dashed #cbd5e1' : '1px solid #e2e8f0',
                    padding: '1rem',
                    boxShadow: isLocked ? 'none' : '0 1px 3px rgba(0,0,0,0.03)',
                    opacity: isLocked ? 0.75 : 1,
                  }}
                >
                  {/* Module Title Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 4,
                        background: isLocked ? '#e2e8f0' : '#eff6ff',
                        color: isLocked ? '#64748b' : '#1e3a8a',
                      }}>
                        Mod {module.order}
                      </span>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: isLocked ? '#64748b' : '#0f172a' }}>
                        {module.title}
                      </h3>
                    </div>

                    {/* LOCK ICON OR UNLOCKED STATUS */}
                    {isLocked ? (
                      <span
                        title="Locked: Score >= 80% on previous module quiz to unlock"
                        style={{ fontSize: '1.1rem', cursor: 'help' }}
                      >
                        🔒
                      </span>
                    ) : module.isCompleted ? (
                      <span style={{ fontSize: '1rem' }} title="Mastery Verified">✅</span>
                    ) : (
                      <span style={{ fontSize: '0.9rem' }} title="Unlocked">🔓</span>
                    )}
                  </div>

                  {isLocked && (
                    <div style={{ fontSize: '0.75rem', color: '#b91c1c', background: '#fee2e2', padding: '0.35rem 0.6rem', borderRadius: 6, marginBottom: '0.5rem' }}>
                      🔒 Locked: Must pass previous module quiz with ≥ 80%
                    </div>
                  )}

                  {/* Lessons inside module */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem' }}>
                    {module.lessons?.map((lesson) => {
                      const isActive = activeLesson?._id === lesson._id;
                      const isLessonDone = lesson.progress?.status === 'completed';

                      return (
                        <button
                          key={lesson._id}
                          disabled={isLocked}
                          onClick={() => setActiveLesson(lesson)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 8,
                            border: isActive ? '1.5px solid #1e3a8a' : '1px solid transparent',
                            background: isActive ? '#eff6ff' : 'transparent',
                            color: isLocked ? '#94a3b8' : '#334155',
                            fontSize: '0.85rem',
                            fontWeight: isActive ? 700 : 500,
                            cursor: isLocked ? 'not-allowed' : 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.15s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>{lesson.contentType === 'video' ? '📹' : '📄'}</span>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 210 }}>
                              {lesson.title}
                            </span>
                          </div>
                          <div>
                            {isLessonDone && <span style={{ color: '#16a34a' }}>✓</span>}
                          </div>
                        </button>
                      );
                    })}

                    {/* Module Quiz */}
                    {module.quiz && (
                      <button
                        disabled={isLocked}
                        onClick={() => navigate(`/quiz/${module.quiz._id}`)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.6rem 0.75rem',
                          borderRadius: 8,
                          background: isLocked
                            ? '#f1f5f9'
                            : module.quiz.passed
                            ? '#dcfce7'
                            : '#eff6ff',
                          border: isLocked
                            ? '1px dashed #cbd5e1'
                            : module.quiz.passed
                            ? '1px solid #86efac'
                            : '1px solid #93c5fd',
                          color: isLocked
                            ? '#94a3b8'
                            : module.quiz.passed
                            ? '#166534'
                            : '#1e3a8a',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: isLocked ? 'not-allowed' : 'pointer',
                          marginTop: '0.25rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>🎯</span>
                          <span>{module.quiz.title}</span>
                        </div>
                        <span>
                          {module.quiz.passed
                            ? `${module.quiz.bestPercentage}% ✓`
                            : isLocked
                            ? '🔒'
                            : 'Take Quiz →'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* =========================================================================
            2. ACTIVE LESSON VIEWER (Video Player or Rendered Text + Action Buttons)
            ========================================================================= */}
        <main style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        }}>
          {activeLesson ? (
            <div>
              {/* Header Bar */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#eff6ff', color: '#1e3a8a', padding: '0.2rem 0.5rem', borderRadius: 4, textTransform: 'uppercase' }}>
                      {activeLesson.contentType}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      ⏱️ ~{activeLesson.duration || 10} mins
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    {activeLesson.title}
                  </h2>
                </div>

                {/* ACTION BUTTONS: Mark Complete + Download for Offline */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleDownloadOffline(activeLesson)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: '#f8fafc',
                      color: '#475569',
                      border: '1.5px solid #cbd5e1',
                      padding: '0.6rem 1rem',
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.target.style.background = '#e2e8f0')}
                    onMouseLeave={(e) => (e.target.style.background = '#f8fafc')}
                  >
                    <span>💾</span>
                    <span>Download for Offline</span>
                  </button>

                  <button
                    onClick={() => handleMarkComplete(activeLesson)}
                    disabled={completing || activeLesson.progress?.status === 'completed'}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: activeLesson.progress?.status === 'completed' ? '#dcfce7' : '#1e3a8a',
                      color: activeLesson.progress?.status === 'completed' ? '#166534' : '#ffffff',
                      border: activeLesson.progress?.status === 'completed' ? '1px solid #86efac' : 'none',
                      padding: '0.6rem 1.25rem',
                      borderRadius: 8,
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: activeLesson.progress?.status === 'completed' ? 'default' : 'pointer',
                    }}
                  >
                    <span>{activeLesson.progress?.status === 'completed' ? '✅' : '✓'}</span>
                    <span>{activeLesson.progress?.status === 'completed' ? 'Completed' : completing ? 'Saving...' : 'Mark Complete'}</span>
                  </button>
                </div>
              </div>

              {/* VIDEO PLAYER (If video type) */}
              {activeLesson.contentType === 'video' && (
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{
                    position: 'relative',
                    paddingBottom: '56.25%', // 16:9 Aspect Ratio
                    height: 0,
                    overflow: 'hidden',
                    borderRadius: 12,
                    background: '#0f172a',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  }}>
                    <iframe
                      src={activeLesson.videoUrl || 'https://www.youtube.com/embed/PNa9OMajw9w'}
                      title={activeLesson.title}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 'none',
                      }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* RENDERED TEXT CONTENT */}
              <div style={{ lineHeight: 1.8, color: '#334155', fontSize: '1rem' }}>
                {activeLesson.content ? (
                  <div style={{ whiteSpace: 'pre-line' }}>
                    {activeLesson.content}
                  </div>
                ) : (
                  <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                    Watch the video lesson above and mark it complete once understood.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📖</div>
              <h3>Select a lesson from the curriculum to begin studying</h3>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
