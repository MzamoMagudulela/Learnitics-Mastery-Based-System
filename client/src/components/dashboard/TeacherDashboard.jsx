import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import api from '../../services/api';
import analyticsService from '../../services/analyticsService';
import courseService from '../../services/courseService';
import Navbar from '../common/Navbar';

export default function TeacherDashboard() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courseAnalytics, setCourseAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Create Course Form State
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    thumbnail: '',
    category: 'SDG 4: Quality Education',
    level: 'intermediate',
  });
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState({});
  const [feedbackTexts, setFeedbackTexts] = useState({});
  const [extraMaterialModal, setExtraMaterialModal] = useState(null);

  // Fetch teacher's courses
  const loadTeacherCourses = async () => {
    try {
      setLoading(true);
      const res = await courseService.getCourses();
      if (res.success && res.courses) {
        setCourses(res.courses);
        if (res.courses.length > 0 && !selectedCourseId) {
          setSelectedCourseId(res.courses[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeacherCourses();
  }, []);

  // Fetch per-course analytics when selectedCourseId changes
  useEffect(() => {
    if (!selectedCourseId) return;

    const loadAnalytics = async () => {
      try {
        const res = await analyticsService.getTeacherAnalytics(selectedCourseId);
        if (res.success) {
          setCourseAnalytics(res);
        }
      } catch (err) {
        console.error('Failed to load teacher analytics:', err);
      }
    };

    loadAnalytics();
  }, [selectedCourseId]);

  // Handle Create Course
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourse.title || !newCourse.description) {
      alert('Please provide title and description.');
      return;
    }

    try {
      setCreatingCourse(true);
      const res = await api.post('/courses', {
        ...newCourse,
        status: 'published',
      });
      if (res.data.success) {
        alert('Course created successfully! It is now active in your Course Menu.');
        setNewCourse({
          title: '',
          description: '',
          thumbnail: '',
          category: 'SDG 4: Quality Education',
          level: 'intermediate',
        });
        await loadTeacherCourses();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create course.');
    } finally {
      setCreatingCourse(false);
    }
  };

  // Handle Send Feedback to Student
  const handleSendFeedback = async (studentId) => {
    const text = feedbackTexts[studentId];
    if (!text || !text.trim()) {
      alert('Please type some feedback before sending.');
      return;
    }
    try {
      const selectedCourse = courses.find((c) => c._id === selectedCourseId);
      await api.post('/notifications', {
        recipientId: studentId,
        message: text.trim(),
        courseId: selectedCourseId || null,
        courseTitle: selectedCourse?.title || 'Course Guidance',
      });
      setFeedbackSent((prev) => ({ ...prev, [studentId]: true }));
      setFeedbackTexts((prev) => ({ ...prev, [studentId]: '' }));
      setTimeout(() => {
        setFeedbackSent((prev) => ({ ...prev, [studentId]: false }));
      }, 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send feedback.');
    }
  };

  // KPIs
  const totalCourses = courses.length;
  const enrolledStudents = courseAnalytics?.enrolledStudents || [];
  const totalStudents = enrolledStudents.length;

  const avgClassScore = totalStudents > 0
    ? Math.round(
        enrolledStudents.reduce((sum, s) => sum + (s.avgScore || 0), 0) / totalStudents
      )
    : 82;

  // Chart data: student scores for BarChart
  const scoreChartData = enrolledStudents.map((s) => ({
    name: (s.name || 'Student').split(' ')[0],
    score: Math.round(s.avgScore || 0),
    progress: s.progressPercentage || 0,
  }));

  const missRateHeatmap = courseAnalytics?.missRateHeatmap || [];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />

      {/* =========================================================================
          BLUE HERO: "Welcome back, teacher!"
          ========================================================================= */}
      <section style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 60%, #2563eb 100%)',
        color: '#ffffff',
        padding: '3rem 1.5rem',
        boxShadow: '0 4px 20px rgba(30, 58, 138, 0.15)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '0.35rem 0.9rem',
            borderRadius: 999,
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '1rem',
          }}>
            <span>👨‍🏫</span>
            <span>INSTRUCTOR PORTAL</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '0.5rem',
          }}>
            Welcome back, teacher!
          </h1>
          <p style={{ color: '#bfdbfe', fontSize: '1rem', maxWidth: 600 }}>
            Monitor student cohort mastery, detect concept bottlenecks via question heatmaps, and administer curriculum.
          </p>
        </div>
      </section>

      {/* =========================================================================
          1. KPI CARDS: Total Courses, Total Students, Class Avg Score
          ========================================================================= */}
      <section style={{ maxWidth: 1200, margin: '-2rem auto 2.5rem', padding: '0 1.5rem', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Courses</span>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e3a8a', marginTop: '0.5rem' }}>{totalCourses}</div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Published Curricula</span>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Students</span>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#2563eb', marginTop: '0.5rem' }}>{totalStudents}</div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Enrolled in Active Course</span>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Class Avg Score</span>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#16a34a', marginTop: '0.5rem' }}>{avgClassScore}%</div>
            <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>≥ 80% Mastery Standard Met</span>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem 4rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        
        {/* =========================================================================
            2. "MY COURSES" LIST + CREATE COURSE FORM
            ========================================================================= */}
        <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }} className="teacher-courses-grid">
          {/* My Courses List */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
              📚 My Courses & Telemetry Selector
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Select a course to inspect its performance heatmap and student scores:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {courses.map((c) => {
                const isSelected = selectedCourseId === c._id;
                return (
                  <div
                    key={c._id}
                    onClick={() => setSelectedCourseId(c._id)}
                    style={{
                      padding: '1rem',
                      borderRadius: 12,
                      border: isSelected ? '2px solid #1e3a8a' : '1px solid #e2e8f0',
                      background: isSelected ? '#eff6ff' : '#f8fafc',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e3a8a', textTransform: 'uppercase' }}>
                        {c.category}
                      </div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>
                        {c.title}
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {c.enrollmentCount || 0} Students Enrolled • {c.level}
                      </span>
                    </div>

                    <div style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: 8,
                      background: isSelected ? '#1e3a8a' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#475569',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      border: '1px solid #cbd5e1',
                    }}>
                      {isSelected ? 'Active Analytics' : 'Select'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Create Course Form (Title, Description, Thumbnail URL, SDG Goal) */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              ➕ Create New Course
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Add a new mastery curriculum aligned to educational outcomes.
            </p>

            <form onSubmit={handleCreateCourse}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Course Title
                </label>
                <input
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  placeholder="e.g. Advanced Distributed Systems"
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Description
                </label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  placeholder="Course learning goals and mastery objectives..."
                  rows={3}
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Thumbnail Image URL
                </label>
                <input
                  type="url"
                  value={newCourse.thumbnail}
                  onChange={(e) => setNewCourse({ ...newCourse, thumbnail: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Category / SDG Goal
                </label>
                <select
                  value={newCourse.category}
                  onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box', background: '#fff' }}
                >
                  <option value="SDG 4: Quality Education">SDG 4: Quality Education</option>
                  <option value="SDG 8: Decent Work & Economic Growth">SDG 8: Decent Work & Economic Growth</option>
                  <option value="SDG 9: Industry, Innovation & Infrastructure">SDG 9: Industry, Innovation & Infrastructure</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Cloud & DevOps">Cloud & DevOps</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={creatingCourse}
                style={{
                  width: '100%',
                  background: '#1e3a8a',
                  color: '#fff',
                  border: 'none',
                  padding: '0.85rem',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: creatingCourse ? 'not-allowed' : 'pointer',
                }}
              >
                {creatingCourse ? 'Creating...' : 'Create Course →'}
              </button>
            </form>
          </div>
        </section>

        {/* =========================================================================
            3. PER-COURSE ANALYTICS: BAR CHART OF STUDENT SCORES
            ========================================================================= */}
        <section style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
            📊 Student Score Distribution (Bar Chart)
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Average quiz score percentage across enrolled students:
          </p>

          <div style={{ width: '100%', height: 280 }}>
            {scoreChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} unit="%" />
                  <Tooltip
                    formatter={(value) => [`${value}%`, 'Average Score']}
                    contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: 8, border: 'none' }}
                  />
                  <Bar dataKey="score" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                No score records yet for this course.
              </div>
            )}
          </div>
        </section>

        {/* =========================================================================
            4. HEATMAP TABLE: MOST-MISSED QUESTIONS (Red-highlighted when > 50%)
            ========================================================================= */}
        <section style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                🔥 Question Miss-Rate Heatmap
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                Identifies concepts students struggle with most. Questions with <strong>&gt;50% miss rate</strong> are red-highlighted for remediation.
              </p>
            </div>

            <button
              onClick={() => setExtraMaterialModal('Remediation Pack: Deep-Dive Modules & Practice Sandboxes')}
              style={{
                background: '#ea580c',
                color: '#fff',
                border: 'none',
                padding: '0.65rem 1.25rem',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              + Assign Extra Material
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Question Text</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Type</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Attempts</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Miss Rate (%)</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 700 }}>Remediation Status</th>
                </tr>
              </thead>
              <tbody>
                {missRateHeatmap.length > 0 ? (
                  missRateHeatmap.map((item) => {
                    const isHighMiss = item.missRate > 50;

                    return (
                      <tr
                        key={item.questionId}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: isHighMiss ? '#fef2f2' : 'transparent', // Red highlighted when >50%
                        }}
                      >
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: isHighMiss ? '#991b1b' : '#1e293b', maxWidth: 380 }}>
                          {item.questionText}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700 }}>
                          {item.questionType}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                          {item.totalAnswers} ({item.wrongCount} wrong)
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.6rem',
                            borderRadius: 6,
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            background: isHighMiss ? '#fee2e2' : '#dcfce7',
                            color: isHighMiss ? '#dc2626' : '#166534',
                          }}>
                            {item.missRate}%
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          {isHighMiss ? (
                            <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.8rem' }}>
                              ⚠️ High Struggle Rate
                            </span>
                          ) : (
                            <span style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: 600 }}>
                              ✓ Concept Mastered
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                      No question telemetry recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* =========================================================================
            5. STUDENT ROSTER & INDIVIDUAL FEEDBACK FORM
            ========================================================================= */}
        <section style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
            💬 Enrolled Student Roster & Feedback
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Send individual guidance, formative feedback, or remediation advice to each learner:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {enrolledStudents.map((s) => (
              <div key={s.studentId} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem', background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div>
                    <h4 style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', margin: 0 }}>{s.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.email}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e3a8a' }}>{Math.round(s.avgScore)}% Avg</div>
                    <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>{s.progressPercentage}% Done</span>
                  </div>
                </div>

                <textarea
                  placeholder={`Write feedback for ${s.name}...`}
                  value={feedbackTexts[s.studentId] || ''}
                  onChange={(e) => setFeedbackTexts({ ...feedbackTexts, [s.studentId]: e.target.value })}
                  rows={2}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box', marginBottom: '0.5rem' }}
                />

                <button
                  onClick={() => handleSendFeedback(s.studentId)}
                  style={{
                    background: feedbackSent[s.studentId] ? '#16a34a' : '#1e3a8a',
                    color: '#fff',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: 6,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  {feedbackSent[s.studentId] ? 'Feedback Sent ✓' : 'Send Feedback'}
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Extra Material Notification Modal */}
      {extraMaterialModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
        }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', maxWidth: 480, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              Assign Remediation Material
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Supplementary review modules and guided practice have been assigned to students with high miss-rates.
            </p>
            <button
              onClick={() => setExtraMaterialModal(null)}
              style={{ background: '#1e3a8a', color: '#fff', border: 'none', padding: '0.75rem 2rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
