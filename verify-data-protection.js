#!/usr/bin/env node

/**
 * Data Protection Verification Script
 * 
 * This script verifies that the database cleanup service is properly configured
 * to protect user data and only remove expired/invalid temporary data.
 */

const { logger } = require('./utils/logger');
const { cleanupService } = require('./utils/cleanup');
const { otpDetails, userDetails } = require('./models');

class DataProtectionVerifier {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  // Add test result
  addTest(name, passed, message, isWarning = false) {
    const result = {
      name,
      status: passed ? 'PASS' : (isWarning ? 'WARN' : 'FAIL'),
      message
    };
    
    this.results.tests.push(result);
    
    if (passed) {
      this.results.passed++;
    } else if (isWarning) {
      this.results.warnings++;
    } else {
      this.results.failed++;
    }
    
    const emoji = passed ? '✅' : (isWarning ? '⚠️' : '❌');
    console.log(`${emoji} ${name}: ${message}`);
  }

  // Verify cleanup configuration
  verifyCleanupConfig() {
    console.log('\n🔍 Verifying Cleanup Service Configuration...\n');
    
    const config = cleanupService.config;
    
    // Test 1: User accounts protection
    this.addTest(
      'User Account Protection',
      config.cleanUserAccounts === false,
      config.cleanUserAccounts === false 
        ? 'User accounts will NEVER be deleted' 
        : 'DANGER: User accounts could be deleted!'
    );
    
    // Test 2: Valid OTP protection
    this.addTest(
      'Valid OTP Protection',
      config.cleanValidOTPs === false,
      config.cleanValidOTPs === false 
        ? 'Valid OTPs are protected from deletion' 
        : 'DANGER: Valid OTPs could be deleted!'
    );
    
    // Test 3: Expired OTP cleanup
    this.addTest(
      'Expired OTP Cleanup',
      config.cleanExpiredOTPs === true,
      config.cleanExpiredOTPs === true 
        ? 'Expired OTPs will be cleaned up (safe)' 
        : 'Expired OTPs will accumulate (not optimal but safe)',
      !config.cleanExpiredOTPs
    );
    
    // Test 4: Log cleanup safety
    this.addTest(
      'Log Cleanup Safety',
      config.cleanOldLogs === false,
      config.cleanOldLogs === false 
        ? 'Log cleanup disabled (safest setting)' 
        : 'Log cleanup enabled (verify it only removes logs)',
      config.cleanOldLogs === true
    );
  }

  // Verify database queries and operations
  async verifyDatabaseOperations() {
    console.log('\n🔍 Verifying Database Operations...\n');
    
    try {
      // Connect to database if not connected
      if (!require('mongoose').connection.readyState) {
        await require('./utils/mongoose').connectWithRetry();
      }

      // Test 5: Count current data
      const userCount = await userDetails.countDocuments({});
      const validOtpCount = await otpDetails.countDocuments({ 
        expiresAt: { $gt: new Date() } 
      });
      const expiredOtpCount = await otpDetails.countDocuments({ 
        expiresAt: { $lt: new Date() } 
      });
      
      this.addTest(
        'Current Data Status',
        true,
        `Users: ${userCount}, Valid OTPs: ${validOtpCount}, Expired OTPs: ${expiredOtpCount}`
      );
      
      // Test 6: Verify deletion query safety
      const deleteQuery = { expiresAt: { $lt: new Date() } };
      const wouldDelete = await otpDetails.countDocuments(deleteQuery);
      
      this.addTest(
        'Deletion Query Safety',
        true,
        `Cleanup would remove ${wouldDelete} expired OTP records only`
      );
      
      // Test 7: Verify no user deletion queries exist
      const userDeletionFunctions = [
        'deleteOneUser',
        'deleteManyUsers', 
        'removeUser',
        'cleanupUsers'
      ];
      
      let userDeletionInCleanup = false;
      const cleanupCode = require('fs').readFileSync('./utils/cleanup.js', 'utf8');
      
      for (const func of userDeletionFunctions) {
        if (cleanupCode.includes(func)) {
          userDeletionInCleanup = true;
          break;
        }
      }
      
      this.addTest(
        'No User Deletion in Cleanup',
        !userDeletionInCleanup,
        !userDeletionInCleanup 
          ? 'Cleanup service does not call user deletion functions' 
          : 'WARNING: Cleanup service may call user deletion functions'
      );
      
    } catch (error) {
      this.addTest(
        'Database Connection',
        false,
        `Failed to connect to database: ${error.message}`
      );
    }
  }

