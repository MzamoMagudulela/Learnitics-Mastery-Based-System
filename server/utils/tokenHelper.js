const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT token containing user ID and role
 * @param {Object} user - Mongoose User object or plain object
 * @returns {String} Signed JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user._id ? user._id.toString() : user.id,
    role: user.role,
  };

  const secret = process.env.JWT_SECRET || 'learnitics_mastery_jwt_secret_key_2026_secure';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify a JWT token
 * @param {String} token - Raw JWT string
 * @returns {Object} Decoded payload
 */
const verifyTokenPayload = (token) => {
  const secret = process.env.JWT_SECRET || 'learnitics_mastery_jwt_secret_key_2026_secure';
  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  verifyTokenPayload,
};
