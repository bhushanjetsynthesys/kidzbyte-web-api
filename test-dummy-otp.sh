#!/bin/bash

# Dummy OTP Testing Script
# Tests the complete dummy OTP login flow for local/stage environments

BASE_URL="http://localhost:3001/api"
DUMMY_MOBILE="1234567899"
DUMMY_EMAIL="abc@gmail.com"
DUMMY_OTP="1234"

echo "🧪 DUMMY OTP TESTING SCRIPT"
echo "=============================="
echo "Testing Environment: $(curl -s http://localhost:3001/health | grep -o '"status":"[^"]*"')"
echo ""

# Function to pretty print JSON
pretty_json() {
    if command -v python3 >/dev/null 2>&1; then
        python3 -m json.tool
    elif command -v jq >/dev/null 2>&1; then
        jq '.'
    else
        cat
    fi
}

# Test 1: Login with dummy mobile number
echo "📱 TEST 1: Login with Dummy Mobile Number ($DUMMY_MOBILE)"
echo "=================================================="
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"identifier\": \"$DUMMY_MOBILE\", \"countryCode\": \"+91\"}")

echo "Response:"
echo "$LOGIN_RESPONSE" | pretty_json
echo ""

# Extract session token
SESSION_TOKEN=$(echo "$LOGIN_RESPONSE" | sed -n 's/.*"sessionToken":"\([^"]*\)".*/\1/p')
DUMMY_OTP_FROM_RESPONSE=$(echo "$LOGIN_RESPONSE" | sed -n 's/.*"dummyOTP":"\([^"]*\)".*/\1/p')

if [ -n "$SESSION_TOKEN" ]; then
    echo "✅ Session Token: ${SESSION_TOKEN:0:20}..."
    if [ -n "$DUMMY_OTP_FROM_RESPONSE" ]; then
        echo "✅ Dummy OTP Received: $DUMMY_OTP_FROM_RESPONSE"
    fi
    echo ""
    
    # Test 2: Verify OTP with dummy mobile
    echo "🔐 TEST 2: Verify Dummy OTP for Mobile ($DUMMY_OTP)"
    echo "=========================================="
    VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/verify-otp" \
      -H "Content-Type: application/json" \
      -d "{\"sessionToken\": \"$SESSION_TOKEN\", \"otp\": \"$DUMMY_OTP\", \"identifier\": \"$DUMMY_MOBILE\"}")
    
    echo "Response:"
    echo "$VERIFY_RESPONSE" | pretty_json
    echo ""
    
    JWT_TOKEN=$(echo "$VERIFY_RESPONSE" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
    if [ -n "$JWT_TOKEN" ]; then
        echo "✅ JWT Token: ${JWT_TOKEN:0:50}..."
        echo ""
    fi
else
    echo "❌ Failed to get session token from mobile login"
    echo ""
fi

# Test 3: Login with dummy email
echo "📧 TEST 3: Login with Dummy Email ($DUMMY_EMAIL)"
echo "=================================================="
EMAIL_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"identifier\": \"$DUMMY_EMAIL\"}")

echo "Response:"
echo "$EMAIL_LOGIN_RESPONSE" | pretty_json
echo ""

# Extract session token for email
EMAIL_SESSION_TOKEN=$(echo "$EMAIL_LOGIN_RESPONSE" | sed -n 's/.*"sessionToken":"\([^"]*\)".*/\1/p')
EMAIL_DUMMY_OTP=$(echo "$EMAIL_LOGIN_RESPONSE" | sed -n 's/.*"dummyOTP":"\([^"]*\)".*/\1/p')

if [ -n "$EMAIL_SESSION_TOKEN" ]; then
    echo "✅ Email Session Token: ${EMAIL_SESSION_TOKEN:0:20}..."
    if [ -n "$EMAIL_DUMMY_OTP" ]; then
        echo "✅ Dummy OTP Received: $EMAIL_DUMMY_OTP"
    fi
    echo ""
    
    # Test 4: Verify OTP with dummy email
    echo "🔐 TEST 4: Verify Dummy OTP for Email ($DUMMY_OTP)"
    echo "=========================================="
    EMAIL_VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/verify-otp" \
      -H "Content-Type: application/json" \
      -d "{\"sessionToken\": \"$EMAIL_SESSION_TOKEN\", \"otp\": \"$DUMMY_OTP\", \"identifier\": \"$DUMMY_EMAIL\"}")
    
    echo "Response:"
    echo "$EMAIL_VERIFY_RESPONSE" | pretty_json
    echo ""
    
    EMAIL_JWT_TOKEN=$(echo "$EMAIL_VERIFY_RESPONSE" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
    if [ -n "$EMAIL_JWT_TOKEN" ]; then
        echo "✅ Email JWT Token: ${EMAIL_JWT_TOKEN:0:50}..."
        echo ""
    fi
else
    echo "❌ Failed to get session token from email login"
    echo ""
fi

# Test 5: Test with wrong OTP
echo "❌ TEST 5: Test Wrong OTP (Should Fail)"
echo "========================================"
if [ -n "$SESSION_TOKEN" ]; then
    WRONG_OTP_RESPONSE=$(curl -s -X POST "$BASE_URL/verify-otp" \
      -H "Content-Type: application/json" \
      -d "{\"sessionToken\": \"$SESSION_TOKEN\", \"otp\": \"9999\", \"identifier\": \"$DUMMY_MOBILE\"}")
    
    echo "Response:"
    echo "$WRONG_OTP_RESPONSE" | pretty_json
    echo ""
fi

# Test 6: Test Resend OTP
echo "🔄 TEST 6: Resend OTP for Mobile"
echo "================================="
RESEND_RESPONSE=$(curl -s -X POST "$BASE_URL/resend-otp" \
  -H "Content-Type: application/json" \
  -d "{\"identifier\": \"$DUMMY_MOBILE\", \"countryCode\": \"+91\"}")

echo "Response:"
echo "$RESEND_RESPONSE" | pretty_json
echo ""

# Summary
echo "📋 SUMMARY"
echo "=========="
echo "✅ Dummy Mobile Number: $DUMMY_MOBILE"
echo "✅ Dummy Email: $DUMMY_EMAIL"
echo "✅ Dummy OTP: $DUMMY_OTP"
echo "✅ Environment: Development (dummy OTP enabled)"
echo ""
echo "🔒 Security Notes:"
echo "• Dummy OTP only works in development/staging environments"
echo "• In production, real OTP would be sent via SMS/Email"
echo "• Only the specified test accounts use dummy OTP"
echo "• All other accounts use real OTP generation and sending"
echo ""
echo "🎯 Test Results:"
if [ -n "$JWT_TOKEN" ]; then
    echo "✅ Mobile Login Flow: SUCCESS"
else
    echo "❌ Mobile Login Flow: FAILED"
fi

if [ -n "$EMAIL_JWT_TOKEN" ]; then
    echo "✅ Email Login Flow: SUCCESS"
else
    echo "❌ Email Login Flow: FAILED"
fi

echo ""
echo "🎉 Dummy OTP Testing Complete!"
