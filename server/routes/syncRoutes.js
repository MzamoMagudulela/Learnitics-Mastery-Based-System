const express = require('express');
const router = express.Router();
const { syncOfflineData } = require('../controllers/syncController');
const { verifyToken } = require('../middleware/auth');

// POST /api/sync — authenticated students can push batched offline progress & attempts
router.post('/', verifyToken, syncOfflineData);

module.exports = router;
