const express = require('express');
const router = express.Router();

const {
  getQuizForAttempt,
  submitQuizAttempt,
  getQuizAttempts,
} = require('../controllers/quizController');

const { verifyToken } = require('../middleware/auth');

// Student Quiz Attempt (Strips all answers & isCorrect flags)
router.get('/:id/attempt', verifyToken, getQuizForAttempt);

// Submit Quiz Answers for Server-Side Grading & Mastery Evaluation
router.post('/:id/submit', verifyToken, submitQuizAttempt);

// Student Attempt History for this Quiz
router.get('/:id/attempts', verifyToken, getQuizAttempts);

module.exports = router;
