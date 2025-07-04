# User Authentication API

A secure authentication API with OTP-based login supporting both email and mobile number verification.

## Features

- 🔐 **OTP-based Authentication** - Secure login with email or mobile number
- 📱 **SMS & Email Support** - Send OTP via SMS (Twilio) or Email (AWS SES)
- 🚀 **JWT Token Authentication** - Secure API access with JWT tokens
- 📚 **Swagger Documentation** - Interactive API documentation
- 🔍 **Input Validation** - Comprehensive request validation
- 📊 **Logging** - Detailed logging with Winston
- 🗄️ **MongoDB Integration** - Database operations with Mongoose
- 🔄 **Rate Limiting** - OTP request limits to prevent abuse

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- AWS Account (for SES email service)
- Twilio Account (for SMS service)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd KD_Backend
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp env/.env-dev-sample env/.env-dev
# Edit env/.env-dev with your configuration
```

4. Start the development server
```bash
npm run start:local
```

### Environment Configuration

Create a `.env-dev` file in the `env/` directory with the following variables:

```env
# Database
ATLAS_DNS=mongodb://localhost:27017/userauth

# JWT
JWT_SECRET=your-super-secret-jwt-key

# AWS SES (Email)
SES_REGION=us-east-1
SES_KEY=your-ses-key
SES_SECRET=your-ses-secret
MAIL_FROM_ADDRESS=noreply@yourdomain.com

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

## API Documentation

Interactive API documentation is available at: `http://localhost:3000/web-api-docs`

### Authentication Endpoints

#### 1. Initiate Login
```
POST /auth/login
```

Send OTP to user's email or mobile number.

**Request Body:**
```json
{
  "identifier": "user@example.com", // or mobile number
  "fullName": "John Doe", // required for new users
  "countryCode": "+91", // optional, default +91
  "deviceInfo": { // optional
    "deviceType": "mobile",
    "platform": "android",
    "appVersion": "1.0.0"
  }
}
```

**Response:**
```json
{
  "message": "Login initiated. OTP sent to your email/mobile.",
  "sessionToken": "abc123...",
  "identifierType": "email",
  "expiresIn": 600
}
```

#### 2. Verify OTP
```
POST /auth/verify-otp
```

Verify OTP and get authentication token.

**Request Body:**
```json
{
  "sessionToken": "abc123...",
  "otp": "123456",
  "identifier": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Successfully logged In.",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "60d5ecb74b4b3c001f5e9c8f",
    "email": "user@example.com",
    "fullName": "John Doe",
    "isEmailVerified": true,
    "lastLoginAt": "2025-06-26T10:30:00.000Z"
  }
}
```

#### 3. Get Profile (Protected)
```
GET /auth/profile
Authorization: Bearer <jwt-token>
```

Get authenticated user's profile information.

## Key Features

### OTP Security
- 6-digit numeric OTP
- 10-minute expiration
- Maximum 3 attempts per OTP
- Rate limiting: 5 OTPs per 30 minutes
- Automatic cleanup of expired OTPs

### User Management
- Support for both email and mobile login
- Automatic user creation on first login
- Device information tracking
- Email/mobile verification status
- Last login tracking

### Database Schema

#### User Details
```javascript
{
  email: String,
  mobileNumber: String,
  countryCode: String,
  fullName: String,
  isEmailVerified: Boolean,
  isMobileVerified: Boolean,
  lastLoginAt: Date,
  isActive: Boolean,
  deviceInfo: {
    deviceType: String,
    deviceId: String,
    platform: String,
    appVersion: String
  }
}
```

#### OTP Details
```javascript
{
  identifier: String, // email or mobile
  identifierType: String, // 'email' or 'mobile'
  otp: String,
  purpose: String, // 'login', 'registration', 'password_reset'
  attempts: Number,
  maxAttempts: Number,
  isUsed: Boolean,
  expiresAt: Date,
  sessionToken: String
}
```

## Project Structure

```
├── constants/           # Application constants
├── env/                # Environment configurations
├── helper/             # Helper functions and utilities
├── middlewares/        # Express middlewares
├── models/             # Mongoose models
├── orm/                # Database operations
├── routes/             # API routes
├── service/            # Business logic
├── utils/              # Utility functions
├── validator/          # Request validation
└── main.js            # Application entry point
```

## Scripts

```bash
npm run start:local    # Start development server
npm run start:dev      # Start development server
npm run test          # Run tests
npm run lint          # Run ESLint
npm run prettier      # Format code
```

## Security Features

- JWT token-based authentication
- Request sanitization (MongoDB injection prevention)
- Input validation with express-validator
- Rate limiting for OTP requests
- CORS enabled
- Request logging

## Error Handling

The API uses consistent error response format:

```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm run testWithCoverage
```

## Contributing

1. Follow the existing code structure
2. Add appropriate validation for new endpoints
3. Include Swagger documentation for new APIs
4. Write tests for new functionality
5. Follow the commit message conventions

## License

ISC - Jetsynthesys Private Limited
