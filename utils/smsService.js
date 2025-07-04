const axios = require('axios');
const { logger } = require('../utils/logger');
const { sendEmail } = require('../utils/mailer');
const { dummyOTPService } = require('../helper/dummyOTPHelper');

// MSG91 Configuration
const MSG91_API_KEY = process.env.MSG91_API_KEY || 'dummy-msg91-api-key-for-development';
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'TESTID';
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID || 'dummy-template-id';
const MSG91_BASE_URL = 'https://api.msg91.com/api/v5/otp';

/**
 * Send OTP via SMS using MSG91
 * @param {string} mobileNumber - Mobile number with country code
 * @param {string} otp - OTP to send
 * @param {string} countryCode - Country code (optional)
 * @returns {Promise} SMS sending result
 */
exports.sendOTPviaSMS = async (mobileNumber, otp, countryCode = '+91') => {
  logger.info('SMSService@sendOTPviaSMS - MSG91');
  
  try {
    // Check if this is a dummy account first
    const isDummyMocked = await dummyOTPService.mockOTPSending(mobileNumber, otp, 'sms');
    if (isDummyMocked) {
      return { 
        success: true, 
        requestId: 'dummy-' + Date.now(),
        message: 'SMS sent successfully (dummy account - testing mode)',
        isDummy: true
      };
    }

    // Clean mobile number - remove any non-digit characters except +
    const cleanMobileNumber = mobileNumber.replace(/[^\d+]/g, '');
    const fullMobileNumber = cleanMobileNumber.startsWith('+') ? cleanMobileNumber : `${countryCode}${cleanMobileNumber}`;
    
    // Remove + from mobile number for MSG91 API
    const apiMobileNumber = fullMobileNumber.replace('+', '');
    
    const message = `Your OTP for login is: ${otp}. This OTP is valid for 10 minutes. Do not share with anyone.`;

    // MSG91 API payload
    const payload = {
      template_id: MSG91_TEMPLATE_ID,
      sender: MSG91_SENDER_ID,
      short_url: '0',
      mobiles: apiMobileNumber,
      var1: otp, // OTP variable for template
      var2: '10' // Validity in minutes
    };

    const config = {
      method: 'post',
      url: `${MSG91_BASE_URL}?authkey=${MSG91_API_KEY}`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: payload
    };

    // For development/testing, simulate success without actual API call
    if (MSG91_API_KEY === 'dummy-msg91-api-key-for-development') {
      logger.info(`[DEVELOPMENT] SMS would be sent to ${fullMobileNumber} with OTP: ${otp}`);
      logger.info(`[DEVELOPMENT] Message: ${message}`);
      return { 
        success: true, 
        requestId: 'dev-' + Date.now(),
        message: 'SMS sent successfully (development mode)'
      };
    }

    const response = await axios(config);
    
    if (response.data && response.data.type === 'success') {
      logger.info(`SMS sent successfully to ${fullMobileNumber}. Request ID: ${response.data.request_id}`);
      return { 
        success: true, 
        requestId: response.data.request_id,
        message: 'SMS sent successfully'
      };
    } else {
      throw new Error(`MSG91 API Error: ${response.data.message || 'Unknown error'}`);
    }
  } catch (error) {
    logger.error('Error sending SMS via MSG91:', error);
    
    // In development, log the error but don't fail
    if (MSG91_API_KEY === 'dummy-msg91-api-key-for-development') {
      logger.info(`[DEVELOPMENT] SMS sending simulated for ${mobileNumber} with OTP: ${otp}`);
      return { 
        success: true, 
        requestId: 'dev-error-' + Date.now(),
        message: 'SMS sent successfully (development mode - error handled)'
      };
    }
    
    throw error;
  }
};

/**
 * Send OTP via Email
 * @param {string} email - Email address
 * @param {string} otp - OTP to send
 * @param {string} userName - User's name (optional)
 * @returns {Promise} Email sending result
 */
exports.sendOTPviaEmail = async (email, otp, userName = 'User') => {
  logger.info('SMSService@sendOTPviaEmail');
  
  try {
    // Check if this is a dummy account first
    const isDummyMocked = await dummyOTPService.mockOTPSending(email, otp, 'email');
    if (isDummyMocked) {
      return { 
        success: true, 
        requestId: 'dummy-email-' + Date.now(),
        message: 'Email sent successfully (dummy account - testing mode)',
        isDummy: true
      };
    }

    const subject = 'Your Login OTP - Authentication Service';
    const textBody = `Hi ${userName},\n\nYour OTP for login is: ${otp}\n\nThis OTP is valid for 10 minutes. Please do not share this OTP with anyone.\n\nBest regards,\nAuthentication Service Team`;
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">Authentication Service</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333; margin-top: 0;">Login OTP Verification</h2>
          <p style="color: #666; font-size: 16px;">Hi ${userName},</p>
          <p style="color: #666; font-size: 16px;">Your OTP for login is:</p>
          <div style="background: #fff; border: 2px dashed #4facfe; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; color: #4facfe; letter-spacing: 5px;">${otp}</span>
          </div>
          <p style="color: #666; font-size: 14px; margin: 20px 0;">
            <strong>Important:</strong><br>
            • This OTP is valid for 10 minutes only<br>
            • Please do not share this OTP with anyone<br>
            • If you didn't request this OTP, please ignore this email
          </p>
          <div style="border-top: 1px solid #ddd; margin-top: 30px; padding-top: 20px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Best regards,<br>
              Authentication Service Team
            </p>
          </div>
        </div>
      </div>
    `;

    const result = await sendEmail(email, subject, textBody, htmlBody);
    logger.info(`OTP email sent successfully to ${email}`);
    return { success: true, messageId: result.MessageId };
  } catch (error) {
    logger.error('Error sending OTP email:', error);
    
    // In development with dummy credentials, simulate success
    if (process.env.SES_KEY === 'your-ses-access-key' || !process.env.SES_KEY) {
      logger.info(`[DEVELOPMENT] Email would be sent to ${email} with OTP: ${otp}`);
      return { 
        success: true, 
        messageId: 'dev-email-' + Date.now(),
        message: 'Email sent successfully (development mode)'
      };
    }
    
    throw error;
  }
};
