# Data Protection Policy & Configuration

## Overview
This document outlines the comprehensive data protection policies implemented in the KD_Backend authentication API to ensure **user data is NEVER accidentally deleted**.

## Data Protection Guarantees

### ✅ PROTECTED DATA (Never Removed)
1. **User Accounts** - All user records in `userDetails` collection
2. **Valid OTPs** - Any OTP that hasn't expired (`expiresAt > current time`)
3. **User Profile Data** - Names, emails, phone numbers, preferences
4. **Active Sessions** - Valid user sessions and authentication tokens

### ⚠️ CLEANUP TARGETS (Only Expired Data)
1. **Expired OTPs** - Only OTPs where `expiresAt < current time`
2. **Old Session Tokens** - Only expired authentication tokens (if tracked)
3. **Application Logs** - Optional cleanup of old log files (disabled by default)

## Database Cleanup Service Configuration

### Current Safety Settings
```javascript
{
  // ✅ SAFE: Only removes expired OTPs
  cleanExpiredOTPs: true,
  
  // 🔒 PROTECTED: Never remove user accounts
  cleanUserAccounts: false,
  
  // 🔒 PROTECTED: Never remove valid OTPs
  cleanValidOTPs: false,
  
  // ⚠️ OPTIONAL: Log cleanup (disabled by default)
  cleanOldLogs: false,
  
  // Cleanup frequency
  cleanupIntervalMinutes: 30
}
```

### Deletion Query Analysis
The only active deletion operation:
```javascript
// This query ONLY removes OTPs that have already expired
otpDetails.deleteMany({ expiresAt: { $lt: new Date() } })
```

**Safety Analysis:**
- ✅ Only targets records where `expiresAt` is LESS than current time
- ✅ Expired OTPs are no longer valid for authentication
- ✅ Does NOT touch any user account data
- ✅ Does NOT remove valid/unexpired OTPs

## Implementation Safeguards

### 1. Configuration Safeguards
- `cleanUserAccounts: false` - Hardcoded to never allow user deletion
- `cleanValidOTPs: false` - Hardcoded to never allow valid OTP deletion
- Multiple confirmation checks in manual cleanup functions

### 2. Code-Level Protections
- No user deletion functions called in cleanup service
- Explicit logging of what will/won't be deleted
- Error handling prevents partial deletions
- Database operation isolation

### 3. Monitoring & Logging
```javascript
// Before every cleanup
logger.info('USER DATA PROTECTION: User accounts, valid OTPs, and user data will NOT be touched');

// After every cleanup
logger.info('USER DATA STATUS: All user accounts and valid data preserved');
```

### 4. Manual Override Protection
```javascript
// Manual cleanup requires explicit confirmation
async performManualCleanup(confirmSafe = false) {
  if (!confirmSafe) {
    logger.warn('Manual cleanup requires confirmation that only expired data should be removed');
    return false;
  }
}
```

## Database Schema & Indexes

### OTP Collection Structure
```javascript
{
  identifier: String,      // Email/phone
  identifierType: String,  // 'email' or 'phone'
  otp: String,            // The OTP code
  expiresAt: Date,        // Expiration timestamp - USED FOR SAFE CLEANUP
  purpose: String,        // 'login', 'reset', etc.
  isUsed: Boolean,        // Whether OTP was used
  sessionToken: String,   // Associated session
  createdAt: Date,        // Creation timestamp
  updatedAt: Date         // Last update
}
```

**Cleanup Logic:** Only removes records where `expiresAt < now()`

### User Collection Structure
```javascript
{
  name: String,           // User's full name
  email: String,          // Email address
  phoneNumber: String,    // Phone number
  isVerified: Boolean,    // Verification status
  lastLogin: Date,        // Last login timestamp
  createdAt: Date,        // Registration date
  updatedAt: Date         // Last update
}
```

**Protection:** NO cleanup operations target this collection

## Emergency Procedures

### Disable All Cleanup (Emergency)
```javascript
const { cleanupService } = require('./utils/cleanup');
cleanupService.disableCleanup();
```

### Check Current Status
```javascript
const status = cleanupService.getStatus();
console.log(status.dataRetention);
```

### Manual Review Before Cleanup
```javascript
// Count expired OTPs before deletion
const expiredCount = await otpDetails.countDocuments({ 
  expiresAt: { $lt: new Date() } 
});
console.log(`Will delete ${expiredCount} expired OTPs`);
```

## Testing Data Protection

### Verification Commands
```bash
# Check user count (should never decrease)
mongo your_db --eval "db.userdetails.count()"

# Check valid OTP count (should not be affected by cleanup)
mongo your_db --eval "db.otpdetails.count({ expiresAt: { \$gt: new Date() } })"

# Check expired OTP count (should decrease after cleanup)
mongo your_db --eval "db.otpdetails.count({ expiresAt: { \$lt: new Date() } })"
```

## Compliance & Audit Trail

### What Gets Logged
1. Cleanup service start/stop events
2. Configuration changes
3. Number of records cleaned (by type)
4. Explicit user data protection confirmations
5. Any errors during cleanup operations

### What Never Gets Logged
1. Actual user data contents
2. OTP codes or sensitive information
3. User passwords or authentication secrets

## Development & Testing

### Test Environment Settings
```javascript
// For development/testing, disable all cleanup
if (process.env.APP_ENV === 'development') {
  cleanupService.disableCleanup();
}
```

### Staging Environment
- Enable only expired OTP cleanup
- Enhanced logging and monitoring
- Manual approval for any configuration changes

### Production Environment
- Automated expired OTP cleanup only
- Comprehensive monitoring and alerting
- Read-only access to user data for cleanup service

## Summary

**The database cleanup service is configured with multiple layers of protection to ensure:**

1. ✅ **User accounts are NEVER deleted**
2. ✅ **Valid OTPs are NEVER removed**
3. ✅ **User data is completely protected**
4. ✅ **Only expired, invalid temporary data is cleaned**
5. ✅ **Comprehensive logging and monitoring**
6. ✅ **Emergency override capabilities**

**The system prioritizes data protection over storage optimization, ensuring no accidental data loss.**
