const { logger } = require('../utils/logger');
const { utilityConstants } = require('../constants/constants');
const { findUserByIdentifier, updateOrCreateUser, updateUserLastLogin } = require('../orm/userDetails');
const { createOTP, findValidOTP, updateOTPAttempts, markOTPAsUsed, checkOTPLimits, findLatestOTP } = require('../orm/otpDetails');
const { findAllSchools, getSchoolsCount, searchSchools } = require('../orm/schoolDetails');
const { generateOTP, generateSessionToken, generateJwtToken } = require('../helper/authHelper');
const { sendOTPviaSMS, sendOTPviaEmail } = require('../utils/smsService');
const { dummyOTPService } = require('../helper/dummyOTPHelper');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Initiate login process - send OTP
 */
exports.initiateLogin = async (req, res) => {
    try {

        logger.info('Service::auth@initiateLogin', { ip: req.ip });
        const { identifier, countryCode = '+91', deviceInfo } = req.body;

        // Input validation
        if (!identifier) {
            throw new AppError('Email or mobile number is required', 400, 'MISSING_IDENTIFIER');
        }

        // Determine if identifier is email or mobile
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isEmail = emailRegex.test(identifier);
        const identifierType = isEmail ? 'email' : 'mobile';
        const normalizedIdentifier = isEmail ? identifier.toLowerCase().trim() : identifier.trim();

        // Check if user exists
        let user = await findUserByIdentifier(normalizedIdentifier);

        if (!user) {
            // Create new user only if not exists
            const userData = {
                fullName: 'User',
                isActive: true,
                deviceInfo: deviceInfo || {}
            };

            if (isEmail) {
                userData.email = normalizedIdentifier;
            } else {
                userData.mobileNumber = normalizedIdentifier;
                userData.countryCode = countryCode;
            }

            try {
                user = await updateOrCreateUser({}, userData);
                logger.info(`New user created with identifier: ${normalizedIdentifier}`, { userId: user._id });
            } catch (error) {
                // If creation fails, try to find existing user (handle race conditions)
                user = await findUserByIdentifier(normalizedIdentifier);
                if (!user) {
                    throw new AppError('Unable to create or find user', 500, 'USER_CREATION_FAILED');
                }
                logger.info(`Found existing user after creation attempt: ${normalizedIdentifier}`);
            }
        } else {
            logger.info(`Existing user found: ${normalizedIdentifier}`, { userId: user._id });
        }

        // Generate OTP based on account type (dummy or real)
        let otp;
        let isDummyAccount = dummyOTPService.isDummyAccount(normalizedIdentifier);

        if (isDummyAccount) {
            otp = dummyOTPService.getDummyOTP();
            logger.info(`🧪 Using dummy OTP for test account: ${normalizedIdentifier}`);
        } else {
            otp = generateOTP();
            logger.info(`Generated real OTP for: ${normalizedIdentifier}`);
        }

        const sessionToken = generateSessionToken();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save OTP to database
        await createOTP({
            identifier: normalizedIdentifier,
            identifierType,
            otp,
            purpose: 'login',
            expiresAt,
            sessionToken
        });

        // Send OTP (skip actual sending for dummy accounts in development)
        if (!isDummyAccount || process.env.APP_ENV === 'production') {
            try {
                if (isEmail) {
                    await sendOTPviaEmail(normalizedIdentifier, otp);
                } else {
                    await sendOTPviaSMS(normalizedIdentifier, otp, countryCode);
                }
                logger.info(`OTP sent successfully to ${normalizedIdentifier} via ${identifierType}`);
            } catch (smsError) {
                logger.error('Error sending OTP:', smsError);
                throw new AppError('Failed to send OTP. Please try again.', 500, 'OTP_SEND_FAILED');
            }
        } else {
            logger.info(`🧪 Skipping actual OTP sending for dummy account: ${normalizedIdentifier}`);
        }

        // Prepare response with additional info for dummy accounts
        const responseData = {
            sessionToken,
            identifierType,
            expiresIn: 600 // 10 minutes in seconds
        };

        // Add development info for dummy accounts (only in non-production)
        if (isDummyAccount && process.env.APP_ENV !== 'production') {
            responseData.developmentInfo = {
                isDummyAccount: true,
                dummyOTP: otp,
                note: 'This is a test account. In production, OTP would be sent normally.'
            };
        }

        return res.status(utilityConstants.serviceResponseCodes.success).json({
            success: true,
            message: utilityConstants.commonResponse.loginInitiated,
            data: responseData
        });
    } catch (error) {
        // Handle known application errors
        if (error instanceof AppError) {
            return res.status(error.status).json({
                success: false,
                error: error.message,
                type: error.type
            });
        }
        // Handle unexpected errors
        logger.error('Unexpected error in initiateLogin:', error);
        return res.status(utilityConstants.serviceResponseCodes.serverError).json({
            success: false,
            error: utilityConstants.commonResponse.serverError,
            type: 'INTERNAL_ERROR'
        });
    }
};

