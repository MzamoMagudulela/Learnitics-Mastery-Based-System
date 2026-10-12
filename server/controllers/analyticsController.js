const mongoose = require('mongoose');
const {
  User,
  UserProfile,
  Course,
  Module,
  Lesson,
  LessonProgress,
  Quiz,
  Question,
  AnswerOption,
  QuizAttempt,
  AttemptAnswer,
  CourseEnrollment,
  Achievement,
  UserAchievement,
} = require('../models');

/**
 * @desc    Get student personalized dashboard analytics
 * @route   GET /api/analytics/student
 * @access  Private (Student, Teacher, Admin)
 */
const getStudentAnalytics = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    // 1. Course Enrollment Aggregations (Active, Completed, Average Progress)
    const enrollmentStats = await CourseEnrollment.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalEnrolled: { $sum: 1 },
          activeCourses: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
          completedCourses: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          averageProgress: { $avg: '$progressPercentage' },
        },
      },
    ]);

    const stats = enrollmentStats[0] || {
      totalEnrolled: 0,
      activeCourses: 0,
      completedCourses: 0,
      averageProgress: 0,
    };

    // 2. Per-Course Learning Goals
    const learningGoals = await CourseEnrollment.aggregate([
      { $match: { user: userId } },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseDetails',
        },
      },
      { $unwind: '$courseDetails' },
      {
        $lookup: {
          from: 'users',
          localField: 'courseDetails.instructor',
          foreignField: '_id',
          as: 'instructorDetails',
        },
      },
      { $unwind: { path: '$instructorDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          courseId: '$courseDetails._id',
          title: '$courseDetails.title',
          thumbnail: '$courseDetails.thumbnail',
          category: '$courseDetails.category',
          instructorName: '$instructorDetails.name',
          status: '$status',
          progressPercentage: '$progressPercentage',
          enrolledAt: '$enrolledAt',
          lastAccessedAt: '$lastAccessedAt',
        },
      },
      { $sort: { lastAccessedAt: -1 } },
    ]);

    // 3. Consecutive Study Streak Calculation from Activity Timestamps
    const [lessonDates, quizDates, profile] = await Promise.all([
      LessonProgress.aggregate([
        { $match: { user: userId } },
        {
          $project: {
            dateStr: {
              $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' },
            },
          },
        },
        { $group: { _id: '$dateStr' } },
      ]),
      QuizAttempt.aggregate([
        { $match: { user: userId } },
        {
          $project: {
            dateStr: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
          },
        },
        { $group: { _id: '$dateStr' } },
      ]),
      UserProfile.findOne({ user: userId }).lean(),
    ]);

    // Combine distinct activity dates
    const activityDateSet = new Set([
      ...lessonDates.map((d) => d._id),
      ...quizDates.map((d) => d._id),
    ]);

    // Compute streak backwards from today
    let calculatedStreak = 0;
    const now = new Date();
    let checkDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // Check if learned today; if not, check if learned yesterday to maintain streak
    const todayStr = checkDate.toISOString().split('T')[0];
    const yesterday = new Date(checkDate);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (activityDateSet.has(todayStr)) {
      calculatedStreak++;
      checkDate.setUTCDate(checkDate.getUTCDate() - 1);
      while (activityDateSet.has(checkDate.toISOString().split('T')[0])) {
        calculatedStreak++;
        checkDate.setUTCDate(checkDate.getUTCDate() - 1);
      }
    } else if (activityDateSet.has(yesterdayStr)) {
      calculatedStreak++;
      checkDate = new Date(yesterday);
      checkDate.setUTCDate(checkDate.getUTCDate() - 1);
      while (activityDateSet.has(checkDate.toISOString().split('T')[0])) {
        calculatedStreak++;
        checkDate.setUTCDate(checkDate.getUTCDate() - 1);
      }
    }

    // Prefer verified profile streak count if higher or matching
    const studyStreak = Math.max(calculatedStreak, profile?.streakCount || 0);

    // 4. Recent Achievements
    const recentAchievements = await UserAchievement.find({ user: userId })
      .populate('achievement')
      .populate('course', 'title')
      .sort({ earnedAt: -1 })
      .limit(6)
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        activeCourses: stats.activeCourses,
        completedCourses: stats.completedCourses,
        totalEnrolled: stats.totalEnrolled,
        averageProgress: Math.round(stats.averageProgress || 0),
        studyStreak,
        totalPoints: profile?.totalPoints || 0,
        masteryLevel: profile?.masteryLevel || 'beginner',
        learningGoals,
        recentAchievements: recentAchievements.map((ua) => ({
          id: ua.achievement?._id,
          title: ua.achievement?.title,
          description: ua.achievement?.description,
          badgeIcon: ua.achievement?.badgeIcon,
          points: ua.achievement?.points,
          category: ua.achievement?.category,
          earnedAt: ua.earnedAt,
          courseTitle: ua.course?.title || null,
        })),
      },
    });
  } catch (error) {
    console.error('getStudentAnalytics Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving student analytics.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get teacher analytics for a course: enrolled students, miss-rate heatmap, and performance trend
 * @route   GET /api/analytics/teacher/:courseId
 * @access  Private (Teacher, Admin)
 */
const getTeacherAnalytics = async (req, res) => {
  try {
    const { courseId } = req.params;
    const courseObjId = new mongoose.Types.ObjectId(courseId);

    const course = await Course.findById(courseId).lean();
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }

    // Role check: Allow authorized teachers and administrators
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Teacher or Administrator role required.',
      });
    }

    // 1. Enrolled Students with Average Scores and Progress
    const enrolledStudents = await CourseEnrollment.aggregate([
      { $match: { course: courseObjId } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'student',
        },
      },
      { $unwind: '$student' },
      {
        $lookup: {
          from: 'quizAttempts',
          let: { studentId: '$user', courseId: '$course' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$user', '$$studentId'] },
                    { $eq: ['$course', '$$courseId'] },
                  ],
                },
              },
            },
          ],
          as: 'attempts',
        },
      },
      {
        $project: {
          studentId: '$student._id',
          name: '$student.name',
          email: '$student.email',
          avatar: '$student.avatar',
          status: '$status',
          progressPercentage: '$progressPercentage',
          enrolledAt: '$enrolledAt',
          lastAccessedAt: '$lastAccessedAt',
          totalAttempts: { $size: '$attempts' },
          avgScore: { $ifNull: [{ $avg: '$attempts.percentage' }, 0] },
          passedQuizzes: {
            $size: {
              $filter: {
                input: '$attempts',
                as: 'att',
                cond: { $eq: ['$$att.passed', true] },
              },
            },
          },
        },
      },
      { $sort: { progressPercentage: -1 } },
    ]);

    // 2. Per-Question Miss-Rate HEATMAP Data
    // Aggregates AttemptAnswer joined with Question to calculate the percentage of attempts that answered wrong
    const missRateHeatmap = await AttemptAnswer.aggregate([
      {
        $lookup: {
          from: 'quizAttempts',
          localField: 'quizAttempt',
          foreignField: '_id',
          as: 'attempt',
        },
      },
      { $unwind: '$attempt' },
      { $match: { 'attempt.course': courseObjId } },
      {
        $group: {
          _id: '$question',
          totalAnswers: { $sum: 1 },
          wrongCount: {
            $sum: { $cond: [{ $eq: ['$isCorrect', false] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'questions',
          localField: '_id',
          foreignField: '_id',
          as: 'questionDetails',
        },
      },
      { $unwind: '$questionDetails' },
      {
        $lookup: {
          from: 'quizzes',
          localField: 'questionDetails.quiz',
          foreignField: '_id',
          as: 'quizDetails',
        },
      },
      { $unwind: { path: '$quizDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          questionId: '$_id',
          questionText: '$questionDetails.questionText',
          questionType: '$questionDetails.questionType',
          quizTitle: '$quizDetails.title',
          totalAnswers: 1,
          wrongCount: 1,
          missRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$wrongCount', { $max: ['$totalAnswers', 1] }] },
                  100,
                ],
              },
              1,
            ],
          },
        },
      },
      { $sort: { missRate: -1 } }, // High miss rates first for the heatmap
    ]);

    // 3. Class Performance Trend Over Time
    const performanceTrend = await QuizAttempt.aggregate([
      { $match: { course: courseObjId } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          avgPercentage: { $avg: '$percentage' },
          attemptCount: { $sum: 1 },
          passedCount: {
            $sum: { $cond: [{ $eq: ['$passed', true] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          date: '$_id',
          avgPercentage: { $round: ['$avgPercentage', 1] },
          attemptCount: 1,
          passedCount: 1,
          passRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$passedCount', { $max: ['$attemptCount', 1] }] },
                  100,
                ],
              },
              1,
            ],
          },
        },
      },
      { $sort: { date: 1 } },
    ]);

    return res.status(200).json({
      success: true,
      courseTitle: course.title,
      enrolledStudents,
      missRateHeatmap,
      performanceTrend,
    });
  } catch (error) {
    console.error('getTeacherAnalytics Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving teacher analytics.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get system-wide administrative KPI metrics, course distribution & user distribution
 * @route   GET /api/analytics/admin
 * @access  Private (Admin only)
 */
const getAdminAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 1. 4 KPIs (totalUsers, totalCourses, activeStudents in last 30d, totalTeachers)
    const [totalUsers, totalCourses, totalTeachers, activeStudentsCount] =
      await Promise.all([
        User.countDocuments(),
        Course.countDocuments(),
        User.countDocuments({ role: 'teacher' }),
        CourseEnrollment.distinct('user', {
          lastAccessedAt: { $gte: thirtyDaysAgo },
        }).then((arr) => arr.length),
      ]);

    // 2. Course Distribution for Pie Chart (Enrollment percentages per course)
    const totalEnrollments = await CourseEnrollment.countDocuments();

    const courseDistributionRaw = await CourseEnrollment.aggregate([
      {
        $group: {
          _id: '$course',
          enrollmentCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'courseDetails',
        },
      },
      { $unwind: '$courseDetails' },
      {
        $project: {
          courseId: '$_id',
          title: '$courseDetails.title',
          category: '$courseDetails.category',
          enrollmentCount: 1,
        },
      },
      { $sort: { enrollmentCount: -1 } },
    ]);

    const courseDistribution = courseDistributionRaw.map((c) => ({
      courseId: c.courseId,
      title: c.title,
      category: c.category,
      enrollmentCount: c.enrollmentCount,
      percentage:
        totalEnrollments > 0
          ? Math.round((c.enrollmentCount / totalEnrollments) * 1000) / 10
          : 0,
    }));

    // 3. User Role Distribution for Bar Chart (Students, Teachers, Admins)
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    const roleMap = { student: 0, teacher: 0, admin: 0 };
    roleStats.forEach((r) => {
      if (roleMap[r._id] !== undefined) {
        roleMap[r._id] = r.count;
      }
    });

    const userRoleDistribution = [
      { role: 'student', name: 'Students', count: roleMap.student },
      { role: 'teacher', name: 'Teachers', count: roleMap.teacher },
      { role: 'admin', name: 'Administrators', count: roleMap.admin },
    ];

    return res.status(200).json({
      success: true,
      kpis: {
        totalUsers,
        totalCourses,
        activeStudents: activeStudentsCount,
        totalTeachers,
      },
      courseDistribution,
      userRoleDistribution,
    });
  } catch (error) {
    console.error('getAdminAnalytics Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving admin analytics.',
      error: error.message,
    });
  }
};

module.exports = {
  getStudentAnalytics,
  getTeacherAnalytics,
  getAdminAnalytics,
};
