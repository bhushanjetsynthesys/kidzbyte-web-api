const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: [{
    type: String,
    required: true,
    trim: true
  }],
  correctAnswers: [{
    type: String,
    required: true,
    trim: true
  }]
}, {
  _id: true
});

const newsDetailsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    subTitle: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: ['Education', 'Technology', 'Health', 'Science', 'Tips & Tricks', 'Research', 'Announcement', 'General News']
    },
    type: {
      type: String,
      required: true,
      enum: ['Video', 'Image', 'Text']
    },
    content_url: {
      type: String,
      default: null,
      trim: true
    },
    upload_file: {
      type: String,
      default: null,
      trim: true
    },
    hasQuiz: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      required: true,
      enum: ['Draft', 'Published'],
      default: 'Draft'
    },
    author: {
      type: String,
      required: true,
      trim: true
    },
    quizQuestions: [quizQuestionSchema],
    publishedAt: {
      type: Date,
      default: null
    },
    viewCount: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    collection: 'newsDetails'
  }
);

// Index for better performance
newsDetailsSchema.index({ category: 1, status: 1 });
newsDetailsSchema.index({ author: 1 });
newsDetailsSchema.index({ publishedAt: -1 });

// Virtual for quiz count
newsDetailsSchema.virtual('quizCount').get(function() {
  return this.quizQuestions ? this.quizQuestions.length : 0;
});

// Pre-save middleware to set publishedAt when status changes to Published
newsDetailsSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'Published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('NewsDetails', newsDetailsSchema);
