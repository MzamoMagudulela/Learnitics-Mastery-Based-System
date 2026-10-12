const { Module, Course, Lesson, Quiz, Question, AnswerOption, LessonProgress, QuizAttempt } = require('../models');

/**
 * @desc    Create a new module for a course
 * @route   POST /api/courses/:courseId/modules (or POST /api/modules)
 * @access  Private (Teacher owner, Admin)
 */
const createModule = async (req, res) => {
  try {
    const courseId = req.params.courseId || req.body.course;
    const { title, description, order } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Module title is required.',
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }

    // Authorization: owner or admin
    if (
      req.user.role !== 'admin' &&
      course.instructor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not own this course.',
      });
    }

    // Determine order if not specified
    let moduleOrder = order;
    if (moduleOrder === undefined) {
      const highestModule = await Module.findOne({ course: course._id }).sort({ order: -1 });
      moduleOrder = highestModule ? highestModule.order + 1 : 1;
    }

    const module = await Module.create({
      course: course._id,
      title: title.trim(),
      description: description || '',
      order: Number(moduleOrder),
      status: 'published',
    });

    return res.status(201).json({
      success: true,
      message: 'Module created successfully.',
      module,
    });
  } catch (error) {
    console.error('createModule Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating module.',
      error: error.message,
    });
  }
};

/**
 * @desc    Update a module
 * @route   PUT /api/modules/:id
 * @access  Private (Teacher owner, Admin)
 */
const updateModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id).populate('course');
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

    const allowedFields = ['title', 'description', 'order', 'status', 'prerequisites'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        module[field] = req.body[field];
      }
    });

    await module.save();

    return res.status(200).json({
      success: true,
      message: 'Module updated successfully.',
      module,
    });
  } catch (error) {
    console.error('updateModule Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating module.',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a module and cascade delete its lessons and quizzes
 * @route   DELETE /api/modules/:id
 * @access  Private (Teacher owner, Admin)
 */
const deleteModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id).populate('course');
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

    // Cascade delete lessons and quizzes
    const lessons = await Lesson.find({ module: module._id });
    const lessonIds = lessons.map((l) => l._id);

    const quizzes = await Quiz.find({ module: module._id });
    const quizIds = quizzes.map((q) => q._id);

    const questions = await Question.find({ quiz: { $in: quizIds } });
    const questionIds = questions.map((q) => q._id);

    await Promise.all([
      Module.findByIdAndDelete(module._id),
      Lesson.deleteMany({ module: module._id }),
      LessonProgress.deleteMany({ lesson: { $in: lessonIds } }),
      Quiz.deleteMany({ module: module._id }),
      Question.deleteMany({ _id: { $in: questionIds } }),
      AnswerOption.deleteMany({ question: { $in: questionIds } }),
      QuizAttempt.deleteMany({ module: module._id }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Module and associated content deleted successfully.',
    });
  } catch (error) {
    console.error('deleteModule Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting module.',
      error: error.message,
    });
  }
};

module.exports = {
  createModule,
  updateModule,
  deleteModule,
};
