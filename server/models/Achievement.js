const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Achievement title is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Achievement description is required'],
    },
    badgeIcon: {
      type: String,
      required: true,
      default: 'Award',
    },
    category: {
      type: String,
      enum: ['quiz', 'streak', 'course', 'mastery', 'general'],
      default: 'general',
      index: true,
    },
    criteriaType: {
      type: String,
      enum: [
        'quiz_passed',
        'streak_days',
        'perfect_score',
        'course_completed',
        'quiz_count',
        'speed_learner',
        'mastery_achieved',
        'first_attempt_pass',
      ],
      required: true,
      index: true,
    },
    criteriaValue: {
      type: Number,
      required: true,
      default: 1,
    },
    points: {
      type: Number,
      default: 50,
    },
  },
  {
    timestamps: true,
    collection: 'achievements',
  }
);

module.exports = mongoose.model('Achievement', achievementSchema);
