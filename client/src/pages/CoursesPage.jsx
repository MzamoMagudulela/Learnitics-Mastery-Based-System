import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import courseService from '../services/courseService';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CoursesPage() {
  const navigate = useNavigate();
  const { role, currentUser } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Create / Edit Modal State for Teacher and Admin
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const [courseFormData, setCourseFormData] = useState({
    title: '',
    description: '',
    category: 'Computer Science',
    level: 'beginner',
    thumbnail: '',
    passingScore: 80,
  });

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await courseService.getCourses();
      if (res.success) {
        setCourses(res.courses || []);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const categories = ['All', ...new Set(courses.map((c) => c.category).filter(Boolean))];

  const filteredCourses = selectedCategory === 'All'
    ? courses
    : courses.filter((c) => c.category === selectedCategory);

  const isInstructorOrAdmin = role === 'teacher' || role === 'admin';

  // Open Edit Modal
  const handleOpenEdit = (course) => {
    setEditingCourse(course);
    setCourseFormData({
      title: course.title || '',
      description: course.description || '',
      category: course.category || 'Computer Science',
      level: course.level || 'beginner',
      thumbnail: course.thumbnail || '',
      passingScore: course.passingScore || 80,
    });
    setModalError('');
    setIsEditModalOpen(true);
  };

  // Submit Course Edit (PUT)
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;
    setModalLoading(true);
    setModalError('');

    try {
      const res = await api.put(`/courses/${editingCourse._id}`, courseFormData);
      if (res.data.success) {
        setIsEditModalOpen(false);
        setEditingCourse(null);
        await fetchCourses();
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to update course.');
    } finally {
      setModalLoading(false);
    }
  };

  // Submit Course Create (POST)
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');

    try {
      const res = await api.post('/courses', {
        ...courseFormData,
        status: 'published',
      });
      if (res.data.success) {
        setIsCreateModalOpen(false);
        setCourseFormData({
          title: '',
          description: '',
          category: 'Computer Science',
          level: 'beginner',
          thumbnail: '',
          passingScore: 80,
        });
        await fetchCourses();
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create course.');
    } finally {
      setModalLoading(false);
    }
  };

  // Delete Course
  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${courseTitle}"?`)) return;
    try {
      await api.delete(`/courses/${courseId}`);
      await fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete course.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <Navbar />

      {/* =========================================================================
          PAGE HEADER
          ========================================================================= */}
      <section style={{
        background: isInstructorOrAdmin
          ? 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)'
          : 'linear-gradient(135deg, #1e3a8a, #2563eb)',
        color: '#ffffff',
        padding: '3rem 1.5rem',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            {isInstructorOrAdmin && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '0.3rem 0.8rem',
                borderRadius: 999,
                fontSize: '0.8rem',
                fontWeight: 700,
                marginBottom: '0.75rem',
              }}>
                <span>{role === 'admin' ? '⚙️' : '👨‍🏫'}</span>
                <span>{role === 'admin' ? 'ADMINISTRATOR COURSE CONTROL' : 'INSTRUCTOR COURSE CONTROL'}</span>
              </div>
            )}
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
              {isInstructorOrAdmin ? 'Course Management' : 'Course Catalog'}
            </h1>
            <p style={{ color: '#bfdbfe', maxWidth: 620, fontSize: '0.975rem', lineHeight: 1.6 }}>
              {isInstructorOrAdmin
                ? 'Review, edit, and manage all courses across the system. Newly created courses appear here automatically and can be modified at any time.'
                : 'Mastery-based curricula engineered for real-world software engineering, algorithms, and cloud infrastructure.'}
            </p>
          </div>

          {/* Action button for Teacher and Admin */}
          {isInstructorOrAdmin && (
            <button
              onClick={() => {
                setCourseFormData({
                  title: '',
                  description: '',
                  category: 'Computer Science',
                  level: 'beginner',
                  thumbnail: '',
                  passingScore: 80,
                });
                setModalError('');
                setIsCreateModalOpen(true);
              }}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '0.85rem 1.75rem',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>➕</span> Create New Course
            </button>
          )}
        </div>
      </section>

      {/* =========================================================================
          COURSE LIST & MANAGEMENT CARDS
          ========================================================================= */}
      <main style={{ maxWidth: 1200, margin: '2rem auto', padding: '0 1.5rem 4rem' }}>
        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: 999,
                border: '1.5px solid',
                borderColor: selectedCategory === cat ? '#1e3a8a' : '#cbd5e1',
                background: selectedCategory === cat ? '#1e3a8a' : '#ffffff',
                color: selectedCategory === cat ? '#ffffff' : '#475569',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
            Loading course records...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
            <p style={{ color: '#64748b', fontSize: '1.1rem' }}>No courses found in this category.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.75rem' }}>
            {filteredCourses.map((course) => (
              <div
                key={course._id}
                style={{
                  background: '#ffffff',
                  borderRadius: 16,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                <div style={{ padding: '1.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: '#eff6ff',
                      color: '#1e3a8a',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 6,
                      textTransform: 'uppercase',
                    }}>
                      {course.category}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'capitalize' }}>
                      {course.level} Level
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                    {course.title}
                  </h3>

                  <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    {course.description}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.825rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                    <div>👨‍🏫 Instructor: <strong style={{ color: '#0f172a' }}>{course.instructor?.name || 'Faculty Lead'}</strong></div>
                    <div>🎯 Mastery Target: <strong style={{ color: '#16a34a' }}>{course.passingScore || 80}% Passing Threshold</strong></div>
                    <div>👥 Cohort: <strong style={{ color: '#0f172a' }}>{course.enrollmentCount || 0} Learners Enrolled</strong></div>
                  </div>
                </div>

                {/* Bottom Footer Actions */}
                <div style={{
                  background: '#f8fafc',
                  padding: '1rem 1.75rem',
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                }}>
                  {isInstructorOrAdmin ? (
                    /* TEACHER & ADMIN MANAGEMENT ACTIONS: Edit & Delete (No student learning action) */
                    <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleOpenEdit(course)}
                        style={{
                          background: '#1e3a8a',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.5rem 1.1rem',
                          borderRadius: 8,
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        ✏️ Edit Course
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course._id, course.title)}
                        style={{
                          background: '#fee2e2',
                          color: '#b91c1c',
                          border: '1px solid #fca5a5',
                          padding: '0.5rem 0.85rem',
                          borderRadius: 8,
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  ) : (
                    /* STUDENT ACTION: View Curriculum & Take Course */
                    <>
                      <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
                        {course.enrollmentCount || 0} Learners
                      </span>
                      <button
                        onClick={() => navigate(`/courses/${course._id}`)}
                        style={{
                          background: '#1e3a8a',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.55rem 1.25rem',
                          borderRadius: 8,
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                        }}
                      >
                        View Curriculum →
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* =========================================================================
          EDIT COURSE MODAL (for Teacher & Admin)
          ========================================================================= */}
      {isEditModalOpen && (
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
            maxWidth: 520,
            width: '100%',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                ✏️ Edit Course Details
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.875rem' }}>
                ⚠️ {modalError}
              </div>
            )}

            <form onSubmit={handleSaveEdit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Course Title
                </label>
                <input
                  type="text"
                  value={courseFormData.title}
                  onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Description
                </label>
                <textarea
                  value={courseFormData.description}
                  onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                  rows={3}
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Category
                  </label>
                  <select
                    value={courseFormData.category}
                    onChange={(e) => setCourseFormData({ ...courseFormData, category: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box', background: '#fff' }}
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Cloud & DevOps">Cloud & DevOps</option>
                    <option value="SDG 4: Quality Education">SDG 4: Quality Education</option>
                    <option value="SDG 8: Decent Work & Economic Growth">SDG 8: Decent Work & Economic Growth</option>
                    <option value="SDG 9: Industry, Innovation & Infrastructure">SDG 9: Industry, Innovation & Infrastructure</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Difficulty Level
                  </label>
                  <select
                    value={courseFormData.level}
                    onChange={(e) => setCourseFormData({ ...courseFormData, level: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box', background: '#fff' }}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Mastery Bar Passing Score (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={courseFormData.passingScore}
                  onChange={(e) => setCourseFormData({ ...courseFormData, passingScore: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{ padding: '0.75rem 1.25rem', borderRadius: 8, background: '#f1f5f9', color: '#475569', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  style={{ padding: '0.75rem 1.5rem', borderRadius: 8, background: '#1e3a8a', color: '#ffffff', fontWeight: 700, border: 'none', cursor: modalLoading ? 'not-allowed' : 'pointer' }}
                >
                  {modalLoading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          CREATE COURSE MODAL (for Teacher & Admin)
          ========================================================================= */}
      {isCreateModalOpen && (
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
            maxWidth: 520,
            width: '100%',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                ➕ Create New Course
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.875rem' }}>
                ⚠️ {modalError}
              </div>
            )}

            <form onSubmit={handleCreateCourse}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Course Title
                </label>
                <input
                  type="text"
                  value={courseFormData.title}
                  onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
                  placeholder="e.g. Distributed Database Architecture"
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Description
                </label>
                <textarea
                  value={courseFormData.description}
                  onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                  placeholder="Course learning goals and mastery objectives..."
                  rows={3}
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Category
                  </label>
                  <select
                    value={courseFormData.category}
                    onChange={(e) => setCourseFormData({ ...courseFormData, category: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box', background: '#fff' }}
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Cloud & DevOps">Cloud & DevOps</option>
                    <option value="SDG 4: Quality Education">SDG 4: Quality Education</option>
                    <option value="SDG 8: Decent Work & Economic Growth">SDG 8: Decent Work & Economic Growth</option>
                    <option value="SDG 9: Industry, Innovation & Infrastructure">SDG 9: Industry, Innovation & Infrastructure</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Difficulty Level
                  </label>
                  <select
                    value={courseFormData.level}
                    onChange={(e) => setCourseFormData({ ...courseFormData, level: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box', background: '#fff' }}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Mastery Bar Passing Score (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={courseFormData.passingScore}
                  onChange={(e) => setCourseFormData({ ...courseFormData, passingScore: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{ padding: '0.75rem 1.25rem', borderRadius: 8, background: '#f1f5f9', color: '#475569', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  style={{ padding: '0.75rem 1.5rem', borderRadius: 8, background: '#2563eb', color: '#ffffff', fontWeight: 700, border: 'none', cursor: modalLoading ? 'not-allowed' : 'pointer' }}
                >
                  {modalLoading ? 'Creating…' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
