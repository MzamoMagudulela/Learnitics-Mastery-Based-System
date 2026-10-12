import api from './api';

export const userService = {
  // Get all users (Admin only)
  getUsers: async () => {
    const res = await api.get('/users');
    return res.data;
  },

  // Update user role
  updateUserRole: async (userId, role) => {
    const res = await api.put(`/users/${userId}/role`, { role });
    return res.data;
  },

  // Toggle user active status
  toggleUserStatus: async (userId) => {
    const res = await api.put(`/users/${userId}/status`);
    return res.data;
  },
};

export default userService;
