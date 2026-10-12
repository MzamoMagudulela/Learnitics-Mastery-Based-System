import api from './api';

export const courseService = {
  // Get all active published courses
  getCourses: async () => {
    const res = await api.get('/courses');
    return res.data;
  },

  // Get course by ID with module/lesson tree & mastery lock status
  getCourseById: async (id) => {
    const res = await api.get(`/courses/${id}`);
    return res.data;
  },

  // Enroll logged-in student in course
  enrollInCourse: async (id) => {
    const res = await api.post(`/courses/${id}/enroll`);
    return res.data;
  },

  // Update student lesson progress
  updateLessonProgress: async (lessonId, data) => {
    const res = await api.post(`/lessons/${lessonId}/progress`, data);
    return res.data;
  },
};

export default courseService;