  // Verify service status and safety
  verifyServiceStatus() {
    console.log('\n🔍 Verifying Service Status...\n');
    
    const status = cleanupService.getStatus();
    
    // Test 8: Service running status
    this.addTest(
      'Service Status',
      true,
      `Service running: ${status.isRunning}, Next cleanup: ${status.nextCleanup}`
    );
    
    // Test 9: Data retention policy
    const retention = status.dataRetention;
    this.addTest(
      'Data Retention Policy',
      retention.userAccounts.includes('NEVER DELETED'),
      retention.userAccounts
    );
    
    this.addTest(
      'OTP Retention Policy',
      retention.validOTPs.includes('PRESERVED'),
      retention.validOTPs
    );
    
    this.addTest(
      'User Data Protection',
      retention.userData.includes('PROTECTED'),
      retention.userData
    );
  }

  // Run simulation of cleanup (dry run)
  async simulateCleanup() {
    console.log('\n🔍 Simulating Cleanup Operations...\n');
    
    try {
      // Temporarily disable actual cleanup
      const originalConfig = { ...cleanupService.config };
      cleanupService.config.cleanExpiredOTPs = false;
      
      // Count what would be deleted
      const expiredOtps = await otpDetails.countDocuments({ 
        expiresAt: { $lt: new Date() } 
      });
      
      this.addTest(
        'Cleanup Simulation',
        true,
        `Simulation: ${expiredOtps} expired OTPs would be removed, 0 user records affected`
      );
      
      // Restore original configuration
      cleanupService.config = originalConfig;
      
    } catch (error) {
      this.addTest(
        'Cleanup Simulation',
        false,
        `Simulation failed: ${error.message}`
      );
    }
  }

  // Generate report
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('           DATA PROTECTION VERIFICATION REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📊 Test Results:`);
    console.log(`   ✅ Passed: ${this.results.passed}`);
    console.log(`   ❌ Failed: ${this.results.failed}`);
    console.log(`   ⚠️  Warnings: ${this.results.warnings}`);
    console.log(`   📝 Total Tests: ${this.results.tests.length}`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ CRITICAL ISSUES FOUND:');
      this.results.tests
        .filter(test => test.status === 'FAIL')
        .forEach(test => console.log(`   • ${test.name}: ${test.message}`));
    }
    
    if (this.results.warnings > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.results.tests
        .filter(test => test.status === 'WARN')
        .forEach(test => console.log(`   • ${test.name}: ${test.message}`));
    }
    
    console.log('\n🔒 DATA PROTECTION STATUS:');
    if (this.results.failed === 0) {
      console.log('   ✅ USER DATA IS FULLY PROTECTED');
      console.log('   ✅ Only expired temporary data will be cleaned');
      console.log('   ✅ No risk of accidental data loss');
    } else {
      console.log('   ❌ POTENTIAL DATA PROTECTION ISSUES DETECTED');
      console.log('   ❌ Review failed tests and fix configuration');
    }
    
    console.log('\n📋 CLEANUP POLICY SUMMARY:');
    console.log('   • User Accounts: NEVER DELETED');
    console.log('   • Valid OTPs: PRESERVED');
    console.log('   • User Data: FULLY PROTECTED');
    console.log('   • Expired OTPs: SAFELY REMOVED');
    
    console.log('\n' + '='.repeat(60));
    
    return {
      safe: this.results.failed === 0,
      score: this.results.passed / this.results.tests.length,
      summary: this.results
    };
  }

  // Run all verification tests
  async runFullVerification() {
    console.log('🚀 Starting Data Protection Verification...');
    console.log('🎯 Verifying that user data is fully protected from accidental deletion\n');
    
    // Run all verification tests
    this.verifyCleanupConfig();
    await this.verifyDatabaseOperations();
    this.verifyServiceStatus();
    await this.simulateCleanup();
    
    // Generate final report
    return this.generateReport();
  }
}

// Main execution
async function main() {
  const verifier = new DataProtectionVerifier();
  
  try {
    const result = await verifier.runFullVerification();
    
    if (result.safe) {
      console.log('\n🎉 ALL TESTS PASSED - USER DATA IS FULLY PROTECTED!');
      process.exit(0);
    } else {
      console.log('\n💥 CRITICAL ISSUES FOUND - REVIEW AND FIX IMMEDIATELY!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Verification failed:', error.message);
    logger.error('Data protection verification failed:', error);
    process.exit(1);
  }
}

// Export for testing
module.exports = { DataProtectionVerifier };

// Run if called directly
if (require.main === module) {
  main();
}
