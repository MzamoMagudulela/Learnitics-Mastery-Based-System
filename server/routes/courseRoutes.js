const express = require('express');
const router = express.Router();

const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
} = require('../controllers/courseController');

const { createModule } = require('../controllers/moduleController');
const { verifyToken, roleGuard, optionalAuth } = require('../middleware/auth');

// Public Course Catalog & Details with optional personalization
router.get('/', getCourses);
router.get('/:id', optionalAuth, getCourseById);

// Teacher/Admin Course Management
router.post('/', verifyToken, roleGuard('teacher', 'admin'), createCourse);
router.put('/:id', verifyToken, roleGuard('teacher', 'admin'), updateCourse);
router.delete('/:id', verifyToken, roleGuard('teacher', 'admin'), deleteCourse);

// Student Course Enrollment
router.post('/:id/enroll', verifyToken, roleGuard('student', 'teacher', 'admin'), enrollCourse);

// Nested Module creation under course
router.post('/:courseId/modules', verifyToken, roleGuard('teacher', 'admin'), createModule);

module.exports = router;
