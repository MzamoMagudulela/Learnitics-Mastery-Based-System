const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
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
      required: [true, 'Lesson title is required'],
      trim: true,
    },
    contentType: {
      type: String,
      enum: ['video', 'text'],
      required: true,
      default: 'text',
      index: true,
    },
    content: {
      type: String,
      default: '',
    },
    videoUrl: {
      type: String,
      default: '',
    },
    duration: {
      type: Number, // in minutes
      default: 10,
    },
    order: {
      type: Number,
      required: true,
      default: 1,
    },
    isOptional: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

lessonSchema.index({ module: 1, order: 1 });
lessonSchema.index({ course: 1, module: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);
