const mongoose = require('mongoose');
const { utilityConstants } = require('../constants/constants');

const userDetailsSchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      default: null,
      lowercase: true,
      trim: true
    },
    mobileNumber: { 
      type: String, 
      default: null,
      trim: true
    },
    countryCode: { 
      type: String, 
      default: '+91',
      trim: true
    },
    fullName: { 
      type: String, 
      default: 'User',
      trim: true
    },
    isEmailVerified: { 
      type: Boolean, 
      default: false 
    },
    isMobileVerified: { 
      type: Boolean, 
      default: false 
    },
    lastLoginAt: { 
      type: Date, 
      default: null 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    deviceInfo: {
      deviceType: { type: String, default: null }, // mobile, tablet, desktop
      deviceId: { type: String, default: null },
      platform: { type: String, default: null }, // ios, android, web
      appVersion: { type: String, default: null }
    },
    age: {
      type: Number,
      default: null
    },
    institution: {
      type: String,
      default: null,
      trim: true
    },
    filePath: {
        type: String,
        default: null,
        trim: true
    }
  },
  {
    timestamps: true,
  }
);

// Create compound indexes for better query performance
userDetailsSchema.index({ email: 1 }, { unique: true, sparse: true });
userDetailsSchema.index({ mobileNumber: 1, countryCode: 1 }, { unique: true, sparse: true });
userDetailsSchema.index({ isActive: 1 });

module.exports = mongoose.model(
  utilityConstants.modelConfig.userDetails.model,
  userDetailsSchema,
  utilityConstants.modelConfig.userDetails.collection,
);
