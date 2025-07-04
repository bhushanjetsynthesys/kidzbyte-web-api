const { utilityConstants } = require('../constants/constants');
const { check, validationResult } = require('express-validator');
const { logger } = require('../utils/logger');
const { expressErrorHandler } = require('../helper/commonHelper');

exports.validateLoginRequest = [
  check('identifier')
    .notEmpty().withMessage('Email or mobile number is required.')
    .isString().withMessage('Identifier must be a string'),
  check('fullName')
    .optional()
    .isString().withMessage('Full name must be a string'),
  check('countryCode')
    .optional()
    .isString().withMessage('Country code must be a string'),
  check('deviceInfo')
    .optional()
    .isObject().withMessage('Device info must be an object'),
  (req, res, next) => {
    try {
      logger.info('Running simplified validation for login request');
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(utilityConstants.serviceResponseCodes.error).json(expressErrorHandler(errors.array()[0]));
      }
      return next();
    } catch (err) {
      return res.status(utilityConstants.serviceResponseCodes.error).json(expressErrorHandler(err));
    }
  }
];

exports.validateOTPVerification = [
  check('sessionToken')
    .notEmpty().withMessage('Session token is required.')
    .isString().withMessage('Session token must be a string')
    .isLength({ min: 32, max: 128 }).withMessage('Invalid session token format'),
  check('otp')
    .notEmpty().withMessage('OTP is required.')
    .isString().withMessage('OTP must be a string')
    .isLength({ min: 4, max: 4 }).withMessage('OTP must be 4 digits')
    .isNumeric().withMessage('OTP must contain only numbers'),
  check('identifier')
    .notEmpty().withMessage('Email or mobile number is required.')
    .isString().withMessage('Identifier must be a string'),
  (req, res, next) => {
    try {
      logger.info('Running validation for OTP verification');
      validationResult(req).throw();
      return next();
    } catch (err) {
      return res.status(utilityConstants.serviceResponseCodes.error).json(expressErrorHandler(err.array()[0]));
    }
  }
];

exports.validateResendOTP = [
  check('identifier')
    .notEmpty().withMessage('Email or mobile number is required.')
    .isString().withMessage('Identifier must be a string')
    .custom((value) => {
      // Check if it's a valid email or mobile number
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const mobileRegex = /^[+]?[1-9]\d{1,14}$/; // Basic international mobile format
      
      if (!emailRegex.test(value) && !mobileRegex.test(value.replace(/\s+/g, ''))) {
        throw new Error('Please provide a valid email address or mobile number');
      }
      return true;
    }),
  check('countryCode')
    .optional()
    .isString().withMessage('Country code must be a string')
    .matches(/^\+\d{1,4}$/).withMessage('Country code must be in format +XX'),
  (req, res, next) => {
    try {
      logger.info('Running validation for resend OTP request');
      validationResult(req).throw();
      return next();
    } catch (err) {
      return res.status(utilityConstants.serviceResponseCodes.error).json(expressErrorHandler(err.array()[0]));
    }
  }
];

exports.validateStudentProfile = [
  check('userId')
    .notEmpty().withMessage('User ID is required.')
    .isMongoId().withMessage('Invalid User ID format.'),
  check('fullName')
    .notEmpty().withMessage('Full name is required.')
    .isString().withMessage('Full name must be a string.')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters.'),
  check('age')
    .notEmpty().withMessage('Age is required.')
    .isInt({ min: 1, max: 150 }).withMessage('Age must be a valid number between 1 and 150.'),
  check('institution')
    .notEmpty().withMessage('Institution is required.')
    .isString().withMessage('Institution must be a string.')
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('Institution must be between 2 and 200 characters.'),
  check('filePath')
    .optional({ nullable: true })
    .isString().withMessage('File path must be a string.')
    .trim(),
  (req, res, next) => {
    try {
      logger.info('Running validation for student profile update');
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(utilityConstants.serviceResponseCodes.error).json(expressErrorHandler(errors.array()[0]));
      }
      return next();
    } catch (err) {
      return res.status(utilityConstants.serviceResponseCodes.error).json(expressErrorHandler(err));
    }
  }
];

exports.validateSchoolListQuery = [
  check('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.')
    .toInt(),
  check('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer.')
    .toInt(),
  check('search')
    .optional()
    .isString().withMessage('Search term must be a string.')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Search term must be between 1 and 100 characters.'),
  check('type')
    .optional()
    .isIn(['public', 'private', 'charter', 'international', 'vocational'])
    .withMessage('Invalid school type.'),
  check('city')
    .optional()
    .isString().withMessage('City must be a string.')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('City must be between 1 and 100 characters.'),
  check('state')
    .optional()
    .isString().withMessage('State must be a string.')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('State must be between 1 and 100 characters.'),
  (req, res, next) => {
    try {
      logger.info('Running validation for school list query');
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(utilityConstants.serviceResponseCodes.error).json(expressErrorHandler(errors.array()[0]));
      }
      return next();
    } catch (err) {
      return res.status(utilityConstants.serviceResponseCodes.error).json(expressErrorHandler(err));
    }
  }
];
