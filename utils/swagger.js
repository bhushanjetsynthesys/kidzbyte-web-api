const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'KB Web Backend',
      version: '2.0.0',
      description: `API documentation for KB Web Backend with OTP-based Authentication
      
      ## Dummy OTP Testing (Local/Stage Only)
      
      For testing purposes in development and staging environments, you can use these test accounts:
      
      **Test Mobile Number:** 1234567899
      **Test Email:** abc@gmail.com
      **Dummy OTP:** 1234
      
      These accounts will always receive the dummy OTP (1234) instead of a real SMS/email.
      This feature is automatically disabled in production environments for security.
      
      ### How to use:
      1. Use the test mobile number (1234567899) or email (abc@gmail.com) in the login request
      2. The system will return the dummy OTP (1234) in the response for development
      3. Use 1234 as the OTP in the verification request
      4. The flow works exactly like real accounts but with predictable test data
      
      ⚠️ **Security Note:** Dummy OTP functionality is only available in development/staging environments.`,
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: process.env.API_BASEURL || 'http://localhost:3008',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['identifier'],
          properties: {
            identifier: {
              type: 'string',
              description: 'Mobile number or email address. Use "1234567899" or "abc@gmail.com" for dummy OTP testing in dev/stage.',
              oneOf: [
                {
                  example: 'john@example.com',
                  description: 'Regular email address'
                },
                {
                  example: 'abc@gmail.com',
                  description: 'Test email for dummy OTP (dev/stage only)'
                },
                {
                  example: '1234567899',
                  description: 'Test mobile for dummy OTP (dev/stage only)'
                }
              ]
            },
            fullName: {
              type: 'string',
              description: 'User full name (for new users)',
              example: 'John Doe'
            },
            countryCode: {
              type: 'string',
              description: 'Country code for mobile numbers',
              example: '+1'
            },
            deviceInfo: {
              type: 'object',
              description: 'Device information',
              example: {
                deviceType: 'mobile',
                os: 'iOS',
                version: '14.0'
              }
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'OTP sent successfully'
            },
            sessionToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            identifierType: {
              type: 'string',
              example: 'email'
            },
            expiresIn: {
              type: 'number',
              example: 600
            },
            developmentInfo: {
              type: 'object',
              description: 'Additional info for dummy accounts (development only)',
              properties: {
                isDummyAccount: {
                  type: 'boolean',
                  example: true
                },
                dummyOTP: {
                  type: 'string',
                  example: '1234'
                },
                note: {
                  type: 'string',
                  example: 'This is a test account. In production, OTP would be sent normally.'
                }
              }
            }
          }
        },
        ResendOTPRequest: {
          type: 'object',
          required: ['identifier'],
          properties: {
            identifier: {
              type: 'string',
              description: 'Mobile number or email address',
              example: 'john@example.com'
            },
            countryCode: {
              type: 'string',
              description: 'Country code for mobile numbers',
              example: '+1'
            }
          }
        },
        ResendOTPResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'OTP resent successfully. Please check your email/mobile.'
            },
            sessionToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            identifierType: {
              type: 'string',
              example: 'email'
            },
            expiresIn: {
              type: 'number',
              example: 540
            },
            isResent: {
              type: 'boolean',
              example: true
            }
          }
        },
        OTPVerificationRequest: {
          type: 'object',
          required: ['sessionToken', 'otp', 'identifier'],
          properties: {
            sessionToken: {
              type: 'string',
              description: 'Session token from login response',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            otp: {
              type: 'string',
              description: '6-digit OTP code. Use "1234" for dummy test accounts (1234567899 or abc@gmail.com)',
              oneOf: [
                {
                  example: '123456',
                  description: 'Regular OTP for normal accounts'
                },
                {
                  example: '1234',
                  description: 'Dummy OTP for test accounts in dev/stage'
                }
              ]
            },
            identifier: {
              type: 'string',
              description: 'Mobile number or email address. Must match the identifier used in login.',
              oneOf: [
                {
                  example: 'john@example.com',
                  description: 'Regular account identifier'
                },
                {
                  example: 'abc@gmail.com',
                  description: 'Test email for dummy OTP'
                },
                {
                  example: '1234567899',
                  description: 'Test mobile for dummy OTP'
                }
              ]
            }
          }
        },
        OTPVerificationResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Login successful'
            },
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            user: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  example: '507f1f77bcf86cd799439011'
                },
                email: {
                  type: 'string',
                  example: 'john@example.com'
                },
                mobileNumber: {
                  type: 'string',
                  example: '+1234567890'
                },
                fullName: {
                  type: 'string',
                  example: 'John Doe'
                },
                isEmailVerified: {
                  type: 'boolean',
                  example: true
                },
                isMobileVerified: {
                  type: 'boolean',
                  example: false
                },
                lastLoginAt: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-06-26T10:00:00.000Z'
                }
              }
            }
          }
        },
        UserProfile: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'User profile retrieved successfully'
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      example: '507f1f77bcf86cd799439011'
                    },
                    email: {
                      type: 'string',
                      example: 'john@example.com'
                    },
                    mobile: {
                      type: 'string',
                      example: '+1234567890'
                    },
                    fullName: {
                      type: 'string',
                      example: 'John Doe'
                    },
                    countryCode: {
                      type: 'string',
                      example: '+1'
                    },
                    createdAt: {
                      type: 'string',
                      format: 'date-time',
                      example: '2025-06-26T10:00:00.000Z'
                    },
                    lastLogin: {
                      type: 'string',
                      format: 'date-time',
                      example: '2025-06-26T10:00:00.000Z'
                    }
                  }
                }
              }
            }
          }
        },
        LogoutResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Logout successful'
            }
          }
        },
        StudentProfileRequest: {
          type: 'object',
          required: ['userId', 'fullName', 'age', 'institution'],
          properties: {
            userId: {
              type: 'string',
              description: 'User ID (MongoDB ObjectId)',
              example: '507f1f77bcf86cd799439011'
            },
            fullName: {
              type: 'string',
              description: 'Student full name',
              minLength: 2,
              maxLength: 100,
              example: 'John Doe'
            },
            age: {
              type: 'integer',
              description: 'Student age',
              minimum: 1,
              maximum: 150,
              example: 20
            },
            institution: {
              type: 'string',
              description: 'Educational institution name',
              minLength: 2,
              maxLength: 200,
              example: 'Harvard University'
            },
            filePath: {
              type: 'string',
              description: 'File path for documents (resume, etc.) - optional',
              nullable: true,
              example: '/uploads/documents/resume.pdf'
            }
          }
        },
        StudentProfileResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Student profile created/updated successfully'
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      example: '507f1f77bcf86cd799439011'
                    },
                    fullName: {
                      type: 'string',
                      example: 'John Doe'
                    },
                    age: {
                      type: 'integer',
                      example: 20
                    },
                    institution: {
                      type: 'string',
                      example: 'Harvard University'
                    },
                    filePath: {
                      type: 'string',
                      nullable: true,
                      example: '/uploads/documents/resume.pdf'
                    },
                    email: {
                      type: 'string',
                      example: 'john@example.com'
                    },
                    mobileNumber: {
                      type: 'string',
                      example: '+1234567890'
                    },
                    updatedAt: {
                      type: 'string',
                      format: 'date-time',
                      example: '2025-06-27T10:00:00.000Z'
                    }
                  }
                }
              }
            }
          }
        },
        SchoolListResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Schools retrieved successfully'
            },
            data: {
              type: 'object',
              properties: {
                schools: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/School'
                  }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    currentPage: {
                      type: 'integer',
                      example: 1
                    },
                    totalPages: {
                      type: 'integer',
                      example: 5
                    },
                    totalSchools: {
                      type: 'integer',
                      example: 98
                    },
                    limit: {
                      type: 'integer',
                      example: 20
                    },
                    hasNextPage: {
                      type: 'boolean',
                      example: true
                    },
                    hasPrevPage: {
                      type: 'boolean',
                      example: false
                    }
                  }
                }
              }
            }
          }
        },
        School: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              example: 'Harvard University'
            },
            address: {
              type: 'object',
              properties: {
                street: {
                  type: 'string',
                  example: 'Massachusetts Hall'
                },
                city: {
                  type: 'string',
                  example: 'Cambridge'
                },
                state: {
                  type: 'string',
                  example: 'Massachusetts'
                },
                country: {
                  type: 'string',
                  example: 'United States'
                },
                zipCode: {
                  type: 'string',
                  example: '02138'
                }
              }
            },
            contactInfo: {
              type: 'object',
              properties: {
                phone: {
                  type: 'string',
                  example: '+1-617-495-1000'
                },
                email: {
                  type: 'string',
                  example: 'info@harvard.edu'
                },
                website: {
                  type: 'string',
                  example: 'https://www.harvard.edu'
                }
              }
            },
            type: {
              type: 'string',
              enum: ['public', 'private', 'charter', 'international', 'vocational'],
              example: 'private'
            },
            establishedYear: {
              type: 'integer',
              example: 1636
            },
            studentCapacity: {
              type: 'integer',
              example: 20000
            },
            description: {
              type: 'string',
              example: 'Harvard University is a private Ivy League research university in Cambridge, Massachusetts.'
            },
            facilities: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['Library', 'Laboratory', 'Sports Complex', 'Dormitories']
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-06-27T10:00:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-06-27T10:00:00.000Z'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Invalid request'
            }
          }
        },
        QuizQuestion: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            question: {
              type: 'string',
              example: 'What is the capital of France?'
            },
            options: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['Paris', 'London', 'Berlin', 'Madrid']
            },
            correctAnswers: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['Paris']
            }
          }
        },
        NewsArticle: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439013'
            },
            title: {
              type: 'string',
              example: 'Revolutionary AI Technology in Education'
            },
            subTitle: {
              type: 'string',
              example: 'How artificial intelligence is transforming the classroom experience'
            },
            description: {
              type: 'string',
              example: 'A comprehensive look at the latest AI technologies being implemented in educational institutions worldwide.'
            },
            category: {
              type: 'string',
              enum: ['Education', 'Technology', 'Health', 'Science', 'Tips & Tricks', 'Research', 'Announcement', 'General News'],
              example: 'Technology'
            },
            type: {
              type: 'string',
              enum: ['Video', 'Image', 'Text'],
              example: 'Text'
            },
            content_url: {
              type: 'string',
              nullable: true,
              example: 'https://example.com/video/ai-education'
            },
            upload_file: {
              type: 'string',
              nullable: true,
              example: '/uploads/news/ai-education.jpg'
            },
            hasQuiz: {
              type: 'boolean',
              example: true
            },
            status: {
              type: 'string',
              enum: ['Draft', 'Published'],
              example: 'Published'
            },
            author: {
              type: 'string',
              example: 'Dr. Jane Smith'
            },
            quizQuestions: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/QuizQuestion'
              }
            },
            publishedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2025-07-01T10:00:00.000Z'
            },
            viewCount: {
              type: 'number',
              example: 1250
            },
            likes: {
              type: 'number',
              example: 89
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-07-01T08:30:00.000Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-07-01T09:15:00.000Z'
            }
          }
        },
        NewsListResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'News articles retrieved successfully.'
            },
            data: {
              type: 'object',
              properties: {
                articles: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/NewsArticle'
                  }
                },
                pagination: {
                  type: 'object',
                  properties: {
                    currentPage: {
                      type: 'integer',
                      example: 1
                    },
                    totalPages: {
                      type: 'integer',
                      example: 5
                    },
                    totalCount: {
                      type: 'integer',
                      example: 47
                    },
                    hasNextPage: {
                      type: 'boolean',
                      example: true
                    },
                    hasPreviousPage: {
                      type: 'boolean',
                      example: false
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    paths: {
      '/login': {
        post: {
          summary: 'Initiate login process',
          description: 'Send OTP to user\'s email or mobile number',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LoginRequest'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'OTP sent successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/LoginResponse'
                  }
                }
              }
            },
            '400': {
              description: 'Bad request',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '429': {
              description: 'Too many OTP requests',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/verify-otp': {
        post: {
          summary: 'Verify OTP and complete login',
          description: 'Verify the OTP code and return JWT token',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/OTPVerificationRequest'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/OTPVerificationResponse'
                  }
                }
              }
            },
            '400': {
              description: 'Invalid OTP or expired session',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '404': {
              description: 'User not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/profile': {
        get: {
          summary: 'Get user profile',
          description: 'Get authenticated user\'s profile information',
          tags: ['User Profile'],
          security: [
            {
              bearerAuth: []
            }
          ],
          responses: {
            '200': {
              description: 'Profile retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/UserProfile'
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized - Invalid or missing token',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/logout': {
        post: {
          summary: 'Logout user',
          description: 'Logout the authenticated user',
          tags: ['Authentication'],
          security: [
            {
              bearerAuth: []
            }
          ],
          responses: {
            '200': {
              description: 'Logout successful',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/LogoutResponse'
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized - Invalid or missing token',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/resend-otp': {
        post: {
          summary: 'Resend OTP',
          description: 'Resend existing OTP if not expired, or generate new OTP if expired',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ResendOTPRequest'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'OTP resent successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ResendOTPResponse'
                  }
                }
              }
            },
            '400': {
              description: 'Bad request',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '404': {
              description: 'User not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '429': {
              description: 'Too many OTP requests',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/create-profile': {
        post: {
          summary: 'Create or update student profile',
          description: 'Create a new student profile or update existing profile data. If the user already exists, their profile will be updated with the new information.',
          tags: ['User Profile'],
          security: [
            {
              bearerAuth: []
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/StudentProfileRequest'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Student profile created/updated successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/StudentProfileResponse'
                  }
                }
              }
            },
            '400': {
              description: 'Bad request - Validation errors',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      {
                        $ref: '#/components/schemas/ErrorResponse'
                      },
                      {
                        type: 'object',
                        properties: {
                          type: {
                            type: 'string',
                            example: 'VALIDATION_ERROR'
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '401': {
              description: 'Unauthorized - Invalid or missing token',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            },
            '404': {
              description: 'User not found',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      {
                        $ref: '#/components/schemas/ErrorResponse'
                      },
                      {
                        type: 'object',
                        properties: {
                          type: {
                            type: 'string',
                            example: 'USER_NOT_FOUND'
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      {
                        $ref: '#/components/schemas/ErrorResponse'
                      },
                      {
                        type: 'object',
                        properties: {
                          type: {
                            type: 'string',
                            example: 'INTERNAL_ERROR'
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      '/schools': {
        get: {
          summary: 'Get list of schools',
          description: 'Retrieve a simple list of all schools with only their names',
          tags: ['Schools'],
          responses: {
            '200': {
              description: 'Schools retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/SimpleSchoolListResponse'
                  }
                }
              }
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      {
                        $ref: '#/components/schemas/ErrorResponse'
                      },
                      {
                        type: 'object',
                        properties: {
                          type: {
                            type: 'string',
                            example: 'INTERNAL_ERROR'
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      '/news': {
        get: {
          summary: 'Get news articles',
          description: 'Retrieve a paginated list of news articles with optional filtering by category, status, author, quiz availability, and content type',
          tags: ['News'],
          parameters: [
            {
              name: 'page',
              in: 'query',
              description: 'Page number for pagination',
              required: false,
              schema: {
                type: 'integer',
                minimum: 1,
                default: 1,
                example: 1
              }
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Number of articles per page',
              required: false,
              schema: {
                type: 'integer',
                minimum: 1,
                maximum: 100,
                default: 10,
                example: 10
              }
            },
            {
              name: 'category',
              in: 'query',
              description: 'Filter by article category',
              required: false,
              schema: {
                type: 'string',
                enum: ['Education', 'Technology', 'Health', 'Science', 'Tips & Tricks', 'Research', 'Announcement', 'General News'],
                example: 'Technology'
              }
            },
            {
              name: 'status',
              in: 'query',
              description: 'Filter by article status',
              required: false,
              schema: {
                type: 'string',
                enum: ['Draft', 'Published'],
                example: 'Published'
              }
            },
            {
              name: 'author',
              in: 'query',
              description: 'Filter by author name (case-insensitive partial match)',
              required: false,
              schema: {
                type: 'string',
                example: 'Dr. Jane'
              }
            },
            {
              name: 'hasQuiz',
              in: 'query',
              description: 'Filter by quiz availability',
              required: false,
              schema: {
                type: 'string',
                enum: ['true', 'false'],
                example: 'true'
              }
            },
            {
              name: 'type',
              in: 'query',
              description: 'Filter by content type',
              required: false,
              schema: {
                type: 'string',
                enum: ['Video', 'Image', 'Text'],
                example: 'Text'
              }
            }
          ],
          responses: {
            '200': {
              description: 'News articles retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/NewsListResponse'
                  }
                }
              }
            },
            '400': {
              description: 'Bad request - Invalid query parameters',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      {
                        $ref: '#/components/schemas/ErrorResponse'
                      },
                      {
                        type: 'object',
                        properties: {
                          type: {
                            type: 'string',
                            example: 'VALIDATION_ERROR'
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '500': {
              description: 'Internal server error',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      {
                        $ref: '#/components/schemas/ErrorResponse'
                      },
                      {
                        type: 'object',
                        properties: {
                          type: {
                            type: 'string',
                            example: 'INTERNAL_ERROR'
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: [] // We're not using file-based annotations, everything is defined above
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs
};