/**
 * Verify OTP and complete login
 */
exports.verifyOTPAndLogin = async (req, res) => {
    try {
        logger.info('Service::auth@verifyOTPAndLogin');
        const { sessionToken, otp, identifier } = req.body;

        // Determine identifier type
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const identifierType = emailRegex.test(identifier) ? 'email' : 'mobile';

        // Find valid OTP
        const otpRecord = await findValidOTP(identifier, identifierType, 'login', sessionToken);

        if (!otpRecord) {
            return res.status(utilityConstants.serviceResponseCodes.error).json({
                error: utilityConstants.commonResponse.otpExpired
            });
        }

        // Skip OTP attempt limits for development - allow unlimited attempts
        logger.info(`Skipping OTP attempt limits for: ${identifier}`);

        // Verify OTP - handle both regular and dummy OTP validation
        let isOTPValid = false;
        let isDummyValidation = false;

        // Check if this is a dummy account first
        const dummyValidation = dummyOTPService.validateDummyOTP(identifier, otp);
        if (dummyValidation !== null) {
            // This is a dummy account
            isOTPValid = dummyValidation;
            isDummyValidation = true;
        } else {
            // Regular OTP validation
            isOTPValid = (otpRecord.otp === otp);
        }

        if (!isOTPValid) {
            // Increment attempts
            await updateOTPAttempts(otpRecord._id, otpRecord.attempts + 1);

            return res.status(utilityConstants.serviceResponseCodes.error).json({
                error: utilityConstants.commonResponse.otpInvalid,
                attemptsLeft: otpRecord.maxAttempts - (otpRecord.attempts + 1),
                ...(isDummyValidation && process.env.APP_ENV !== 'production' && {
                    developmentInfo: {
                        isDummyAccount: true,
                        expectedDummyOTP: dummyOTPService.getDummyOTP(),
                        providedOTP: otp
                    }
                })
            });
        }

        // Mark OTP as used
        await markOTPAsUsed(otpRecord._id);

        // Find user and update last login
        const user = await findUserByIdentifier(identifier);
        if (!user) {
            return res.status(utilityConstants.serviceResponseCodes.dataNotFound).json({
                error: utilityConstants.commonResponse.userNotFound
            });
        }

        // Update user verification status and last login
        const updateData = {
            lastLoginAt: new Date()
        };

        if (identifierType === 'email') {
            updateData.isEmailVerified = true;
        } else {
            updateData.isMobileVerified = true;
        }

        const updatedUser = await updateOrCreateUser({ _id: user._id }, updateData);

        // Generate JWT token
        const tokenPayload = {
            userId: user._id,
            email: user.email,
            mobileNumber: user.mobileNumber,
            fullName: user.fullName,
            identifierType
        };

        const jwtToken = generateJwtToken(tokenPayload);

        // Return success response
        return res.status(utilityConstants.serviceResponseCodes.success).json({
            message: utilityConstants.commonResponse.loginSuccessfull,
            token: jwtToken,
            user: {
                id: user._id,
                email: user.email,
                mobileNumber: user.mobileNumber,
                fullName: user.fullName,
                isEmailVerified: updatedUser.isEmailVerified,
                isMobileVerified: updatedUser.isMobileVerified,
                lastLoginAt: updatedUser.lastLoginAt
            }
        });

    } catch (error) {
        logger.error('Error in verifyOTPAndLogin:', error);
        res.status(utilityConstants.serviceResponseCodes.serverError).json({
            error: utilityConstants.commonResponse.serverError
        });
    }
};

