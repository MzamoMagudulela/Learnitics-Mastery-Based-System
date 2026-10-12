const express = require('express');
const router = express.Router();

const {
  getStudentAnalytics,
  getTeacherAnalytics,
  getAdminAnalytics,
} = require('../controllers/analyticsController');

const { verifyToken, roleGuard } = require('../middleware/auth');

// 1. Student Dashboard Analytics
router.get('/student', verifyToken, getStudentAnalytics);

// 2. Teacher Course-Level Analytics & Heatmap
router.get(
  '/teacher/:courseId',
  verifyToken,
  roleGuard('teacher', 'admin'),
  getTeacherAnalytics
);

// 3. System-Wide Admin Analytics & KPIs
router.get('/admin', verifyToken, roleGuard('admin'), getAdminAnalytics);

module.exports = router;
