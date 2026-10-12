const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    bio: {
      type: String,
      default: '',
    },
    headline: {
      type: String,
      default: '',
    },
    streakCount: {
      type: Number,
      default: 0,
    },
    lastActiveDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    totalPoints: {
      type: Number,
      default: 0,
      index: true,
    },
    masteryLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'master'],
      default: 'beginner',
      index: true,
    },
    preferences: {
      notifications: {
        type: Boolean,
        default: true,
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system',
      },
    },
  },
  {
    timestamps: true,
    collection: 'userProfiles',
  }
);

userProfileSchema.index({ user: 1, masteryLevel: 1 });

module.exports = mongoose.model('UserProfile', userProfileSchema);