/**
 * Get user profile
 */
exports.getProfile = async (req, res) => {
    try {
        logger.info('Service::auth@getProfile');
        // User data is already attached to req.user by the auth middleware
        const user = req.user;

        res.status(utilityConstants.serviceResponseCodes.success).json({
            success: true,
            message: 'User profile retrieved successfully',
            data: {
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    mobileNumber: user.mobileNumber,
                    age: user.age,
                    institution: user.institution,
                    countryCode: user.countryCode,
                    isEmailVerified: user.isEmailVerified,
                    isMobileVerified: user.isMobileVerified,
                    lastLoginAt: user.lastLoginAt,
                    deviceInfo: user.deviceInfo || {},
                    createdAt: user.createdAt,
                    lastLogin: user.lastLoginAt
                }
            }
        });
    } catch (error) {
        logger.error('Error in getProfile:', error);
        res.status(utilityConstants.serviceResponseCodes.serverError).json({
            error: utilityConstants.commonResponse.serverError
        });
    }
};

/**
 * Logout user
 */
exports.logout = async (req, res) => {
    try {
        logger.info('Service::auth@logout');

        // In a stateless JWT system, logout is typically handled on the client side
        // by removing the token. However, we can track the logout for audit purposes.

        const user = req.user;
        logger.info(`User ${user._id} logged out successfully`);

        res.status(utilityConstants.serviceResponseCodes.success).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        logger.error('Error in logout:', error);
        res.status(utilityConstants.serviceResponseCodes.serverError).json({
            error: utilityConstants.commonResponse.serverError
        });
    }
};

/**
 * Resend OTP functionality
 */
exports.resendOTP = async (req, res) => {
    try {
        logger.info('Service::auth@resendOTP');
        const { identifier, countryCode = '+91' } = req.body;

        // Determine if identifier is email or mobile
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isEmail = emailRegex.test(identifier);
        const identifierType = isEmail ? 'email' : 'mobile';

        // Skip OTP limits for resend - allow unlimited resends for development
        logger.info(`Skipping OTP resend limits for development: ${identifier}`);

        // Check if user exists
        const user = await findUserByIdentifier(identifier);
        if (!user) {
            return res.status(utilityConstants.serviceResponseCodes.dataNotFound).json({
                error: 'User not found. Please initiate login first.'
            });
        }

        // Find the latest OTP for this identifier
        const latestOTP = await findLatestOTP(identifier, identifierType, 'login');

        let otpToSend, sessionToken, expiresAt;
        let isNewOTP = false;
        let isDummyAccount = dummyOTPService.isDummyAccount(identifier);

        if (latestOTP && latestOTP.expiresAt > new Date()) {
            // Reuse existing OTP if not expired
            // For dummy accounts, always use dummy OTP regardless of stored OTP
            if (isDummyAccount) {
                otpToSend = dummyOTPService.getDummyOTP();
                logger.info(`🧪 Reusing dummy OTP for test account: ${identifier}`);
            } else {
                otpToSend = latestOTP.otp;
            }
            sessionToken = latestOTP.sessionToken;
            expiresAt = latestOTP.expiresAt;
            logger.info(`Reusing existing OTP for ${identifier}`);
        } else {
            // Generate new OTP if no valid OTP exists or expired
            if (isDummyAccount) {
                otpToSend = dummyOTPService.getDummyOTP();
                logger.info(`🧪 Generated dummy OTP for test account: ${identifier}`);
            } else {
                otpToSend = generateOTP();
            }
            sessionToken = generateSessionToken();
            expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
            isNewOTP = true;

            // Save new OTP to database
            await createOTP({
                identifier,
                identifierType,
                otp: otpToSend,
                purpose: 'login',
                expiresAt,
                sessionToken
            });
            logger.info(`Generated new OTP for ${identifier}`);
        }

        // Send OTP
        try {
            if (isEmail) {
                await sendOTPviaEmail(identifier, otpToSend);
            } else {
                await sendOTPviaSMS(identifier, otpToSend, countryCode);
            }

            logger.info(`OTP ${isNewOTP ? 'sent' : 'resent'} successfully to ${identifier} via ${identifierType}`, {
                isDummyAccount: isDummyAccount
            });
        } catch (smsError) {
            logger.error('Error sending OTP:', smsError);
            return res.status(utilityConstants.serviceResponseCodes.serverError).json({
                error: utilityConstants.commonResponse.otpError
            });
        }

        // Calculate remaining time in seconds
        const expiresIn = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

        // Prepare response data
        const responseData = {
            message: isNewOTP
                ? utilityConstants.commonResponse.loginInitiated
                : 'OTP resent successfully. Please check your email/mobile.',
            sessionToken,
            identifierType,
            expiresIn,
            isResent: !isNewOTP
        };

        // Add development info for dummy accounts (only in non-production)
        if (isDummyAccount && process.env.APP_ENV !== 'production') {
            responseData.developmentInfo = {
                isDummyAccount: true,
                dummyOTP: otpToSend,
                note: 'This is a test account. In production, OTP would be sent normally.'
            };
        }

        return res.status(utilityConstants.serviceResponseCodes.success).json(responseData);

    } catch (error) {
        logger.error('Error in resendOTP:', error);
        res.status(utilityConstants.serviceResponseCodes.serverError).json({
            error: utilityConstants.commonResponse.serverError
        });
    }
};

