const bcrypt = require('bcryptjs');
const { User, UserProfile } = require('../models');
const { generateToken } = require('../utils/tokenHelper');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { fullName, name, email, password, confirmPassword, role } = req.body;
    const displayName = fullName || name;

    // 1. Validate required fields
    if (!displayName || !displayName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your full name.',
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address.',
      });
    }

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a password.',
      });
    }

    // 2. Validate password length (min 8 characters)
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    // 3. Validate password match
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    // 4. Validate unique email (case-insensitive)
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // 5. Role validation (defaults to 'student')
    let assignedRole = 'student';
    if (role && ['student', 'teacher', 'admin'].includes(role.toLowerCase())) {
      assignedRole = role.toLowerCase();
    }

    // 6. Hash password with bcrypt (10 rounds)
    // The User schema pre-save hook handles hashing if not already hashed.
    // To ensure exact 10 rounds as specified:
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 7. Create User document (using already hashed password, bypass duplicate hashing by saving directly)
    const user = new User({
      name: displayName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole,
    });
    // Mark password unmodified so pre-save hook won't double-hash
    user.isModified = function (field) {
      if (field === 'password') return false;
      return User.prototype.isModified.call(this, field);
    };
    await user.save();

    // 8. Automatically initialize UserProfile
    const profile = await UserProfile.create({
      user: user._id,
      bio: '',
      headline: assignedRole === 'student' ? 'Student' : assignedRole === 'teacher' ? 'Instructor' : 'Administrator',
      streakCount: 0,
      totalPoints: 0,
      masteryLevel: 'beginner',
    });

    // 9. Generate JWT with user id and role
    const token = generateToken(user);

    // 10. Return sanitized response (NEVER include password or passwordHash)
    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      profile: {
        streakCount: profile.streakCount,
        totalPoints: profile.totalPoints,
        masteryLevel: profile.masteryLevel,
      },
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during user registration.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Check if user exists (explicitly select password)
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // 3. Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    }

    // 4. Compare entered password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // 5. Update lastActiveDate in UserProfile
    await UserProfile.findOneAndUpdate(
      { user: user._id },
      { lastActiveDate: Date.now() },
      { new: true }
    );

    // 6. Generate JWT containing id and role
    const token = generateToken(user);

    // 7. Return sanitized response (NEVER include password)
    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get current authenticated user & profile
 * @route   GET /api/auth/me
 * @access  Private (Requires valid JWT)
 */
const getMe = async (req, res) => {
  try {
    // req.user is populated by verifyToken middleware (without password)
    const user = req.user;

    const profile = await UserProfile.findOne({ user: user._id });

    // Return sanitized user object and profile
    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      profile: profile || null,
    });
  } catch (error) {
    console.error('GetMe Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching user profile.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Verify if email is active on the system for password reset
 * @route   POST /api/auth/forgot-password/verify
 * @access  Public
 */
const verifyEmailForReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || user.isActive === false) {
      return res.status(404).json({
        success: false,
        isActive: false,
        message: 'Your email is not active on this system.',
      });
    }

    return res.status(200).json({
      success: true,
      isActive: true,
      message: 'Email is active.',
    });
  } catch (error) {
    console.error('verifyEmailForReset Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error checking email status.',
    });
  }
};

/**
 * @desc    Reset password if email is active
 * @route   POST /api/auth/forgot-password/reset
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and new password.',
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || user.isActive === false) {
      return res.status(404).json({
        success: false,
        isActive: false,
        message: 'Your email is not active on this system.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    user.isModified = function (field) {
      if (field === 'password') return false;
      return User.prototype.isModified.call(this, field);
    };
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password successfully changed! You can now log in.',
    });
  } catch (error) {
    console.error('resetPassword Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error resetting password.',
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  verifyEmailForReset,
  resetPassword,
};
