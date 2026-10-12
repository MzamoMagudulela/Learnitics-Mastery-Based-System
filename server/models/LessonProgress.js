const mongoose = require('mongoose');

const lessonProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      index: true,
    },
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
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed'],
      default: 'not-started',
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0,
    },
    clientSyncId: {
      type: String,
      sparse: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'lessonProgress',
  }
);

lessonProgressSchema.index({ user: 1, lesson: 1 }, { unique: true });
lessonProgressSchema.index({ user: 1, course: 1, status: 1 });
lessonProgressSchema.index({ user: 1, module: 1, status: 1 });

module.exports = mongoose.model('LessonProgress', lessonProgressSchema);
