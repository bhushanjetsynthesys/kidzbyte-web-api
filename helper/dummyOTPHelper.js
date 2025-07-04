const { logger } = require('../utils/logger');

/**
 * Dummy OTP Configuration and Utilities
 * For Local/Stage Environments Only
 */

class DummyOTPService {
  constructor() {
    this.isEnabled = process.env.ENABLE_DUMMY_OTP === 'true';
    this.dummyOTP = process.env.DUMMY_OTP || '1234';
    this.dummyMobile = process.env.DUMMY_MOBILE_NUMBER || '1234567899';
    this.dummyEmail = process.env.DUMMY_EMAIL || 'abc@gmail.com';
    this.allowedEnvironments = (process.env.DUMMY_OTP_ENVIRONMENTS || 'dev,staging').split(',');
    this.currentEnv = process.env.APP_ENV || 'production';
  }

  /**
   * Check if dummy OTP is enabled and safe to use
   */
  isEnabledForEnvironment() {
    const envAllowed = this.allowedEnvironments.includes(this.currentEnv);
    const isProduction = this.currentEnv === 'production' || this.currentEnv === 'prod';
    
    if (isProduction && this.isEnabled) {
      logger.error('SECURITY WARNING: Dummy OTP is enabled in production environment! This is dangerous.');
      return false;
    }
    
    return this.isEnabled && envAllowed;
  }

  /**
   * Check if the identifier is a dummy test account
   */
  isDummyAccount(identifier) {
    if (!this.isEnabledForEnvironment()) {
      return false;
    }

    const normalizedIdentifier = identifier.toLowerCase().trim();
    const isDummyMobile = normalizedIdentifier === this.dummyMobile;
    const isDummyEmail = normalizedIdentifier === this.dummyEmail.toLowerCase();
    
    return isDummyMobile || isDummyEmail;
  }

  /**
   * Get dummy OTP for test accounts
   */
  getDummyOTP() {
    if (!this.isEnabledForEnvironment()) {
      throw new Error('Dummy OTP is not enabled for this environment');
    }
    return this.dummyOTP;
  }

  /**
   * Mock OTP sending for dummy accounts
   */
  async mockOTPSending(identifier, otp, method = 'sms') {
    if (!this.isDummyAccount(identifier)) {
      return false; // Not a dummy account, proceed with real sending
    }

    logger.info(`🧪 DUMMY OTP: Mocking ${method.toUpperCase()} sending for test account`, {
      identifier,
      dummyOTP: this.dummyOTP,
      environment: this.currentEnv,
      actualOTPSent: otp,
      note: 'This is a test account - OTP not actually sent'
    });

    // Simulate a small delay like real OTP sending
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return true; // Indicates OTP sending was mocked
  }

  /**
   * Validate if provided OTP is correct for dummy accounts
   */
  validateDummyOTP(identifier, providedOTP) {
    if (!this.isDummyAccount(identifier)) {
      return null; // Not a dummy account, use normal validation
    }

    const isValid = providedOTP === this.dummyOTP;
    
    logger.info(`🧪 DUMMY OTP: Validation for test account`, {
      identifier,
      providedOTP,
      expectedDummyOTP: this.dummyOTP,
      isValid,
      environment: this.currentEnv
    });

    return isValid;
  }

  /**
   * Get configuration status for debugging
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      safeForEnvironment: this.isEnabledForEnvironment(),
      currentEnvironment: this.currentEnv,
      allowedEnvironments: this.allowedEnvironments,
      dummyAccounts: {
        mobile: this.dummyMobile,
        email: this.dummyEmail
      },
      dummyOTP: this.dummyOTP,
      securityWarnings: this.getSecurityWarnings()
    };
  }

  /**
   * Get security warnings if any
   */
  getSecurityWarnings() {
    const warnings = [];
    
    if (this.currentEnv === 'production' && this.isEnabled) {
      warnings.push('CRITICAL: Dummy OTP enabled in production!');
    }
    
    if (this.isEnabled && !this.allowedEnvironments.includes(this.currentEnv)) {
      warnings.push(`WARNING: Environment ${this.currentEnv} not in allowed list: ${this.allowedEnvironments.join(', ')}`);
    }
    
    return warnings;
  }

  /**
   * Safely disable dummy OTP (emergency function)
   */
  emergencyDisable() {
    this.isEnabled = false;
    logger.warn('🚨 EMERGENCY: Dummy OTP has been disabled');
    return true;
  }
}

// Singleton instance
const dummyOTPService = new DummyOTPService();

// Log status on startup
if (dummyOTPService.isEnabledForEnvironment()) {
  logger.info('🧪 Dummy OTP Service: ENABLED for testing', dummyOTPService.getStatus());
} else {
  logger.info('🔒 Dummy OTP Service: DISABLED (production-safe)');
}

module.exports = {
  dummyOTPService,
  DummyOTPService
};
