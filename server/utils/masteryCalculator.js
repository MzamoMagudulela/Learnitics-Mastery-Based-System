const { UserProfile, Achievement, UserAchievement } = require('../models');

/**
 * Updates a student's study streak upon completing a quiz attempt or lesson.
 * Enforces one increment maximum per calendar day (UTC).
 * If consecutive: streak + 1. If gap day: resets streak to 1. If same day: unchanged.
 * @param {String|ObjectId} userId
 * @returns {Promise<Number>} Updated streak count
 */
const updateDailyStreak = async (userId) => {
  try {
    const profile = await UserProfile.findOne({ user: userId });
    if (!profile) return 0;

    const now = new Date();
    const lastActive = profile.lastActiveDate ? new Date(profile.lastActiveDate) : null;

    if (!lastActive) {
      profile.streakCount = 1;
      profile.lastActiveDate = now;
      await profile.save();
      return 1;
    }

    // Normalize to calendar day (YYYY-MM-DD)
    const nowDateStr = now.toISOString().split('T')[0];
    const lastDateStr = lastActive.toISOString().split('T')[0];

    if (nowDateStr === lastDateStr) {
      // Activity occurred on the SAME calendar day; do not increment, touch lastActiveDate
      profile.lastActiveDate = now;
      await profile.save();
      return profile.streakCount;
    }

    // Calculate difference in calendar days
    const nowDate = new Date(nowDateStr);
    const lastDate = new Date(lastDateStr);
    const diffDays = Math.round((nowDate - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive consecutive day
      profile.streakCount += 1;
    } else if (diffDays > 1) {
      // Gap detected (missed one or more days); streak resets to 1
      profile.streakCount = 1;
    }

    profile.lastActiveDate = now;
    await profile.save();

    // Trigger 5-Day Streak Achievement unlock
    if (profile.streakCount >= 5) {
      const streakAch = await Achievement.findOne({ slug: '5-day-streak' });
      if (streakAch) {
        await UserAchievement.findOneAndUpdate(
          { user: userId, achievement: streakAch._id },
          { user: userId, achievement: streakAch._id, earnedAt: new Date() },
          { upsert: true }
        );
      }
    }

    return profile.streakCount;
  } catch (error) {
    console.error('updateDailyStreak Error:', error);
    return 0;
  }
};

module.exports = {
  updateDailyStreak,
};
