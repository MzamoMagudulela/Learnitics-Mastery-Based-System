const express = require('express');
const router = express.Router();

const {
  createModule,
  updateModule,
  deleteModule,
} = require('../controllers/moduleController');

const { createLesson } = require('../controllers/lessonController');
const { verifyToken, roleGuard } = require('../middleware/auth');

// Direct Module CRUD (Teacher/Admin only)
router.post('/', verifyToken, roleGuard('teacher', 'admin'), createModule);
router.put('/:id', verifyToken, roleGuard('teacher', 'admin'), updateModule);
router.delete('/:id', verifyToken, roleGuard('teacher', 'admin'), deleteModule);

// Nested Lesson creation under module
router.post('/:moduleId/lessons', verifyToken, roleGuard('teacher', 'admin'), createLesson);

module.exports = router;
