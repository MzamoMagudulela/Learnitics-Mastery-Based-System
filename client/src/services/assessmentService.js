import api from './api';

export const assessmentService = {
  // Get sanitized questions for a student attempt
  getQuizAttempt: async (quizId) => {
    const res = await api.get(`/quizzes/${quizId}/attempt`);
    return res.data;
  },

  // Submit student answers for server-side evaluation & grading
  submitQuiz: async (quizId, data) => {
    const res = await api.post(`/quizzes/${quizId}/submit`, data);
    return res.data;
  },

  // Get student's previous attempts for a quiz
  getQuizAttempts: async (quizId) => {
    const res = await api.get(`/quizzes/${quizId}/attempts`);
    return res.data;
  },
};

export default assessmentService;