/**
 * Create or update student profile
 */
exports.createStudentProfile = async (req, res) => {
    try {
        logger.info('Service::auth@createStudentProfile');
        const { userId, fullName, age, institution, filePath } = req.body;

        // Input validation is handled by the validateStudentProfile middleware

        // Prepare student profile data
        const studentData = {
            fullName: fullName.trim(),
            age: parseInt(age),
            institution: institution.trim(),
        };

        // Only add filePath if it's provided
        if (filePath) {
            studentData.filePath = filePath.trim();
        } else {
            studentData.filePath = null;
        }

        // Update user with student profile data
        const updatedUser = await updateOrCreateUser(
            { _id: userId },
            studentData
        );

        if (!updatedUser) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        logger.info(`Student profile updated for user: ${userId}`, {
            fullName: studentData.fullName,
            age: studentData.age,
            institution: studentData.institution
        });

        return res.status(utilityConstants.serviceResponseCodes.success).json({
            success: true,
            message: 'Student profile created/updated successfully',
            data: {
                user: {
                    id: updatedUser._id,
                    fullName: updatedUser.fullName,
                    age: updatedUser.age,
                    institution: updatedUser.institution,
                    filePath: updatedUser.filePath,
                    email: updatedUser.email,
                    mobileNumber: updatedUser.mobileNumber,
                    updatedAt: updatedUser.updatedAt
                }
            }
        });

    } catch (error) {
        // Handle known application errors
        if (error instanceof AppError) {
            return res.status(error.status).json({
                success: false,
                error: error.message,
                type: error.type
            });
        }
        // Handle unexpected errors
        logger.error('Unexpected error in createStudentProfile:', error);
        return res.status(utilityConstants.serviceResponseCodes.serverError).json({
            success: false,
            error: utilityConstants.commonResponse.serverError,
            type: 'INTERNAL_ERROR'
        });
    }
};

/**
 * Get list of schools - simplified version
 */
exports.getSchoolList = async (req, res) => {
    try {
        logger.info('Service::auth@getSchoolList');
        
        // Fetch all schools with only name field
        const schools = await findAllSchools({}, { 
            sort: { name: 1 },
            select: 'name'
        });

        logger.info(`Retrieved ${schools.length} schools`);

        return res.status(utilityConstants.serviceResponseCodes.success).json({
            success: true,
            message: 'Schools retrieved successfully',
            data: {
                schools
            }
        });

    } catch (error) {
        // Handle known application errors
        if (error instanceof AppError) {
            return res.status(error.status).json({
                success: false,
                error: error.message,
                type: error.type
            });
        }
        
        // Handle unexpected errors
        logger.error('Unexpected error in getSchoolList:', error);
        return res.status(utilityConstants.serviceResponseCodes.serverError).json({
            success: false,
            error: utilityConstants.commonResponse.serverError,
            type: 'INTERNAL_ERROR'
        });
    }
};
