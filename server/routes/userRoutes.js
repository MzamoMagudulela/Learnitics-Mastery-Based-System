const express = require('express');
const router = express.Router();

const {
  getUsers,
  updateUserRole,
  toggleUserStatus,
} = require('../controllers/userController');

const { verifyToken, roleGuard } = require('../middleware/auth');

// All user management routes require admin role
router.use(verifyToken, roleGuard('admin'));

router.get('/', getUsers);
router.put('/:id/role', updateUserRole);
router.put('/:id/status', toggleUserStatus);

module.exports = router;
