const {
  Lesson,
  Module,
  Course,
  LessonProgress,
  CourseEnrollment,
} = require('../models');
const { updateDailyStreak } = require('../utils/masteryCalculator');

/**
 * @desc    Create a new lesson under a module
 * @route   POST /api/modules/:moduleId/lessons (or POST /api/lessons)
 * @access  Private (Teacher owner, Admin)
 */
const createLesson = async (req, res) => {
  try {
    const moduleId = req.params.moduleId || req.body.module;
    const { title, contentType, content, videoUrl, duration, order, isOptional } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Lesson title is required.',
      });
    }

    const module = await Module.findById(moduleId).populate('course');
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found.',
      });
    }

    // Authorization
    if (
      req.user.role !== 'admin' &&
      module.course.instructor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not own this course.',
      });
    }

    // Determine order
    let lessonOrder = order;
    if (lessonOrder === undefined) {
      const highestLesson = await Lesson.findOne({ module: module._id }).sort({ order: -1 });
      lessonOrder = highestLesson ? highestLesson.order + 1 : 1;
    }

    const lesson = await Lesson.create({
      module: module._id,
      course: module.course._id,
      title: title.trim(),
      contentType: contentType || 'text',
      content: content || '',
      videoUrl: videoUrl || '',
      duration: Number(duration) || 10,
      order: Number(lessonOrder),
      isOptional: !!isOptional,
    });

    return res.status(201).json({
      success: true,
      message: 'Lesson created successfully.',
      lesson,
    });
  } catch (error) {
    console.error('createLesson Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating lesson.',
      error: error.message,
    });
  }
};

/**
 * @desc    Update a lesson
 * @route   PUT /api/lessons/:id
 * @access  Private (Teacher owner, Admin)
 */
const updateLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('course');
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found.',
      });
    }

    // Authorization
    if (
      req.user.role !== 'admin' &&
      lesson.course.instructor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not own this course.',
      });
    }

    const allowedFields = [
      'title',
      'contentType',
      'content',
      'videoUrl',
      'duration',
      'order',
      'isOptional',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        lesson[field] = req.body[field];
      }
    });

    await lesson.save();

    return res.status(200).json({
      success: true,
      message: 'Lesson updated successfully.',
      lesson,
    });
  } catch (error) {
    console.error('updateLesson Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating lesson.',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a lesson
 * @route   DELETE /api/lessons/:id
 * @access  Private (Teacher owner, Admin)
 */
const deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('course');
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found.',
      });
    }

    // Authorization
    if (
      req.user.role !== 'admin' &&
      lesson.course.instructor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not own this course.',
      });
    }

    await Promise.all([
      Lesson.findByIdAndDelete(lesson._id),
      LessonProgress.deleteMany({ lesson: lesson._id }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Lesson deleted successfully.',
    });
  } catch (error) {
    console.error('deleteLesson Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting lesson.',
      error: error.message,
    });
  }
};

/**
 * @desc    Track student lesson progress and recompute course completion percentage
 * @route   POST /api/lessons/:id/progress
 * @access  Private (Student)
 */
const updateLessonProgress = async (req, res) => {
  try {
    const lessonId = req.params.id;
    const { percentCompleted, status, timeSpent } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found.',
      });
    }

    // Verify course enrollment
    const enrollment = await CourseEnrollment.findOne({
      user: req.user._id,
      course: lesson.course,
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course to track progress.',
      });
    }

    // Completed if percentCompleted is 100 or status is 'completed'
    const isCompleted =
      status === 'completed' || Number(percentCompleted) >= 100;
    const currentStatus = isCompleted ? 'completed' : 'in-progress';

    // 1. Upsert LessonProgress record
    const updateDoc = {
      user: req.user._id,
      lesson: lesson._id,
      module: lesson.module,
      course: lesson.course,
      status: currentStatus,
      lastAccessedAt: new Date(),
    };

    if (isCompleted) {
      updateDoc.completedAt = new Date();
    }

    const progress = await LessonProgress.findOneAndUpdate(
      { user: req.user._id, lesson: lesson._id },
      {
        $set: updateDoc,
        $inc: { timeSpent: Number(timeSpent) || 0 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 2. Recompute overall course completion percentage
    const totalLessons = await Lesson.countDocuments({
      course: lesson.course,
      isOptional: false,
    });

    const completedLessons = await LessonProgress.countDocuments({
      user: req.user._id,
      course: lesson.course,
      status: 'completed',
    });

    const completionPercent =
      totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 100;

    // 3. Update CourseEnrollment
    enrollment.progressPercentage = completionPercent;
    enrollment.lastAccessedAt = new Date();

    if (completionPercent >= 100 && enrollment.status !== 'completed') {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
    }

    await enrollment.save();

    // Update student's daily study streak (max 1 increment per calendar day)
    await updateDailyStreak(req.user._id);

    return res.status(200).json({
      success: true,
      message: isCompleted
        ? 'Lesson marked as completed.'
        : 'Lesson progress updated.',
      lessonProgress: progress,
      courseProgress: {
        totalLessons,
        completedLessons,
        progressPercentage: completionPercent,
        status: enrollment.status,
      },
    });
  } catch (error) {
    console.error('updateLessonProgress Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating lesson progress.',
      error: error.message,
    });
  }
};

module.exports = {
  createLesson,
  updateLesson,
  deleteLesson,
  updateLessonProgress,
};
