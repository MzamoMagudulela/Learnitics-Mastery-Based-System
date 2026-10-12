const {
  Quiz,
  Question,
  AnswerOption,
  QuizAttempt,
  AttemptAnswer,
  Module,
  Course,
  UserProfile,
  Achievement,
  UserAchievement,
} = require('../models');
const { updateDailyStreak } = require('../utils/masteryCalculator');

/**
 * @desc    Get quiz questions for a student attempt (CRITICAL SECURITY: Strips all answers & isCorrect flags)
 * @route   GET /api/quizzes/:id/attempt
 * @access  Private (Student, Teacher, Admin)
 */
const getQuizForAttempt = async (req, res) => {
  try {
    const quizId = req.params.id;

    // 1. Fetch Quiz with its Module and Course
    const quiz = await Quiz.findById(quizId).populate('module').populate('course');
    if (!quiz || quiz.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found or not published.',
      });
    }

    // 2. Check Mastery Lockout: If student, verify that this module is unlocked
    if (req.user.role === 'student') {
      const currentModule = quiz.module;
      if (currentModule.order > 1) {
        // Find previous module
        const prevModule = await Module.findOne({
          course: quiz.course._id,
          order: currentModule.order - 1,
          status: 'published',
        });

        if (prevModule) {
          const prevQuiz = await Quiz.findOne({
            module: prevModule._id,
            status: 'published',
          });

          if (prevQuiz) {
            const passedPrev = await QuizAttempt.findOne({
              user: req.user._id,
              quiz: prevQuiz._id,
              passed: true,
            });

            if (!passedPrev) {
              return res.status(403).json({
                success: false,
                message: `This quiz is locked. You must master Module ${prevModule.order} ('${prevModule.title}') with >= 80% before attempting this quiz.`,
                isLocked: true,
              });
            }
          }
        }
      }
    }

    // 3. Fetch all questions for this quiz in order
    const questions = await Question.find({ quiz: quiz._id })
      .sort({ order: 1 })
      .lean();

    const questionIds = questions.map((q) => q._id);

    // =========================================================================
    // CRITICAL SECURITY ENFORCEMENT:
    // Only fetch options for MCQ questions.
    // Explicitly project ONLY: _id, question, optionText, order.
    // NEVER include 'isCorrect' or answer text for fill-in-the-blank questions!
    // =========================================================================
    const rawOptions = await AnswerOption.find({
      question: { $in: questionIds },
    })
      .select('_id question optionText order') // <-- STRICT PROJECTION: isCorrect EXCLUDED
      .lean();

    // Map sanitized questions to return to the client
    const sanitizedQuestions = questions.map((q) => {
      if (q.questionType === 'mcq') {
        // Return only option text and ID; no isCorrect flag
        const optionsForQ = rawOptions
          .filter((opt) => opt.question.toString() === q._id.toString())
          .map((opt) => ({
            _id: opt._id,
            optionText: opt.optionText,
            order: opt.order,
          }));

        return {
          _id: q._id,
          questionText: q.questionText,
          questionType: q.questionType,
          points: q.points,
          order: q.order,
          options: optionsForQ,
        };
      }

      // For fill-blank questions:
      // ZERO options or answer strings are sent to the client!
      return {
        _id: q._id,
        questionText: q.questionText,
        questionType: q.questionType,
        points: q.points,
        order: q.order,
        options: [], // Intentionally empty array
      };
    });

    // Count user's previous attempts
    const previousAttemptsCount = await QuizAttempt.countDocuments({
      user: req.user._id,
      quiz: quiz._id,
    });

    return res.status(200).json({
      success: true,
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        passingPercentage: quiz.passingPercentage || 80,
        timeLimit: quiz.timeLimit,
        totalQuestions: sanitizedQuestions.length,
        attemptNumber: previousAttemptsCount + 1,
      },
      questions: sanitizedQuestions,
    });
  } catch (error) {
    console.error('getQuizForAttempt Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error loading quiz questions.',
      error: error.message,
    });
  }
};

/**
 * @desc    Submit student quiz answers for server-side evaluation & mastery determination
 * @route   POST /api/quizzes/:id/submit
 * @access  Private (Student, Teacher, Admin)
 */
