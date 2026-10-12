const mongoose = require('mongoose');

const answerOptionSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
      index: true,
    },
    optionText: {
      type: String,
      required: [true, 'Option text is required'],
      trim: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    order: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
    collection: 'answerOptions',
  }
);

answerOptionSchema.index({ question: 1, isCorrect: 1 });
answerOptionSchema.index({ question: 1, order: 1 });

module.exports = mongoose.model('AnswerOption', answerOptionSchema);
