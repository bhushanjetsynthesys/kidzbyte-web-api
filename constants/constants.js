exports.utilityConstants = {
  modelConfig: {
    userDetails: {
      model: 'userDetails',
      collection: 'userDetails',
    },
    otpDetails: {
      model: 'otpDetails',
      collection: 'otpDetails',
    },
    schoolDetails: {
      model: 'schoolDetails',
      collection: 'schoolDetails',
    },
     newsDetails: {
      model: 'newsDetails',
      collection: 'newsDetails',
    },
    commonSkipFields: '-__v -updatedAt -createdAt -_id',
  },
  serviceResponseCodes: {
    success: 200,
    error: 400,
    serverError: 500,
    unauthorized: 401,
    dataNotFound: 404,
  },
  commonResponse: {
    serverError: 'An Error occurred please try again',
    otpLimitReached: 'OTP Request Limit Reached. Please wait for 30 minutes.',
    otpSent: 'OTP sent successfully',
    otpError: 'Error while sending OTP',
    otpInvalid: 'OTP you entered is incorrect',
    otpExpired: 'OTP Expired',
    otpVerified: 'OTP verified successfully.',
    otpVerificationMessage: 'OTP verified successfully',
    inCorrectCredentials: 'Incorrect Credentials.',
    loginPasswordChanged: 'Login password changed.',
    loginSuccessfull: 'Successfully logged In.',
    userNotFound: 'User not found.',
    userCreated: 'User registered successfully.',
    loginInitiated: 'Login initiated. OTP sent to your email/mobile.',
    querySent: 'Query sent.',
    passwordChangedSuccessfully: 'Password changed successfully.',
    newsRetrieved: 'News articles retrieved successfully.',
  },
  errorTypes: {
    'doesnt exist': 404,
  },
  errorFields: {
    user: 'User ',
  },
  validationErrorData: {
    message: 'msg',
  },
  defaultOrderFields: ['asc', 'desc'],

  enums: {
    minimumValidation: { min: 1 },
    status: [1, 0],
    platforms: ['android', 'ios', 'web'],
    allowedJwtStatus: ['TokenExpiredError', 'validToken'],
    defaultPage: 1,
    defaultLimit: 10,
    defaultSort: '_id',
    defaultOrder: -1,
    errorLocations: {
      body: 'body',
      params: 'params',
      query: 'query',
    },
  },
  messages: {
    errors: {
      invalidToken: 'Authentication token is invalid',
      malformedToken: 'Authentication token is malformed',
      missingAuthKey: 'Missing Authorization key',
      expiredOrInvalidToken: 'Token expired or invalid',
    },
  },
};
