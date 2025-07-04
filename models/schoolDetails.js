const mongoose = require('mongoose');
const { utilityConstants } = require('../constants/constants');

const schoolDetailsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: 200
    }
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
schoolDetailsSchema.index({ name: 1 });

// Add to constants if not exists, otherwise use a default collection name
const modelName = 'SchoolDetails';
const collectionName = 'schoolDetails';

module.exports = mongoose.model(modelName, schoolDetailsSchema, collectionName);
