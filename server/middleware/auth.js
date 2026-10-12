const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Middleware to authenticate requests using JWT Bearer token
 */
const verifyToken = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
      });
    }

    // Verify token
    const secret = process.env.JWT_SECRET || 'learnitics_mastery_jwt_secret_key_2026_secure';
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Authentication token has expired. Please log in again.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
    }

    // Find user by ID in payload without password
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User account is deactivated. Please contact administration.',
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error verifying authentication credentials.',
    });
  }
};

/**
 * Middleware factory for Role-Based Access Control (RBAC)
 * @param  {...String} allowedRoles - e.g. 'admin', 'teacher', 'student'
 */
const roleGuard = (...allowedRoles) => {
  // Support both array arguments and comma-separated arguments
  const roles = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to role verification.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource. Required role(s): ${roles.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Middleware for optional authentication.
 * If Bearer token is present and valid, attaches req.user without rejecting guest requests.
 */
const optionalAuth = async (req, res, next) => {
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      const token = req.headers.authorization.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'learnitics_mastery_jwt_secret_key_2026_secure';
      const decoded = jwt.verify(token, secret);
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (err) {
    // Continue unauthenticated if token is invalid or expired
  }
  next();
};

module.exports = {
  verifyToken,
  roleGuard,
  protect: verifyToken, // Alias
  optionalAuth,
};
