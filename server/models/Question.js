const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      index: true,
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    questionType: {
      type: String,
      enum: ['mcq', 'fill-blank'],
      required: true,
      default: 'mcq',
      index: true,
    },
    explanation: {
      type: String,
      default: '',
    },
    points: {
      type: Number,
      default: 1,
      min: 1,
    },
    order: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
    collection: 'questions',
  }
);

questionSchema.index({ quiz: 1, order: 1 });

module.exports = mongoose.model('Question', questionSchema);
