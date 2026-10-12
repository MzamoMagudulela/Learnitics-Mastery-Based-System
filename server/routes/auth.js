const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe,
  verifyEmailForReset,
  resetPassword,
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password/verify', verifyEmailForReset);
router.post('/forgot-password/reset', resetPassword);

// Protected routes
router.get('/me', verifyToken, getMe);

module.exports = router;
