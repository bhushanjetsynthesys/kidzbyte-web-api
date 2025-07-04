const { logger } = require('../utils/logger');
const { utilityConstants } = require('../constants/constants');

// Database error handler
const handleDatabaseError = (error) => {
  logger.error('Database Error:', error);
  
  // MongoDB duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return {
      status: 400,
      message: `${field} already exists. Please use a different ${field}.`,
      type: 'DUPLICATE_KEY_ERROR'
    };
  }
  
  // MongoDB validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return {
      status: 400,
      message: errors.join(', '),
      type: 'VALIDATION_ERROR'
    };
  }
  
  // MongoDB cast error
  if (error.name === 'CastError') {
    return {
      status: 400,
      message: 'Invalid data format provided',
      type: 'CAST_ERROR'
    };
  }
  
  // Connection errors
  if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
    return {
      status: 503,
      message: 'Database temporarily unavailable. Please try again later.',
      type: 'DATABASE_CONNECTION_ERROR'
    };
  }
  
  return {
    status: 500,
    message: 'Internal database error occurred',
    type: 'DATABASE_ERROR'
  };
};

// JWT error handler
const handleJWTError = (error) => {
  logger.error('JWT Error:', error);
  
  if (error.name === 'TokenExpiredError') {
    return {
      status: 401,
      message: 'Token has expired. Please login again.',
      type: 'TOKEN_EXPIRED'
    };
  }
  
  if (error.name === 'JsonWebTokenError') {
    return {
      status: 401,
      message: 'Invalid token. Please login again.',
      type: 'INVALID_TOKEN'
    };
  }
  
  return {
    status: 401,
    message: 'Authentication failed',
    type: 'AUTH_ERROR'
  };
};

// Global error handler middleware
const globalErrorHandler = (err, req, res, next) => {
  // Log the error with request context
  logger.error('Global Error Handler:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  let errorResponse = {
    status: 500,
    message: 'Internal server error occurred',
    type: 'INTERNAL_ERROR'
  };
  
  // Handle specific error types
  if (err.name && (err.name.includes('Mongo') || err.code === 11000)) {
    errorResponse = handleDatabaseError(err);
  } else if (err.name && err.name.includes('JsonWebToken')) {
    errorResponse = handleJWTError(err);
  } else if (err.status && err.message) {
    // Custom application errors
    errorResponse = {
      status: err.status,
      message: err.message,
      type: err.type || 'APPLICATION_ERROR'
    };
  }
  
  // Don't leak error details in production
  const response = {
    success: false,
    error: errorResponse.message,
    type: errorResponse.type
  };
  
  // Include stack trace only in development
  if (process.env.APP_ENV === 'dev') {
    response.stack = err.stack;
    response.details = err;
  }
  
  res.status(errorResponse.status).json(response);
};

// 404 handler
const notFoundHandler = (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl} from IP: ${req.ip}`);
  
  res.status(404).json({
    success: false,
    error: 'The requested endpoint was not found',
    type: 'ENDPOINT_NOT_FOUND',
    path: req.originalUrl,
    method: req.method
  });
};

// Async error wrapper
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, type = 'APPLICATION_ERROR') {
    super(message);
    this.status = statusCode;
    this.type = type;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  globalErrorHandler,
  notFoundHandler,
  asyncErrorHandler,
  AppError,
  handleDatabaseError,
  handleJWTError
};
