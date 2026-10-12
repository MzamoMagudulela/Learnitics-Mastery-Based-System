const {
  Lesson,
  LessonProgress,
  CourseEnrollment,
  Quiz,
  Question,
  AnswerOption,
  QuizAttempt,
  AttemptAnswer,
  Achievement,
  UserAchievement,
} = require('../models');

const { updateDailyStreak } = require('../utils/masteryCalculator');

/**
 * Award achievements helper for quiz passes
 */
const awardAchievements = async (userId, quiz, percentage) => {
  try {
    const firstQuizAch = await Achievement.findOne({ slug: 'first-quiz-passed' });
    if (firstQuizAch) {
      await UserAchievement.findOneAndUpdate(
        { user: userId, achievement: firstQuizAch._id },
        { user: userId, achievement: firstQuizAch._id, earnedAt: new Date() },
        { upsert: true, new: true }
      );
    }

    if (percentage === 100) {
      const perfectAch = await Achievement.findOne({ slug: 'score-100' });
      if (perfectAch) {
        await UserAchievement.findOneAndUpdate(
          { user: userId, achievement: perfectAch._id },
          { user: userId, achievement: perfectAch._id, earnedAt: new Date() },
          { upsert: true, new: true }
        );
      }
    }
  } catch (err) {
    console.error('awardAchievements Error:', err);
  }
};

/**
 * @desc    Sync batched offline lesson progress and quiz attempts
 * @route   POST /api/sync
 * @access  Private (Authenticated student)
 */
