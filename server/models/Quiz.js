const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
  {
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    passingPercentage: {
      type: Number,
      default: 80, // Mastery standard: 80%
      min: 0,
      max: 100,
    },
    timeLimit: {
      type: Number, // in minutes (0 for unlimited)
      default: 0,
    },
    maxAttempts: {
      type: Number, // 0 for unlimited attempts in mastery-based learning
      default: 0,
    },
    order: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'quizzes',
  }
);

quizSchema.index({ module: 1, status: 1 });
quizSchema.index({ course: 1, status: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
