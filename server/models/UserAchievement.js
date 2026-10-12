const mongoose = require('mongoose');

const userAchievementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    achievement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Achievement',
      required: true,
      index: true,
    },
    earnedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'userAchievements',
  }
);

// Prevent duplicate achievement unlocks per user
userAchievementSchema.index({ user: 1, achievement: 1 }, { unique: true });
userAchievementSchema.index({ achievement: 1, earnedAt: 1 });

module.exports = mongoose.model('UserAchievement', userAchievementSchema);
