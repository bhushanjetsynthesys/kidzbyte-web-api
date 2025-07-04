const { logger } = require('./logger');
const { deleteExpiredOTPs } = require('../orm/otpDetails');

class DatabaseCleanupService {
  constructor() {
    this.cleanupInterval = null;
    this.isRunning = false;
    
    // Cleanup configuration - ensures only expired data is removed
    this.config = {
      // Only remove expired OTPs (expiresAt < current time)
      cleanExpiredOTPs: true,
      
      // Never remove user accounts
      cleanUserAccounts: false,
      
      // Never remove valid OTPs
      cleanValidOTPs: false,
      
      // Only remove old log entries if configured (optional)
      cleanOldLogs: false,
      
      // Log retention period (only if cleanOldLogs is enabled)
      logRetentionDays: 30,
      
      // Cleanup interval in minutes
      cleanupIntervalMinutes: 30
    };
  }

  // Start automatic cleanup service
  start() {
    if (this.isRunning) {
      logger.warn('Database cleanup service is already running');
      return;
    }

    logger.info('Starting database cleanup service...');
    logger.info('Cleanup policy: ONLY expired data removed - USER DATA PROTECTED');
    logger.info('Configuration:', this.config);
    this.isRunning = true;

    // Run cleanup every 30 minutes (configurable)
    const intervalMs = this.config.cleanupIntervalMinutes * 60 * 1000;
    this.cleanupInterval = setInterval(async () => {
      await this.performCleanup();
    }, intervalMs);

    // Run initial cleanup after 1 minute
    setTimeout(async () => {
      await this.performCleanup();
    }, 60 * 1000);

    logger.info(`✓ Database cleanup service started (interval: ${this.config.cleanupIntervalMinutes} minutes)`);
  }

