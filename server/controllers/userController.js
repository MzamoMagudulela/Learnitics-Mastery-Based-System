const { User, UserProfile } = require('../models');

/**
 * @desc    Get all users with their profile details (Admin only)
 * @route   GET /api/users
 * @access  Private (Admin)
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    const userIds = users.map((u) => u._id);
    const profiles = await UserProfile.find({ user: { $in: userIds } }).lean();
    const profileMap = {};
    profiles.forEach((p) => {
      profileMap[p.user.toString()] = p;
    });

    const usersWithProfiles = users.map((u) => ({
      ...u,
      profile: profileMap[u._id.toString()] || null,
    }));

    return res.status(200).json({
      success: true,
      count: usersWithProfiles.length,
      users: usersWithProfiles,
    });
  } catch (error) {
    console.error('getUsers Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving users.',
      error: error.message,
    });
  }
};

/**
 * @desc    Change user role (Admin only)
 * @route   PUT /api/users/:id/role
 * @access  Private (Admin)
 */
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified. Must be student, teacher, or admin.',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('updateUserRole Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating user role.',
      error: error.message,
    });
  }
};

/**
 * @desc    Deactivate or activate user account (Admin only)
 * @route   PUT /api/users/:id/status
 * @access  Private (Admin)
 */
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Prevent admin from deactivating self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own administrative account.',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User account ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('toggleUserStatus Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating user status.',
      error: error.message,
    });
  }
};

module.exports = {
  getUsers,
  updateUserRole,
  toggleUserStatus,
};
