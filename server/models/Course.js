const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    thumbnail: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    price: {
      type: Number,
      default: 0,
    },
    passingScore: {
      type: Number,
      default: 80, // 80% mastery threshold
      min: 50,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

courseSchema.index({ instructor: 1, status: 1 });
courseSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('Course', courseSchema);
