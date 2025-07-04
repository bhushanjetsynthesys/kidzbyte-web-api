const express = require('express');
const router = express.Router();

// Import validators
const validateAuth = require('../validator/validateAuth');

// Import services
const authService = require('../service/auth');
const newsService = require('../service/news');

// Import middleware
const authMiddleware = require('../middlewares/auth');
const {
  loginLimiter,
  otpVerifyLimiter,
  resendOtpLimiter
} = require('../middlewares/security');
const { asyncErrorHandler } = require('../middlewares/errorHandler');

// Login endpoint with rate limiting
router.post('/login',
  loginLimiter,
  validateAuth.validateLoginRequest,
  asyncErrorHandler(authService.initiateLogin)
);

// Resend OTP endpoint with rate limiting
router.post('/resend-otp',
  resendOtpLimiter,
  validateAuth.validateResendOTP,
  asyncErrorHandler(authService.resendOTP)
);

// OTP verification endpoint with rate limiting
router.post('/verify-otp',
  otpVerifyLimiter,
  validateAuth.validateOTPVerification,
  asyncErrorHandler(authService.verifyOTPAndLogin)
);

// Get user profile (protected route)
router.get('/profile',
  authMiddleware.authenticateToken,
  asyncErrorHandler(authService.getProfile)
);

// Logout user (protected route)
router.post('/logout',
  authMiddleware.authenticateToken,
  asyncErrorHandler(authService.logout)
);

// Create/Update student profile (protected route)
router.post('/create-profile',
  authMiddleware.authenticateToken,
  validateAuth.validateStudentProfile,
  asyncErrorHandler(authService.createStudentProfile)
);

// Get schools list (public route)
router.get('/schools', 
  asyncErrorHandler(authService.getSchoolList)
);


// News related routes
router.get('/news',
  asyncErrorHandler(newsService.getNews)
);
module.exports = router;