const syncOfflineData = async (req, res) => {
  try {
    const userId = req.user._id;
    const { lessonProgress = [], quizAttempts = [] } = req.body;

    const syncResults = {
      lessonProgress: [],
      quizAttempts: [],
    };

    // -------------------------------------------------------------------------
    // 1. PROCESS BATCHED LESSON PROGRESS UPDATES (With Deduplication)
    // -------------------------------------------------------------------------
    for (const item of lessonProgress) {
      const {
        clientSyncId,
        lessonId,
        percentCompleted = 100,
        status = 'completed',
        timeSpent = 0,
        completedAt,
      } = item;

      if (!lessonId) continue;

      // Deduplication check by clientSyncId
      if (clientSyncId) {
        const existingSync = await LessonProgress.findOne({
          user: userId,
          clientSyncId,
        });

        if (existingSync) {
          syncResults.lessonProgress.push({
            clientSyncId,
            lessonId,
            status: 'already-synced',
            deduplicated: true,
          });
          continue;
        }
      }

      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        syncResults.lessonProgress.push({
          clientSyncId,
          lessonId,
          status: 'error',
          message: 'Lesson not found.',
        });
        continue;
      }

      const isCompleted = percentCompleted >= 100 || status === 'completed';

      const progressRecord = await LessonProgress.findOneAndUpdate(
        { user: userId, lesson: lessonId },
        {
          user: userId,
          lesson: lessonId,
          module: lesson.module,
          course: lesson.course,
          percentCompleted: Math.min(100, Math.max(0, percentCompleted)),
          status: isCompleted ? 'completed' : 'in-progress',
          timeSpent,
          completedAt: isCompleted ? (completedAt ? new Date(completedAt) : new Date()) : null,
          ...(clientSyncId ? { clientSyncId } : {}),
        },
        { upsert: true, new: true }
      );

      // Recalculate course enrollment progress
      const allCourseLessons = await Lesson.find({ course: lesson.course }).select('_id');
      const totalLessons = allCourseLessons.length;
      if (totalLessons > 0) {
        const completedLessons = await LessonProgress.countDocuments({
          user: userId,
          course: lesson.course,
          status: 'completed',
        });
        const completionPercent = Math.round((completedLessons / totalLessons) * 100);

        await CourseEnrollment.findOneAndUpdate(
          { user: userId, course: lesson.course },
          {
            progressPercentage: completionPercent,
            ...(completionPercent >= 100 ? { status: 'completed', completedAt: new Date() } : {}),
          }
        );
      }

      await updateDailyStreak(userId);

      syncResults.lessonProgress.push({
        clientSyncId,
        lessonId,
        progressId: progressRecord._id,
        status: 'synced',
        percentCompleted: progressRecord.percentCompleted,
      });
    }

    // -------------------------------------------------------------------------
    // 2. PROCESS BATCHED QUIZ ATTEMPTS (With Server-Side Grading & Deduplication)
    // -------------------------------------------------------------------------
    for (const attempt of quizAttempts) {
      const {
        clientSyncId,
        quizId,
        answers = [],
        timeSpent = 0,
        completedAt,
      } = attempt;

      if (!quizId) continue;

      // Deduplication check by clientSyncId
      if (clientSyncId) {
        const existingAttempt = await QuizAttempt.findOne({
          user: userId,
          clientSyncId,
        });

        if (existingAttempt) {
          syncResults.quizAttempts.push({
            clientSyncId,
            quizId,
            attemptId: existingAttempt._id,
            score: existingAttempt.score,
            percentage: existingAttempt.percentage,
            passed: existingAttempt.passed,
            status: 'already-synced',
            deduplicated: true,
          });
          continue;
        }
      }

      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        syncResults.quizAttempts.push({
          clientSyncId,
          quizId,
          status: 'error',
          message: 'Quiz not found.',
        });
        continue;
      }

      // Fetch questions and answers for grading
      const questions = await Question.find({ quiz: quizId });
      const questionIds = questions.map((q) => q._id);
      const answerOptions = await AnswerOption.find({ question: { $in: questionIds } });

      let earnedScore = 0;
      let totalPossiblePoints = 0;
      const attemptAnswersToInsert = [];

      for (const q of questions) {
        const qPoints = q.points || 1;
        totalPossiblePoints += qPoints;

        const studentAns = answers.find(
          (a) => a.questionId?.toString() === q._id.toString()
        ) || {};

        let isCorrect = false;
        let pointsAwarded = 0;

        if (q.questionType === 'mcq') {
          const selectedOptId = studentAns.selectedOptionId;
          const correctOpt = answerOptions.find(
            (opt) => opt.question.toString() === q._id.toString() && opt.isCorrect
          );

          if (selectedOptId && correctOpt && selectedOptId.toString() === correctOpt._id.toString()) {
            isCorrect = true;
            pointsAwarded = qPoints;
            earnedScore += qPoints;
          }

          attemptAnswersToInsert.push({
            question: q._id,
            selectedOption: selectedOptId || null,
            textAnswer: null,
            isCorrect,
            pointsAwarded,
          });
        } else if (q.questionType === 'fill-blank') {
          const rawText = (studentAns.textAnswer || '').trim().toLowerCase();
          const correctOpts = answerOptions.filter(
            (opt) => opt.question.toString() === q._id.toString() && opt.isCorrect
          );

          const matched = correctOpts.some(
            (opt) => (opt.optionText || '').trim().toLowerCase() === rawText
          );

          if (rawText && matched) {
            isCorrect = true;
            pointsAwarded = qPoints;
            earnedScore += qPoints;
          }

          attemptAnswersToInsert.push({
            question: q._id,
            selectedOption: null,
            textAnswer: studentAns.textAnswer || '',
            isCorrect,
            pointsAwarded,
          });
        }
      }

      const passingScore = quiz.passingScore || 80;
      const percentage = totalPossiblePoints > 0
        ? Math.round((earnedScore / totalPossiblePoints) * 100)
        : 0;
      const passed = percentage >= passingScore;

      const previousAttemptsCount = await QuizAttempt.countDocuments({
        user: userId,
        quiz: quizId,
      });

      const newAttempt = await QuizAttempt.create({
        user: userId,
        quiz: quizId,
        attemptNumber: previousAttemptsCount + 1,
        score: earnedScore,
        totalPoints: totalPossiblePoints,
        percentage,
        status: passed ? 'passed' : 'failed',
        passed,
        timeSpent,
        completedAt: completedAt ? new Date(completedAt) : new Date(),
        ...(clientSyncId ? { clientSyncId } : {}),
      });

      const attemptAnswersWithAttemptId = attemptAnswersToInsert.map((ans) => ({
        ...ans,
        quizAttempt: newAttempt._id,
      }));
      await AttemptAnswer.insertMany(attemptAnswersWithAttemptId);

      await updateDailyStreak(userId);

      if (passed) {
        awardAchievements(userId, quiz, percentage).catch(console.error);
      }

      syncResults.quizAttempts.push({
        clientSyncId,
        quizId,
        attemptId: newAttempt._id,
        score: earnedScore,
        totalPoints: totalPossiblePoints,
        percentage,
        passed,
        status: 'synced',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Offline synchronization completed successfully.',
      syncedCounts: {
        lessonProgress: syncResults.lessonProgress.length,
        quizAttempts: syncResults.quizAttempts.length,
      },
      results: syncResults,
    });
  } catch (error) {
    console.error('syncOfflineData Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during offline sync.',
      error: error.message,
    });
  }
};

module.exports = {
  syncOfflineData,
};
