const { utilityConstants } = require('../constants/constants');
const { logger } = require('../utils/logger');
const { otpDetails } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

// Enhanced error handling wrapper
const handleDatabaseOperation = async (operation, operationName) => {
  try {
    const result = await operation();
    return result;
  } catch (error) {
    logger.error(`Error in ${operationName}:`, {
      error: error.message,
      stack: error.stack,
      operation: operationName
    });
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      throw new AppError(errors.join(', '), 400, 'VALIDATION_ERROR');
    }
    
    if (error.name === 'CastError') {
      throw new AppError('Invalid data format', 400, 'CAST_ERROR');
    }
    
    throw new AppError('Database operation failed', 500, 'DATABASE_ERROR');
  }
};

exports.createOTP = async (data) => {
  logger.info('ORM::otpDetails@createOTP');
  
  return handleDatabaseOperation(async () => {
    // Validate required fields
    if (!data.identifier || !data.otp || !data.expiresAt) {
      throw new AppError('Required OTP fields are missing', 400, 'INVALID_INPUT');
    }
    
    const otpEntry = new otpDetails(data);
    const result = await otpEntry.save();
    return result.toObject();
  }, 'createOTP');
};

exports.findValidOTP = async (identifier, identifierType, purpose, sessionToken = null) => {
  logger.info('ORM::otpDetails@findValidOTP');
  
  if (!identifier || !identifierType || !purpose) {
    throw new AppError('Required OTP search parameters are missing', 400, 'INVALID_INPUT');
  }
  
  return handleDatabaseOperation(async () => {
    const query = {
      identifier: identifier.trim(),
      identifierType,
      purpose,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    };
    
    if (sessionToken) {
      query.sessionToken = sessionToken;
    }
    
    const otp = await otpDetails
      .findOne(query)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
      
    return otp;
  }, 'findValidOTP');
};

exports.updateOTPAttempts = async (otpId, attempts) => {
  logger.info('ORM::otpDetails@updateOTPAttempts');
  
  if (!otpId || attempts < 0) {
    throw new AppError('Valid OTP ID and attempts count are required', 400, 'INVALID_INPUT');
  }
  
  return handleDatabaseOperation(async () => {
    const result = await otpDetails
      .findByIdAndUpdate(
        otpId, 
        { 
          attempts,
          updatedAt: new Date()
        }, 
        { new: true }
      )
      .lean()
      .exec();
      
    if (!result) {
      throw new AppError('OTP record not found', 404, 'OTP_NOT_FOUND');
    }
    
    return result;
  }, 'updateOTPAttempts');
};

exports.markOTPAsUsed = async (otpId) => {
  logger.info('ORM::otpDetails@markOTPAsUsed');
  
  if (!otpId) {
    throw new AppError('OTP ID is required', 400, 'INVALID_INPUT');
  }
  
  return handleDatabaseOperation(async () => {
    const result = await otpDetails
      .findByIdAndUpdate(
        otpId, 
        { 
          isUsed: true,
          usedAt: new Date(),
          updatedAt: new Date()
        }, 
        { new: true }
      )
      .lean()
      .exec();
      
    if (!result) {
      throw new AppError('OTP record not found', 404, 'OTP_NOT_FOUND');
    }
    
    return result;
  }, 'markOTPAsUsed');
};

exports.deleteExpiredOTPs = async () => {
  logger.info('ORM::otpDetails@deleteExpiredOTPs');
  
  return handleDatabaseOperation(async () => {
    const result = await otpDetails
      .deleteMany({ expiresAt: { $lt: new Date() } })
      .exec();
      
    logger.info(`Deleted ${result.deletedCount} expired OTP records`);
    return result;
  }, 'deleteExpiredOTPs');
};

exports.checkOTPLimits = async (identifier, identifierType, purpose, timeWindow = 30) => {
  logger.info('ORM::otpDetails@checkOTPLimits');
  
  if (!identifier || !identifierType || !purpose) {
    throw new AppError('Required parameters for OTP limit check are missing', 400, 'INVALID_INPUT');
  }
  
  return handleDatabaseOperation(async () => {
    const timeThreshold = new Date(Date.now() - timeWindow * 60 * 1000);
    
    const count = await otpDetails
      .countDocuments({
        identifier: identifier.trim(),
        identifierType,
        purpose,
        createdAt: { $gte: timeThreshold }
      })
      .exec();
      
    return count;
  }, 'checkOTPLimits');
};

exports.findLatestOTP = async (identifier, identifierType, purpose) => {
  logger.info('ORM::otpDetails@findLatestOTP');
  
  if (!identifier || !identifierType || !purpose) {
    throw new AppError('Required parameters for finding latest OTP are missing', 400, 'INVALID_INPUT');
  }
  
  return handleDatabaseOperation(async () => {
    const query = {
      identifier: identifier.trim(),
      identifierType,
      purpose,
      isUsed: false
    };
    
    const otp = await otpDetails
      .findOne(query)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
      
    return otp;
  }, 'findLatestOTP');
};
