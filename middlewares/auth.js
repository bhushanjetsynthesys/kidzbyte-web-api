const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');
const { utilityConstants } = require('../constants/constants');

/**
 * Middleware to verify JWT token
 */
exports.authenticateToken = (req, res, next) => {
  logger.info('Middleware::auth@authenticateToken');
  
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(utilityConstants.serviceResponseCodes.unauthorized).json({
        error: utilityConstants.messages.errors.missingAuthKey
      });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'test', (err, decoded) => {
      if (err) {
        logger.error('JWT verification failed:', err);
        
        if (err.name === 'TokenExpiredError') {
          return res.status(utilityConstants.serviceResponseCodes.unauthorized).json({
            error: utilityConstants.messages.errors.expiredOrInvalidToken
          });
        }
        
        return res.status(utilityConstants.serviceResponseCodes.unauthorized).json({
          error: utilityConstants.messages.errors.invalidToken
        });
      }

      // Add user info to request object
      req.user = decoded;
      next();
    });
  } catch (error) {
    logger.error('Error in authenticateToken middleware:', error);
    return res.status(utilityConstants.serviceResponseCodes.unauthorized).json({
      error: utilityConstants.messages.errors.malformedToken
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
exports.optionalAuth = (req, res, next) => {
  logger.info('Middleware::auth@optionalAuth');
  
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, continue without authentication
      return next();
    }

    jwt.verify(token, process.env.JWT_SECRET || 'test', (err, decoded) => {
      if (!err) {
        req.user = decoded;
      }
      // Continue regardless of token validity
      next();
    });
  } catch (error) {
    logger.error('Error in optionalAuth middleware:', error);
    // Continue regardless of error
    next();
  }
};
