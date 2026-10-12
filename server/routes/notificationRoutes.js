const express = require('express');
const router = express.Router();

const {
  sendFeedback,
  getMyNotifications,
  markAsRead,
} = require('../controllers/notificationController');
const { verifyToken, roleGuard } = require('../middleware/auth');

// Student / User: Get notifications & mark read
router.get('/', verifyToken, getMyNotifications);
router.put('/:id/read', verifyToken, markAsRead);

// Teacher / Admin: Send feedback
router.post('/', verifyToken, roleGuard('teacher', 'admin'), sendFeedback);

module.exports = router;
