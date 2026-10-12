const mongoose = require('mongoose');

const attemptAnswerSchema = new mongoose.Schema(
  {
    quizAttempt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuizAttempt',
      required: true,
      index: true,
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
      index: true,
    },
    selectedOption: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AnswerOption',
      default: null,
    },
    textAnswer: {
      type: String,
      default: '',
      trim: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    pointsAwarded: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'attemptAnswers',
  }
);

attemptAnswerSchema.index({ quizAttempt: 1, question: 1 });

module.exports = mongoose.model('AttemptAnswer', attemptAnswerSchema);
