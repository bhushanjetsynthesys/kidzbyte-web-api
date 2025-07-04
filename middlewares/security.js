const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { logger } = require('../utils/logger');
const { utilityConstants } = require('../constants/constants');

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: {
    error: 'Too many login attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip} on login endpoint`);
    res.status(429).json({
      error: 'Too many login attempts from this IP, please try again after 15 minutes.'
    });
  },
  skip: (req) => {
    // Skip rate limiting for test environment
    return process.env.APP_ENV === 'test';
  }
});

// Rate limiting for OTP verification attempts
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 OTP verification requests per windowMs
  message: {
    error: 'Too many OTP verification attempts from this IP, please try again after 15 minutes.'
  },
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip} on OTP verification endpoint`);
    res.status(429).json({
      error: 'Too many OTP verification attempts from this IP, please try again after 15 minutes.'
    });
  },
  skip: (req) => {
    return process.env.APP_ENV === 'test';
  }
});

// Rate limiting for resend OTP
const resendOtpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limit each IP to 3 resend requests per 5 minutes
  message: {
    error: 'Too many resend OTP attempts from this IP, please try again after 5 minutes.'
  },
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip} on resend OTP endpoint`);
    res.status(429).json({
      error: 'Too many resend OTP attempts from this IP, please try again after 5 minutes.'
    });
  },
  skip: (req) => {
    return process.env.APP_ENV === 'test';
  }
});

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`General rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests from this IP, please try again after 15 minutes.'
    });
  },
  skip: (req) => {
    return process.env.APP_ENV === 'test';
  }
});

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Request size limiter middleware
const requestSizeLimiter = (req, res, next) => {
  const contentLength = req.get('content-length');
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength && parseInt(contentLength) > maxSize) {
    logger.warn(`Request size limit exceeded: ${contentLength} bytes from IP: ${req.ip}`);
    return res.status(413).json({
      error: 'Request entity too large'
    });
  }
  next();
};

// IP validation middleware
const validateIP = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  // Log suspicious activity
  if (!ip || ip === '::1' || ip === '127.0.0.1') {
    // Allow localhost for development
    if (process.env.APP_ENV === 'dev' || process.env.APP_ENV === 'test') {
      return next();
    }
  }
  
  // Add any IP blacklist logic here if needed
  req.clientIP = ip;
  next();
};

module.exports = {
  loginLimiter,
  otpVerifyLimiter,
  resendOtpLimiter,
  generalLimiter,
  securityHeaders,
  requestSizeLimiter,
  validateIP
};
