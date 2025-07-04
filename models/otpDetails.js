const mongoose = require('mongoose');
const { utilityConstants } = require('../constants/constants');

const otpDetailsSchema = new mongoose.Schema(
  {
    identifier: { 
      type: String, 
      required: true,
      trim: true
    }, // email or mobile number
    identifierType: { 
      type: String, 
      required: true,
      enum: ['email', 'mobile']
    },
    otp: { 
      type: String, 
      required: true 
    },
    purpose: { 
      type: String, 
      required: true,
      enum: ['login', 'registration', 'password_reset']
    },
    attempts: { 
      type: Number, 
      default: 0 
    },
    maxAttempts: { 
      type: Number, 
      default: 3 
    },
    isUsed: { 
      type: Boolean, 
      default: false 
    },
    expiresAt: { 
      type: Date, 
      required: true,
      index: { expireAfterSeconds: 0 }
    },
    sessionToken: { 
      type: String, 
      default: null 
    }
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
otpDetailsSchema.index({ identifier: 1, identifierType: 1, purpose: 1 });
otpDetailsSchema.index({ sessionToken: 1 });
otpDetailsSchema.index({ isUsed: 1 });

module.exports = mongoose.model(
  utilityConstants.modelConfig.otpDetails.model,
  otpDetailsSchema,
  utilityConstants.modelConfig.otpDetails.collection,
);
