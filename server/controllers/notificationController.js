const { Notification, User, Course } = require('../models');

/**
 * @desc    Send feedback / notification to a student
 * @route   POST /api/notifications
 * @access  Private (Teacher, Admin)
 */
const sendFeedback = async (req, res) => {
  try {
    const { recipientId, message, courseId, courseTitle, title } = req.body;

    if (!recipientId || !message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID and feedback message are required.',
      });
    }

    const student = await User.findById(recipientId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student recipient not found.',
      });
    }

    let resolvedCourseTitle = courseTitle || '';
    if (courseId && !resolvedCourseTitle) {
      const course = await Course.findById(courseId);
      if (course) resolvedCourseTitle = course.title;
    }

    const notification = await Notification.create({
      recipient: recipientId,
      sender: req.user._id,
      senderName: req.user.name || 'Instructor',
      course: courseId || null,
      courseTitle: resolvedCourseTitle,
      title: title || 'Instructor Feedback',
      message: message.trim(),
    });

    return res.status(201).json({
      success: true,
      message: 'Feedback sent successfully.',
      notification,
    });
  } catch (error) {
    console.error('sendFeedback Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error sending feedback.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get user's notifications
 * @route   GET /api/notifications
 * @access  Private
 */
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('getMyNotifications Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving notifications.',
      error: error.message,
    });
  }
};

/**
 * @desc    Mark a notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      notification,
    });
  } catch (error) {
    console.error('markAsRead Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating notification.',
      error: error.message,
    });
  }
};

module.exports = {
  sendFeedback,
  getMyNotifications,
  markAsRead,
};
