const express = require('express');
const router = express.Router();

const {
  createLesson,
  updateLesson,
  deleteLesson,
  updateLessonProgress,
} = require('../controllers/lessonController');

const { verifyToken, roleGuard } = require('../middleware/auth');

// Direct Lesson CRUD (Teacher/Admin only)
router.post('/', verifyToken, roleGuard('teacher', 'admin'), createLesson);
router.put('/:id', verifyToken, roleGuard('teacher', 'admin'), updateLesson);
router.delete('/:id', verifyToken, roleGuard('teacher', 'admin'), deleteLesson);

// Student Lesson Progress Tracking
router.post(
  '/:id/progress',
  verifyToken,
  roleGuard('student', 'teacher', 'admin'),
  updateLessonProgress
);

module.exports = router;
