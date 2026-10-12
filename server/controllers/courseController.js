const {
  Course,
  Module,
  Lesson,
  Quiz,
  QuizAttempt,
  CourseEnrollment,
  LessonProgress,
  Question,
  AnswerOption,
} = require('../models');

/**
 * Generate URL-friendly slug
 */
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

/**
 * @desc    Get all active courses with teacher name & enrollment count
 * @route   GET /api/courses
 * @access  Public
 */
const getCourses = async (req, res) => {
  try {
    const filter = { status: 'published' };

    // If teacher wants to see all their own courses (drafts included)
    if (req.query.instructor) {
      filter.instructor = req.query.instructor;
      delete filter.status; // allow instructor to see drafts
    }

    const courses = await Course.find(filter)
      .populate('instructor', 'name email avatar')
      .sort({ createdAt: -1 })
      .lean();

    // Attach enrollment counts and module counts to each course
    const courseIds = courses.map((c) => c._id);

    const enrollmentCounts = await CourseEnrollment.aggregate([
      { $match: { course: { $in: courseIds } } },
      { $group: { _id: '$course', count: { $sum: 1 } } },
    ]);

    const moduleCounts = await Module.aggregate([
      { $match: { course: { $in: courseIds }, status: 'published' } },
      { $group: { _id: '$course', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    enrollmentCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    const moduleMap = {};
    moduleCounts.forEach((item) => {
      moduleMap[item._id.toString()] = item.count;
    });

    const coursesWithStats = courses.map((course) => ({
      ...course,
      enrollmentCount: countMap[course._id.toString()] || 0,
      totalModules: moduleMap[course._id.toString()] || 0,
    }));

    return res.status(200).json({
      success: true,
      count: coursesWithStats.length,
      courses: coursesWithStats,
    });
  } catch (error) {
    console.error('getCourses Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching courses.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get course by ID or Slug with complete module/lesson tree & mastery lock status
 * @route   GET /api/courses/:id
 * @access  Public / Optional Auth (personalizes locked/unlocked tree for logged-in student)
 */
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    // Support lookup by either MongoDB ObjectId or URL slug
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };

    const course = await Course.findOne(query)
      .populate('instructor', 'name email avatar headline')
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }

    // 1. Fetch all modules in sequential order
    const modules = await Module.find({ course: course._id, status: 'published' })
      .sort({ order: 1 })
      .lean();

    const moduleIds = modules.map((m) => m._id);

    // 2. Fetch all lessons and quizzes for these modules
    const [allLessons, allQuizzes] = await Promise.all([
      Lesson.find({ module: { $in: moduleIds } }).sort({ order: 1 }).lean(),
      Quiz.find({ module: { $in: moduleIds }, status: 'published' }).lean(),
    ]);

    // 3. User Context (Student / Teacher / Admin / Guest)
    const user = req.user;
    const isPrivileged = user && (user.role === 'admin' || (user.role === 'teacher' && course.instructor._id.toString() === user._id.toString()));

    let studentEnrollment = null;
    let studentLessonProgressMap = {};
    let studentQuizAttemptsMap = {};

    if (user && !isPrivileged) {
      // Fetch student enrollment
      studentEnrollment = await CourseEnrollment.findOne({
        user: user._id,
        course: course._id,
      }).lean();

      // Fetch student lesson progress
      const lessonProgressList = await LessonProgress.find({
        user: user._id,
        course: course._id,
      }).lean();

      lessonProgressList.forEach((lp) => {
        studentLessonProgressMap[lp.lesson.toString()] = lp;
      });

      // Fetch student quiz attempts for all quizzes in this course
      const quizIds = allQuizzes.map((q) => q._id);
      const quizAttempts = await QuizAttempt.find({
        user: user._id,
        quiz: { $in: quizIds },
      })
        .sort({ createdAt: -1 })
        .lean();

      // Group attempts by quiz
      quizAttempts.forEach((attempt) => {
        const qId = attempt.quiz.toString();
        if (!studentQuizAttemptsMap[qId]) {
          studentQuizAttemptsMap[qId] = [];
        }
        studentQuizAttemptsMap[qId].push(attempt);
      });
    }

    // 4. Build Module → Lesson tree and compute locked/unlocked mastery status
    let previousModuleMastered = true; // Module 1 is always unlocked

    const moduleTree = modules.map((moduleItem, index) => {
      // Find lessons for this module
      const moduleLessons = allLessons
        .filter((l) => l.module.toString() === moduleItem._id.toString())
        .map((lessonItem) => {
          const progress = studentLessonProgressMap[lessonItem._id.toString()];
          return {
            _id: lessonItem._id,
            title: lessonItem.title,
            contentType: lessonItem.contentType,
            duration: lessonItem.duration,
            order: lessonItem.order,
            isOptional: lessonItem.isOptional,
            // Include videoUrl and full content only if module is accessible
            content: previousModuleMastered || isPrivileged ? lessonItem.content : '',
            videoUrl: previousModuleMastered || isPrivileged ? lessonItem.videoUrl : '',
            progress: progress
              ? {
                  status: progress.status,
                  completedAt: progress.completedAt,
                  timeSpent: progress.timeSpent,
                }
              : { status: 'not-started', completedAt: null, timeSpent: 0 },
          };
        });

      // Find quiz for this module
      const moduleQuiz = allQuizzes.find(
        (q) => q.module.toString() === moduleItem._id.toString()
      );

      let quizInfo = null;
      let currentModuleQuizPassed = false;

      if (moduleQuiz) {
        const attempts = studentQuizAttemptsMap[moduleQuiz._id.toString()] || [];
        const bestAttempt = attempts.reduce(
          (best, cur) => (cur.percentage > (best ? best.percentage : -1) ? cur : best),
          null
        );

        const passingThreshold = moduleQuiz.passingPercentage || course.passingScore || 80;
        currentModuleQuizPassed = attempts.some(
          (a) => a.passed === true || a.percentage >= passingThreshold
        );

        quizInfo = {
          _id: moduleQuiz._id,
          title: moduleQuiz.title,
          passingPercentage: passingThreshold,
          timeLimit: moduleQuiz.timeLimit,
          attemptsCount: attempts.length,
          bestScore: bestAttempt ? bestAttempt.score : 0,
          bestPercentage: bestAttempt ? bestAttempt.percentage : 0,
          passed: currentModuleQuizPassed,
          lastAttemptDate: attempts.length > 0 ? attempts[0].createdAt : null,
        };
      }

      // --- MASTERY LOCK/UNLOCK RULE ---
      // Module 1 (index 0) is ALWAYS unlocked.
      // Module N is unlocked ONLY if all previous modules up to N-1 met mastery.
      // (Specifically, Module N requires Module N-1's quiz to be passed with score >= 80)
      const isLocked = isPrivileged
        ? false
        : index === 0
        ? false
        : !previousModuleMastered;

      // Update condition for next module:
      // Next module (index + 1) will be unlocked ONLY IF:
      // 1. Current module was unlocked
      // 2. Current module's quiz was passed with >= 80% (or if module has no quiz, all lessons completed)
      if (isLocked) {
        previousModuleMastered = false;
      } else {
        if (moduleQuiz) {
          previousModuleMastered = currentModuleQuizPassed;
        } else {
          // If no quiz exists in this module, check if all mandatory lessons are completed
          const allMandatoryLessonsDone = moduleLessons.every(
            (l) => l.isOptional || l.progress.status === 'completed'
          );
          previousModuleMastered = allMandatoryLessonsDone;
        }
      }

      return {
        _id: moduleItem._id,
        title: moduleItem.title,
        description: moduleItem.description,
        order: moduleItem.order,
        isLocked,
        isCompleted: moduleQuiz ? currentModuleQuizPassed : false,
        lessonsCount: moduleLessons.length,
        lessons: moduleLessons,
        quiz: quizInfo,
      };
    });

    const enrollmentCount = await CourseEnrollment.countDocuments({
      course: course._id,
    });

    return res.status(200).json({
      success: true,
      course: {
        ...course,
        enrollmentCount,
        isEnrolled: !!studentEnrollment,
        enrollment: studentEnrollment || null,
        modules: moduleTree,
      },
    });
  } catch (error) {
    console.error('getCourseById Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving course details.',
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new course
 * @route   POST /api/courses
 * @access  Private (Teacher, Admin)
 */
const createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      level,
      thumbnail,
      price,
      passingScore,
      instructorId,
    } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide course title, description, and category.',
      });
    }

    // Generate unique slug
    let baseSlug = slugify(title);
    let slug = baseSlug;
    let count = 1;
    while (await Course.findOne({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }

    // Admin can specify instructor, teacher defaults to self
    let instructor = req.user._id;
    if (req.user.role === 'admin' && instructorId) {
      instructor = instructorId;
    }

    const course = await Course.create({
      title: title.trim(),
      slug,
      description: description.trim(),
      category: category.trim(),
      level: level || 'beginner',
      thumbnail: thumbnail || '',
      price: Number(price) || 0,
      passingScore: Number(passingScore) || 80,
      status: req.body.status || 'published',
      instructor,
    });

    return res.status(201).json({
      success: true,
      message: 'Course created successfully.',
      course,
    });
  } catch (error) {
    console.error('createCourse Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating course.',
      error: error.message,
    });
  }
};

/**
 * @desc    Update course
 * @route   PUT /api/courses/:id
 * @access  Private (Teacher owner, Admin)
 */
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }

    // Role check: Only admin or the course's teacher can update
    if (
      req.user.role !== 'admin' &&
      course.instructor &&
      course.instructor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not own this course.',
      });
    }

    const allowedUpdates = [
      'title',
      'description',
      'category',
      'level',
      'thumbnail',
      'price',
      'passingScore',
      'status',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        course[field] = req.body[field];
      }
    });

    if (req.body.title) {
      course.slug = slugify(req.body.title);
    }

    await course.save();

    return res.status(200).json({
      success: true,
      message: 'Course updated successfully.',
      course,
    });
  } catch (error) {
    console.error('updateCourse Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating course.',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete course and cascade delete child entities
 * @route   DELETE /api/courses/:id
 * @access  Private (Teacher owner, Admin)
 */
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }

    // Verify ownership
    if (
      req.user.role !== 'admin' &&
      course.instructor &&
      course.instructor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not own this course.',
      });
    }

    // Cascade delete: modules, lessons, quizzes, questions, answerOptions, enrollments
    const modules = await Module.find({ course: course._id });
    const moduleIds = modules.map((m) => m._id);

    const quizzes = await Quiz.find({ course: course._id });
    const quizIds = quizzes.map((q) => q._id);

    const questions = await Question.find({ quiz: { $in: quizIds } });
    const questionIds = questions.map((q) => q._id);

    await Promise.all([
      Course.findByIdAndDelete(course._id),
      Module.deleteMany({ course: course._id }),
      Lesson.deleteMany({ course: course._id }),
      LessonProgress.deleteMany({ course: course._id }),
      Quiz.deleteMany({ course: course._id }),
      Question.deleteMany({ _id: { $in: questionIds } }),
      AnswerOption.deleteMany({ question: { $in: questionIds } }),
      QuizAttempt.deleteMany({ course: course._id }),
      CourseEnrollment.deleteMany({ course: course._id }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Course and all associated content deleted successfully.',
    });
  } catch (error) {
    console.error('deleteCourse Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting course.',
      error: error.message,
    });
  }
};

/**
 * @desc    Enroll student in a course (prevents duplicate)
 * @route   POST /api/courses/:id/enroll
 * @access  Private (Student)
 */
const enrollCourse = async (req, res) => {
  try {
    const courseId = req.params.id;

    // Check if course exists and is published
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }

    if (course.status !== 'published' && req.user.role === 'student') {
      return res.status(400).json({
        success: false,
        message: 'Cannot enroll in an unpublished course.',
      });
    }

    // Prevent duplicate enrollment
    const existingEnrollment = await CourseEnrollment.findOne({
      user: req.user._id,
      course: course._id,
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course.',
        enrollment: existingEnrollment,
      });
    }

    const enrollment = await CourseEnrollment.create({
      user: req.user._id,
      course: course._id,
      status: 'active',
      progressPercentage: 0,
      enrolledAt: new Date(),
      lastAccessedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: `Enrolled successfully in ${course.title}.`,
      enrollment,
    });
  } catch (error) {
    // Catch duplicate key error if race condition occurs
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course.',
      });
    }
    console.error('enrollCourse Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error enrolling in course.',
      error: error.message,
    });
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
};