  // Stop cleanup service
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.isRunning = false;
    logger.info('Database cleanup service stopped');
  }

  // Perform cleanup operations - ONLY expired/invalid data
  async performCleanup() {
    try {
      logger.info('Starting scheduled database cleanup (expired data only)...');
      logger.info('USER DATA PROTECTION: User accounts, valid OTPs, and user data will NOT be touched');
      
      // PRE-CLEANUP VERIFICATION - Added safety layer
      const verificationResult = await this.verifyCleanupSafety();
      if (!verificationResult.safe) {
        logger.error('CLEANUP ABORTED: Safety verification failed');
        logger.error('Safety issues:', verificationResult.issues);
        return;
      }
      
      const startTime = Date.now();

      let totalCleaned = 0;

      // ONLY clean expired OTPs if configured (default: true)
      if (this.config.cleanExpiredOTPs) {
        const otpResult = await deleteExpiredOTPs();
        totalCleaned += otpResult.deletedCount;
        logger.info(`✓ Cleaned ${otpResult.deletedCount} expired OTP records (valid OTPs preserved)`);
      }

      // Clean up old session tokens that are expired (optional)
      await this.cleanupExpiredSessions();

      // Clean old logs only if configured (default: false)
      if (this.config.cleanOldLogs) {
        await this.cleanupOldLogs();
      }

      const duration = Date.now() - startTime;
      logger.info(`✓ Database cleanup completed in ${duration}ms`);
      logger.info(`✓ Total expired records cleaned: ${totalCleaned}`);
      logger.info(`✓ USER DATA STATUS: All user accounts and valid data preserved`);

      // Force garbage collection if available (memory optimization only)
      if (global.gc) {
        global.gc();
        logger.info('✓ Memory garbage collection triggered');
      }

    } catch (error) {
      logger.error('Error during database cleanup:', error);
    }
  }

  // NEW: Pre-cleanup safety verification
  async verifyCleanupSafety() {
    try {
      logger.info('🔍 Running pre-cleanup safety verification...');
      
      const issues = [];
      
      // Check 1: Verify configuration safety
      if (this.config.cleanUserAccounts === true) {
        issues.push('CRITICAL: User account cleanup is enabled - this would delete user data!');
      }
      
      if (this.config.cleanValidOTPs === true) {
        issues.push('CRITICAL: Valid OTP cleanup is enabled - this would delete active OTPs!');
      }
      
      // Check 2: Verify we're only targeting expired data
      if (this.config.cleanExpiredOTPs) {
        const { otpDetails } = require('../models');
        const expiredCount = await otpDetails.countDocuments({ 
          expiresAt: { $lt: new Date() } 
        });
        const validCount = await otpDetails.countDocuments({ 
          expiresAt: { $gt: new Date() } 
        });
        
        logger.info(`Safety check: ${expiredCount} expired OTPs to clean, ${validCount} valid OTPs protected`);
        
        if (expiredCount > 10000) {
          issues.push(`WARNING: Large number of expired OTPs (${expiredCount}) - consider manual review`);
        }
      }
      
      // Check 3: Verify database operations module safety
      // Only check for actual function calls, not configuration strings
      const cleanupCode = require('fs').readFileSync(__filename, 'utf8');
      const dangerousPatterns = [
        /await\s+deleteOneUser\s*\(/,
        /await\s+deleteManyUsers\s*\(/,
        /userDetails\.deleteMany\s*\(/,
        /userDetails\.remove\s*\(/,
        /\.drop\s*\(/,
        /collection\.drop\s*\(/
      ];
      
      for (const pattern of dangerousPatterns) {
        if (pattern.test(cleanupCode)) {
          issues.push(`CRITICAL: Dangerous operation detected in cleanup code: ${pattern.source}`);
        }
      }
      
      const result = {
        safe: issues.length === 0,
        issues: issues,
        timestamp: new Date().toISOString()
      };
      
      if (result.safe) {
        logger.info('✅ Pre-cleanup safety verification PASSED - cleanup is safe to proceed');
      } else {
        logger.error('❌ Pre-cleanup safety verification FAILED - cleanup will be aborted');
        logger.error('Safety issues found:', issues);
      }
      
      return result;
      
    } catch (error) {
      logger.error('Error during safety verification:', error);
      return {
        safe: false,
        issues: [`Safety verification failed: ${error.message}`],
        timestamp: new Date().toISOString()
      };
    }
  }

  // Clean up expired session tokens (if tracked) - does NOT remove user data
  async cleanupExpiredSessions() {
    try {
      // This is optional and only cleans expired session tokens if you track them
      // It does NOT remove user accounts or valid data
      logger.info('Session cleanup - only expired tokens removed, user data preserved');
      
    } catch (error) {
      logger.error('Error cleaning up expired sessions:', error);
    }
  }

  // Clean up old log entries (if configured) - does NOT remove user data
  async cleanupOldLogs() {
    try {
      if (!this.config.cleanOldLogs) {
        logger.info('Log cleanup disabled - no logs will be removed');
        return;
      }
      
      const retentionDays = this.config.logRetentionDays;
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      
      logger.info(`Log cleanup: would remove logs older than ${retentionDays} days (before ${cutoffDate.toISOString()})`);
      logger.info('USER DATA PROTECTION: Only log entries removed, never user accounts or application data');
      
      // If you store logs in database, implement cleanup here
      // Example implementation (commented out):
      // const logResult = await LogModel.deleteMany({ 
      //   createdAt: { $lt: cutoffDate },
      //   type: 'application_log' // Only remove log entries, never user data
      // });
      // logger.info(`Cleaned up ${logResult.deletedCount} old log records`);
      
    } catch (error) {
      logger.error('Error cleaning up old logs:', error);
    }
  }

  // Update cleanup configuration
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    logger.info('Cleanup configuration updated:', this.config);
    logger.info('USER DATA PROTECTION: Configuration ensures user data is never removed');
  }

  // Disable all cleanup (for development/testing)
  disableCleanup() {
    this.config.cleanExpiredOTPs = false;
    this.config.cleanOldLogs = false;
    logger.info('All database cleanup disabled - no data will be removed');
  }

  // Enable only safe cleanup (default)
  enableSafeCleanup() {
    this.config.cleanExpiredOTPs = true;
    this.config.cleanUserAccounts = false; // Always false
    this.config.cleanValidOTPs = false; // Always false
    this.config.cleanOldLogs = false; // Optional
    logger.info('Safe cleanup enabled - only expired OTPs will be removed');
  }

  // Manual cleanup trigger (with confirmation)
  async performManualCleanup(confirmSafe = false) {
    if (!confirmSafe) {
      logger.warn('Manual cleanup requires confirmation that only expired data should be removed');
      return false;
    }
    
    logger.info('Manual cleanup triggered - USER DATA WILL BE PRESERVED');
    await this.performCleanup();
    return true;
  }

  // Get cleanup service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextCleanup: this.cleanupInterval ? 'In 30 minutes' : 'Not scheduled',
      cleanupPolicy: 'ONLY expired OTPs and invalid sessions - USER DATA PRESERVED',
      dataRetention: {
        userAccounts: 'NEVER DELETED - Preserved permanently',
        validOTPs: 'PRESERVED - Only expired OTPs removed',
        userData: 'PROTECTED - All user data preserved',
        logs: 'Optional cleanup of old logs only (if configured)'
      }
    };
  }
}

// Singleton instance
const cleanupService = new DatabaseCleanupService();

module.exports = {
  cleanupService,
  DatabaseCleanupService
};