const submitQuizAttempt = async (req, res) => {
  try {
    const quizId = req.params.id;
    const { answers, timeSpent } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Answers must be provided as an array.',
      });
    }

    const quiz = await Quiz.findById(quizId).populate('module').populate('course');
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found.',
      });
    }

    // 1. Fetch all questions and answer options with ground-truth isCorrect flags
    const questions = await Question.find({ quiz: quiz._id }).sort({ order: 1 }).lean();
    const questionIds = questions.map((q) => q._id);

    // Here on the server only, we query the ground-truth isCorrect flags
    const groundTruthOptions = await AnswerOption.find({
      question: { $in: questionIds },
    }).lean();

    const previousAttemptsCount = await QuizAttempt.countDocuments({
      user: req.user._id,
      quiz: quiz._id,
    });
    const currentAttemptNumber = previousAttemptsCount + 1;

    let score = 0;
    let totalPoints = 0;
    const feedback = [];
    const attemptAnswersToSave = [];

    // Map submitted answers by questionId for O(1) lookup
    const answersMap = {};
    answers.forEach((ans) => {
      if (ans.questionId) {
        answersMap[ans.questionId.toString()] = ans;
      }
    });

    // 2. Perform Server-Side Grading
    for (const q of questions) {
      totalPoints += q.points;
      const studentAns = answersMap[q._id.toString()] || {};
      const optionsForQ = groundTruthOptions.filter(
        (opt) => opt.question.toString() === q._id.toString()
      );

      let isCorrect = false;
      let selectedOptionId = null;
      let textAnswer = '';
      let correctAnswerDisplay = '';
      let userAnswerDisplay = '';

      if (q.questionType === 'mcq') {
        const correctOpt = optionsForQ.find((opt) => opt.isCorrect === true);
        correctAnswerDisplay = correctOpt ? correctOpt.optionText : 'N/A';

        if (studentAns.selectedOptionId) {
          selectedOptionId = studentAns.selectedOptionId;
          const userSelectedOpt = optionsForQ.find(
            (opt) => opt._id.toString() === studentAns.selectedOptionId.toString()
          );
          userAnswerDisplay = userSelectedOpt ? userSelectedOpt.optionText : 'Invalid option selected';

          // Rule: MCQ = exact match on selected option
          if (correctOpt && studentAns.selectedOptionId.toString() === correctOpt._id.toString()) {
            isCorrect = true;
          }
        } else {
          userAnswerDisplay = 'No option selected';
        }
      } else if (q.questionType === 'fill-blank') {
        // Rule: Fill-blank = case-insensitive trimmed string match
        const correctOptions = optionsForQ.filter((opt) => opt.isCorrect === true);
        correctAnswerDisplay = correctOptions.map((opt) => opt.optionText).join(' / ');

        textAnswer = (studentAns.textAnswer || '').trim();
        userAnswerDisplay = textAnswer || 'No text provided';

        if (textAnswer) {
          const normalizedInput = textAnswer.toLowerCase();
          isCorrect = correctOptions.some(
            (opt) => opt.optionText.trim().toLowerCase() === normalizedInput
          );
        }
      }

      const pointsAwarded = isCorrect ? q.points : 0;
      score += pointsAwarded;

      // Collect feedback item
      feedback.push({
        questionId: q._id,
        questionText: q.questionText,
        questionType: q.questionType,
        correct: isCorrect,
        userAnswer: userAnswerDisplay,
        correctAnswer: correctAnswerDisplay,
        explanation: q.explanation || '',
        pointsAwarded,
        maxPoints: q.points,
      });

      // Prepare AttemptAnswer document for DB persistence
      attemptAnswersToSave.push({
        question: q._id,
        selectedOption: selectedOptionId,
        textAnswer,
        isCorrect,
        pointsAwarded,
      });
    }

    // 3. Compute Percentage and Mastery Pass Status
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    const passingThreshold = quiz.passingPercentage || 80;
    const passed = percentage >= passingThreshold;

    // 4. Create QuizAttempt Record
    const attempt = await QuizAttempt.create({
      user: req.user._id,
      quiz: quiz._id,
      module: quiz.module._id,
      course: quiz.course._id,
      attemptNumber: currentAttemptNumber,
      score,
      totalPoints,
      percentage,
      status: passed ? 'passed' : 'failed',
      passed,
      timeSpent: Number(timeSpent) || 0,
      completedAt: new Date(),
    });

    // Link attempt ID and persist AttemptAnswer docs
    const answersWithAttemptId = attemptAnswersToSave.map((a) => ({
      ...a,
      quizAttempt: attempt._id,
    }));
    await AttemptAnswer.insertMany(answersWithAttemptId);

    // Update student's daily study streak (max 1 increment per calendar day)
    await updateDailyStreak(req.user._id);

    // 5. Determine if Next Module is Unlocked
    let unlockedNextModule = false;
    let nextModule = null;

    if (passed) {
      nextModule = await Module.findOne({
        course: quiz.course._id,
        order: quiz.module.order + 1,
        status: 'published',
      }).lean();

      if (nextModule) {
        unlockedNextModule = true;
      }

      // Check & trigger gamification achievements asynchronously
      awardAchievements(req.user._id, quiz, percentage, currentAttemptNumber).catch(console.error);
    }

    return res.status(200).json({
      success: true,
      score,
      totalQuestions: questions.length,
      totalPoints,
      percentage,
      passed,
      passingThreshold,
      attemptNumber: currentAttemptNumber,
      attemptId: attempt._id,
      unlockedNextModule,
      nextModule: nextModule
        ? {
            _id: nextModule._id,
            title: nextModule.title,
            order: nextModule.order,
          }
        : null,
      feedback,
    });
  } catch (error) {
    console.error('submitQuizAttempt Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error processing quiz submission.',
      error: error.message,
    });
  }
};

