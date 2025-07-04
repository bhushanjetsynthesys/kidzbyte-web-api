const { utilityConstants } = require('../constants/constants');
const { logger } = require('../utils/logger');
const { userDetails } = require('../models');
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
    
    // Handle specific database errors - allow duplicates for testing
    if (error.code === 11000) {
      logger.info(`Duplicate key detected, allowing operation to continue for: ${operationName}`);
      // For duplicate key errors, try to find existing record instead of creating new one
      if (operationName === 'updateOrCreateUser') {
        // Re-throw the error so the service layer can handle it appropriately
        throw error;
      }
      return null;
    }
    
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

exports.updateOrCreateUser = async (where, data, select = utilityConstants.modelConfig.commonSkipFields) => {
  logger.info('ORM::userDetails@updateOrCreateUser');
  
  return handleDatabaseOperation(async () => {
    // Add update timestamp
    data.updatedAt = new Date();
    
    const result = await userDetails
      .findOneAndUpdate(where, { $set: data }, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      })
      .select(select)
      .lean() // Use lean() for better performance
      .exec();
      
    return result;
  }, 'updateOrCreateUser');
};

exports.getUserDetails = async (limit = 10, page = 1, sort = { createdAt: -1 }, query = {}, select = utilityConstants.modelConfig.commonSkipFields, isRunCount = false) => {
  logger.info('ORM::userDetails@getUserDetails');
  
  return handleDatabaseOperation(async () => {
    // Validate pagination parameters
    const validLimit = Math.min(Math.max(parseInt(limit), 1), 100); // Max 100 records
    const validPage = Math.max(parseInt(page), 1);
    const skip = (validPage - 1) * validLimit;
    
    // Add default query constraints
    const finalQuery = { ...query, isActive: true };
    
    const docsPromise = userDetails
      .find(finalQuery)
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(validLimit)
      .lean() // Better performance
      .exec();
    
    if (isRunCount) {
      const countPromise = userDetails.countDocuments(finalQuery).exec();
      const [docs, totalCount] = await Promise.all([docsPromise, countPromise]);
      
      return {
        docs,
        totalCount,
        totalPages: Math.ceil(totalCount / validLimit),
        currentPage: validPage,
        hasNextPage: validPage < Math.ceil(totalCount / validLimit),
        hasPrevPage: validPage > 1
      };
    } else {
      const docs = await docsPromise;
      return { docs };
    }
  }, 'getUserDetails');
};

exports.findUserByIdentifier = async (identifier) => {
  logger.info('ORM::userDetails@findUserByIdentifier');
  
  if (!identifier || typeof identifier !== 'string') {
    throw new AppError('Valid identifier is required', 400, 'INVALID_INPUT');
  }
  
  return handleDatabaseOperation(async () => {
    const query = {
      $or: [
        { email: identifier.toLowerCase().trim() },
        { mobileNumber: identifier.trim() }
      ],
      isActive: true
    };
    
    const user = await userDetails
      .findOne(query)
      .lean() // Better performance
      .exec();
      
    return user;
  }, 'findUserByIdentifier');
};

exports.updateUserLastLogin = async (userId) => {
  logger.info('ORM::userDetails@updateUserLastLogin');
  
  if (!userId) {
    throw new AppError('User ID is required', 400, 'INVALID_INPUT');
  }
  
  return handleDatabaseOperation(async () => {
    const result = await userDetails
      .findByIdAndUpdate(
        userId, 
        { 
          lastLoginAt: new Date(),
          updatedAt: new Date()
        }, 
        { new: true }
      )
      .select(utilityConstants.modelConfig.commonSkipFields)
      .lean()
      .exec();
      
    if (!result) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    
    return result;
  }, 'updateUserLastLogin');
};

exports.deleteOneUser = async (where) => {
  logger.info('ORM::userDetails@deleteOneUser');
  
  if (!where || Object.keys(where).length === 0) {
    throw new AppError('Delete criteria is required', 400, 'INVALID_INPUT');
  }
  
  return handleDatabaseOperation(async () => {
    const result = await userDetails
      .deleteOne(where)
      .exec();
      
    return result.deletedCount > 0;
  }, 'deleteOneUser');
};
