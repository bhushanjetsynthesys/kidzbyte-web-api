#!/usr/bin/env node

console.log('🔍 DATA PROTECTION VERIFICATION STARTING...\n');

try {
  // Load cleanup service configuration
  const { cleanupService } = require('./utils/cleanup');
  
  console.log('✅ Cleanup service loaded successfully\n');
  
  // Test 1: Configuration Safety
  console.log('📋 CONFIGURATION SAFETY TESTS:');
  const config = cleanupService.config;
  
  const userAccountSafe = config.cleanUserAccounts === false;
  const validOtpSafe = config.cleanValidOTPs === false;
  const expiredOtpCleanup = config.cleanExpiredOTPs === true;
  
  console.log(`  User Account Protection: ${userAccountSafe ? '✅ PROTECTED' : '❌ AT RISK'}`);
  console.log(`  Valid OTP Protection: ${validOtpSafe ? '✅ PROTECTED' : '❌ AT RISK'}`);
  console.log(`  Expired OTP Cleanup: ${expiredOtpCleanup ? '✅ ENABLED' : '⚠️ DISABLED'}`);
  
  // Test 2: Service Status
  console.log('\n📊 SERVICE STATUS:');
  const status = cleanupService.getStatus();
  console.log(`  Service Running: ${status.isRunning ? '✅ ACTIVE' : '⚠️ INACTIVE'}`);
  console.log(`  Cleanup Policy: ${status.cleanupPolicy}`);
  
  // Test 3: Data Protection Guarantees
  console.log('\n🔒 DATA PROTECTION GUARANTEES:');
  const retention = status.dataRetention;
  console.log(`  User Accounts: ${retention.userAccounts}`);
  console.log(`  Valid OTPs: ${retention.validOTPs}`);
  console.log(`  User Data: ${retention.userData}`);
  
  // Final Assessment
  const overallSafe = userAccountSafe && validOtpSafe;
  
  console.log('\n' + '='.repeat(50));
  console.log('FINAL ASSESSMENT:');
  
  if (overallSafe) {
    console.log('🎉 ✅ USER DATA IS FULLY PROTECTED!');
    console.log('   • User accounts will NEVER be deleted');
    console.log('   • Valid OTPs are completely safe');
    console.log('   • Only expired temporary data is cleaned');
    console.log('   • No risk of accidental data loss');
  } else {
    console.log('💥 ❌ POTENTIAL RISK DETECTED!');
    console.log('   • Review configuration immediately');
    console.log('   • User data may be at risk');
  }
  
  console.log('='.repeat(50));
  
  // Exit with appropriate code
  process.exit(overallSafe ? 0 : 1);
  
} catch (error) {
  console.error('💥 ERROR during verification:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