/**
 * Helper to unlock achievements on quiz pass
 */
async function awardAchievements(userId, quiz, percentage, attemptNumber) {
  try {
    // 1. First Quiz Passed
    const firstQuizAch = await Achievement.findOne({ slug: 'first-quiz-passed' });
    if (firstQuizAch) {
      await UserAchievement.findOneAndUpdate(
        { user: userId, achievement: firstQuizAch._id },
        { user: userId, achievement: firstQuizAch._id, earnedAt: new Date(), course: quiz.course._id },
        { upsert: true }
      );
    }

    // 2. Score 100%
    if (percentage === 100) {
      const perfectScoreAch = await Achievement.findOne({ slug: 'score-100' });
      if (perfectScoreAch) {
        await UserAchievement.findOneAndUpdate(
          { user: userId, achievement: perfectScoreAch._id },
          { user: userId, achievement: perfectScoreAch._id, earnedAt: new Date(), course: quiz.course._id },
          { upsert: true }
        );
      }
    }

    // 3. First Attempt Ace
    if (attemptNumber === 1) {
      const aceAch = await Achievement.findOne({ slug: 'first-attempt-ace' });
      if (aceAch) {
        await UserAchievement.findOneAndUpdate(
          { user: userId, achievement: aceAch._id },
          { user: userId, achievement: aceAch._id, earnedAt: new Date(), course: quiz.course._id },
          { upsert: true }
        );
      }
    }

    // Update UserProfile points
    await UserProfile.findOneAndUpdate(
      { user: userId },
      { $inc: { totalPoints: percentage >= 80 ? 50 : 10 } }
    );
  } catch (err) {
    console.error('Achievement processing error:', err.message);
  }
}

/**
 * @desc    Get student's attempt history for a specific quiz
 * @route   GET /api/quizzes/:id/attempts
 * @access  Private (Student, Teacher, Admin)
 */
const getQuizAttempts = async (req, res) => {
  try {
    const quizId = req.params.id;

    // Filter by student, or if teacher/admin and student query provided
    const filter = { quiz: quizId };
    if (req.user.role === 'student' || !req.query.studentId) {
      filter.user = req.user._id;
    } else if (req.query.studentId) {
      filter.user = req.query.studentId;
    }

    const attempts = await QuizAttempt.find(filter)
      .sort({ attemptNumber: -1 })
      .lean();

    const passedAttempt = attempts.find((a) => a.passed === true);
    const bestScore = attempts.reduce(
      (best, a) => (a.percentage > best ? a.percentage : best),
      0
    );

    return res.status(200).json({
      success: true,
      count: attempts.length,
      hasPassed: !!passedAttempt,
      bestPercentage: bestScore,
      attempts,
    });
  } catch (error) {
    console.error('getQuizAttempts Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving quiz attempts.',
      error: error.message,
    });
  }
};

module.exports = {
  getQuizForAttempt,
  submitQuizAttempt,
  getQuizAttempts,
};
