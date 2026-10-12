import api from './api';

export const analyticsService = {
  // Student personalized dashboard metrics
  getStudentAnalytics: async () => {
    const res = await api.get('/analytics/student');
    return res.data;
  },

  // Teacher course telemetry and question miss-rate heatmap
  getTeacherAnalytics: async (courseId) => {
    const res = await api.get(`/analytics/teacher/${courseId}`);
    return res.data;
  },

  // Administrator institutional metrics
  getAdminAnalytics: async () => {
    const res = await api.get('/analytics/admin');
    return res.data;
  },
};

export default analyticsService;
