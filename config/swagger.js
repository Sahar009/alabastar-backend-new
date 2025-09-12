import swaggerUi from 'swagger-ui-express';

// Basic OpenAPI 3.0 specification
const specs = {
  openapi: '3.0.0',
  info: {
    title: 'AWARI Projects API',
    version: '1.0.0',
    description: 'alabastar projects Documentation',
    contact: {
      name: 'AWARI Projects Team',
      email: 'support@awariprojects.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: process.env.API_URL || 'http://localhost:8000',
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for authentication'
      }
    },
    schemas: {
      Property: {
        type: 'object',
        required: ['title', 'description', 'propertyType', 'listingType', 'price', 'address', 'city', 'state', 'country'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Property ID' },
          ownerId: { type: 'string', format: 'uuid', description: 'Property owner ID' },
          agentId: { type: 'string', format: 'uuid', description: 'Assigned agent ID' },
          title: { type: 'string', maxLength: 255, description: 'Property title' },
          slug: { type: 'string', maxLength: 300, description: 'URL-friendly property slug' },
          description: { type: 'string', description: 'Detailed property description' },
          shortDescription: { type: 'string', maxLength: 500, description: 'Brief property description' },
          propertyType: { type: 'string', enum: ['apartment', 'house', 'villa', 'condo', 'studio', 'penthouse', 'townhouse', 'duplex', 'bungalow', 'land', 'commercial', 'office', 'shop', 'warehouse'], description: 'Type of property' },
          listingType: { type: 'string', enum: ['rent', 'sale', 'shortlet'], description: 'Listing type' },
          status: { type: 'string', enum: ['draft', 'pending', 'active', 'inactive', 'sold', 'rented', 'rejected', 'archived'], description: 'Property status' },
          price: { type: 'number', format: 'decimal', description: 'Property price' },
          originalPrice: { type: 'number', format: 'decimal', description: 'Original price before discount' },
          currency: { type: 'string', maxLength: 3, default: 'NGN', description: 'Currency code' },
          pricePeriod: { type: 'string', enum: ['per_night', 'per_month', 'per_year', 'one_time'], description: 'Price period' },
          negotiable: { type: 'boolean', default: false, description: 'Whether price is negotiable' },
          address: { type: 'string', description: 'Property address' },
          city: { type: 'string', maxLength: 100, description: 'City' },
          state: { type: 'string', maxLength: 100, description: 'State' },
          country: { type: 'string', maxLength: 100, description: 'Country' },
          postalCode: { type: 'string', maxLength: 20, description: 'Postal code' },
          latitude: { type: 'number', format: 'decimal', description: 'Latitude coordinate' },
          longitude: { type: 'number', format: 'decimal', description: 'Longitude coordinate' },
          neighborhood: { type: 'string', maxLength: 100, description: 'Neighborhood' },
          landmark: { type: 'string', maxLength: 200, description: 'Nearby landmark' },
          bedrooms: { type: 'integer', minimum: 0, maximum: 50, description: 'Number of bedrooms' },
          bathrooms: { type: 'integer', minimum: 0, maximum: 20, description: 'Number of bathrooms' },
          toilets: { type: 'integer', minimum: 0, maximum: 20, description: 'Number of toilets' },
          parkingSpaces: { type: 'integer', minimum: 0, maximum: 20, description: 'Number of parking spaces' },
          floorArea: { type: 'number', format: 'decimal', description: 'Floor area in square meters' },
          landArea: { type: 'number', format: 'decimal', description: 'Land area in square meters' },
          floorNumber: { type: 'integer', minimum: 0, maximum: 200, description: 'Floor number' },
          totalFloors: { type: 'integer', minimum: 1, maximum: 200, description: 'Total floors in building' },
          yearBuilt: { type: 'integer', minimum: 1800, description: 'Year property was built' },
          conditionStatus: { type: 'string', enum: ['new', 'excellent', 'good', 'fair', 'needs_renovation'], description: 'Property condition' },
          features: { type: 'array', items: { type: 'string' }, description: 'Property features' },
          amenities: { type: 'array', items: { type: 'string' }, description: 'Property amenities' },
          petFriendly: { type: 'boolean', default: false, description: 'Whether pets are allowed' },
          smokingAllowed: { type: 'boolean', default: false, description: 'Whether smoking is allowed' },
          furnished: { type: 'boolean', default: false, description: 'Whether property is furnished' },
          availableFrom: { type: 'string', format: 'date', description: 'Available from date' },
          availableUntil: { type: 'string', format: 'date', description: 'Available until date' },
          minLeasePeriod: { type: 'integer', minimum: 1, maximum: 120, description: 'Minimum lease period in months' },
          maxLeasePeriod: { type: 'integer', minimum: 1, maximum: 120, description: 'Maximum lease period in months' },
          minStayNights: { type: 'integer', minimum: 1, maximum: 365, default: 1, description: 'Minimum stay nights for shortlet' },
          maxStayNights: { type: 'integer', minimum: 1, maximum: 365, description: 'Maximum stay nights for shortlet' },
          instantBooking: { type: 'boolean', default: false, description: 'Whether instant booking is allowed' },
          cancellationPolicy: { type: 'string', enum: ['flexible', 'moderate', 'strict', 'super_strict'], default: 'moderate', description: 'Cancellation policy' },
          featured: { type: 'boolean', default: false, description: 'Whether property is featured' },
          featuredUntil: { type: 'string', format: 'date-time', description: 'Featured until date' },
          viewCount: { type: 'integer', default: 0, description: 'Number of views' },
          favoriteCount: { type: 'integer', default: 0, description: 'Number of favorites' },
          contactCount: { type: 'integer', default: 0, description: 'Number of contacts' },
          approvedBy: { type: 'string', format: 'uuid', description: 'ID of user who approved the property' },
          approvedAt: { type: 'string', format: 'date-time', description: 'Approval date' },
          rejectionReason: { type: 'string', description: 'Reason for rejection' },
          moderationNotes: { type: 'string', description: 'Moderation notes' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Property tags' },
          seoTitle: { type: 'string', maxLength: 255, description: 'SEO title' },
          seoDescription: { type: 'string', maxLength: 500, description: 'SEO description' },
          seoKeywords: { type: 'array', items: { type: 'string' }, description: 'SEO keywords' },
          createdAt: { type: 'string', format: 'date-time', description: 'Creation date' },
          updatedAt: { type: 'string', format: 'date-time', description: 'Last update date' }
        }
      },
      PropertyMedia: {
        type: 'object',
        required: ['propertyId', 'mediaType', 'url'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Media ID' },
          propertyId: { type: 'string', format: 'uuid', description: 'Property ID' },
          mediaType: { type: 'string', enum: ['image', 'video', 'document'], default: 'image', description: 'Type of media' },
          url: { type: 'string', maxLength: 500, description: 'Media URL' },
          thumbnailUrl: { type: 'string', maxLength: 500, description: 'Thumbnail URL' },
          filename: { type: 'string', maxLength: 255, description: 'Filename' },
          originalName: { type: 'string', maxLength: 255, description: 'Original filename' },
          mimeType: { type: 'string', maxLength: 100, description: 'MIME type' },
          size: { type: 'integer', description: 'File size in bytes' },
          width: { type: 'integer', description: 'Image/video width' },
          height: { type: 'integer', description: 'Image/video height' },
          duration: { type: 'integer', description: 'Video duration in seconds' },
          order: { type: 'integer', default: 0, description: 'Display order' },
          isPrimary: { type: 'boolean', default: false, description: 'Whether this is the primary media' },
          isActive: { type: 'boolean', default: true, description: 'Whether media is active' },
          altText: { type: 'string', maxLength: 255, description: 'Alt text for accessibility' },
          caption: { type: 'string', description: 'Media caption' },
          metadata: { type: 'object', description: 'Additional metadata' },
          createdAt: { type: 'string', format: 'date-time', description: 'Creation date' },
          updatedAt: { type: 'string', format: 'date-time', description: 'Last update date' }
        }
      },
      NewsletterSubscription: {
        type: 'object',
        required: ['email'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Subscription ID' },
          email: { type: 'string', format: 'email', description: 'Subscriber email address' },
          status: { type: 'string', enum: ['subscribed', 'unsubscribed'], description: 'Subscription status' },
          unsubscribeToken: { type: 'string', description: 'Token for secure unsubscribe' },
          ipAddress: { type: 'string', description: 'IP address when subscribed' },
          createdAt: { type: 'string', format: 'date-time', description: 'Subscription date' },
          updatedAt: { type: 'string', format: 'date-time', description: 'Last update date' }
        }
      },
      Favorite: {
        type: 'object',
        required: ['userId', 'propertyId'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Favorite ID' },
          userId: { type: 'string', format: 'uuid', description: 'User ID' },
          propertyId: { type: 'string', format: 'uuid', description: 'Property ID' },
          notes: { type: 'string', maxLength: 1000, description: 'Optional notes about this favorite' },
          isActive: { type: 'boolean', default: true, description: 'Whether the favorite is active' },
          metadata: { type: 'object', description: 'Additional metadata' },
          createdAt: { type: 'string', format: 'date-time', description: 'Favorite creation date' },
          updatedAt: { type: 'string', format: 'date-time', description: 'Last update date' }
        }
      },
      FavoriteResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Favorite ID' },
          notes: { type: 'string', description: 'Notes about this favorite' },
          createdAt: { type: 'string', format: 'date-time', description: 'Favorite creation date' },
          property: { $ref: '#/components/schemas/Property' }
        }
      },
      PaginationResponse: {
        type: 'object',
        properties: {
          currentPage: { type: 'integer', description: 'Current page number' },
          totalPages: { type: 'integer', description: 'Total number of pages' },
          totalItems: { type: 'integer', description: 'Total number of items' },
          itemsPerPage: { type: 'integer', description: 'Number of items per page' },
          hasNextPage: { type: 'boolean', description: 'Whether there is a next page' },
          hasPrevPage: { type: 'boolean', description: 'Whether there is a previous page' }
        }
      }
    }
  },
  security: [
    {
      BearerAuth: []
    }
  ],
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email'
                  },
                  password: {
                    type: 'string',
                    minLength: 8
                  },
                  firstName: {
                    type: 'string',
                    minLength: 2
                  },
                  lastName: {
                    type: 'string',
                    minLength: 2
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'User registered successfully'
          }
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Authenticate user login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email'
                  },
                  password: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful'
          }
        }
      }
    },
    '/api/auth/google': {
      post: {
        tags: ['Authentication'],
        summary: 'Google Sign-In authentication using Firebase',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['idToken'],
                properties: {
                  idToken: {
                    type: 'string',
                    description: 'Firebase ID token from client-side authentication'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Google Sign-In successful'
          }
        }
      }
    },
    '/api/auth/link-google': {
      post: {
        tags: ['Authentication'],
        summary: 'Link Google account to existing user',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['idToken'],
                properties: {
                  idToken: {
                    type: 'string',
                    description: 'Google ID token'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Google account linked successfully'
          }
        }
      }
    },
    '/api/auth/unlink-google': {
      post: {
        tags: ['Authentication'],
        summary: 'Unlink Google account from user',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Google account unlinked successfully'
          }
        }
      }
    },
    '/api/auth/verify-email': {
      post: {
        tags: ['Authentication'],
        summary: 'Verify user email with verification code',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'verificationCode'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email'
                  },
                  verificationCode: {
                    type: 'string',
                    minLength: 4,
                    maxLength: 4
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Email verified successfully'
          }
        }
      }
    },
    '/api/auth/resend-verification': {
      post: {
        tags: ['Authentication'],
        summary: 'Resend verification email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Verification email sent successfully'
          }
        }
      }
    },
    '/api/auth/forgot-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Request password reset',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Password reset email sent (if account exists)'
          }
        }
      }
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Reset password with token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'resetToken', 'newPassword'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email'
                  },
                  resetToken: {
                    type: 'string',
                    minLength: 6,
                    maxLength: 6
                  },
                  newPassword: {
                    type: 'string',
                    minLength: 8
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Password reset successfully'
          }
        }
      }
    },
    '/api/auth/request-deletion': {
      post: {
        tags: ['Authentication'],
        summary: 'Request account deletion',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['password'],
                properties: {
                  password: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Deletion request sent successfully'
          }
        }
      }
    },
    '/api/auth/confirm-deletion': {
      post: {
        tags: ['Authentication'],
        summary: 'Confirm account deletion',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'deletionToken'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email'
                  },
                  deletionToken: {
                    type: 'string',
                    minLength: 6,
                    maxLength: 6
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Account deleted successfully'
          }
        }
      }
    },
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check endpoint',
        responses: {
          '200': {
            description: 'API is running'
          }
        }
      }
    },
    '/api/kyc/upload': {
      post: {
        tags: ['KYC Documents'],
        summary: 'Submit a new KYC document with file upload',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['documentType', 'document'],
                properties: {
                  documentType: {
                    type: 'string',
                    enum: ['passport', 'national_id', 'drivers_license', 'utility_bill', 'bank_statement', 'employment_letter', 'tax_document']
                  },
                  document: {
                    type: 'string',
                    format: 'binary',
                    description: 'Document file (PDF, JPG, PNG, etc.)'
                  },
                  thumbnail: {
                    type: 'string',
                    format: 'binary',
                    description: 'Optional thumbnail image'
                  },
                  documentNumber: {
                    type: 'string',
                    maxLength: 100
                  },
                  expiresAt: {
                    type: 'string',
                    format: 'date'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'KYC document submitted successfully'
          },
          '400': {
            description: 'Validation error or business logic error'
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      }
    },
    '/api/kyc': {
      post: {
        tags: ['KYC Documents'],
        summary: 'Submit a new KYC document with URL',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['documentType', 'documentUrl'],
                properties: {
                  documentType: {
                    type: 'string',
                    enum: ['passport', 'national_id', 'drivers_license', 'utility_bill', 'bank_statement', 'employment_letter', 'tax_document']
                  },
                  documentNumber: {
                    type: 'string',
                    maxLength: 100
                  },
                  documentUrl: {
                    type: 'string',
                    format: 'url'
                  },
                  documentThumbnail: {
                    type: 'string',
                    format: 'url'
                  },
                  expiresAt: {
                    type: 'string',
                    format: 'date'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'KYC document submitted successfully'
          },
          '400': {
            description: 'Validation error or business logic error'
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      },
      get: {
        tags: ['KYC Documents'],
        summary: 'Get user\'s KYC documents',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'page',
            schema: { type: 'integer', minimum: 1 },
            description: 'Page number for pagination'
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', minimum: 1, maximum: 100 },
            description: 'Number of documents per page'
          },
          {
            in: 'query',
            name: 'status',
            schema: { type: 'string', enum: ['pending', 'approved', 'rejected', 'expired'] },
            description: 'Filter by document status'
          },
          {
            in: 'query',
            name: 'documentType',
            schema: { type: 'string', enum: ['passport', 'national_id', 'drivers_license', 'utility_bill', 'bank_statement', 'employment_letter', 'tax_document'] },
            description: 'Filter by document type'
          }
        ],
        responses: {
          '200': {
            description: 'List of user\'s KYC documents'
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      }
    },
    '/api/kyc/{documentId}': {
      get: {
        tags: ['KYC Documents'],
        summary: 'Get a specific KYC document',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'documentId',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'KYC document ID'
          }
        ],
        responses: {
          '200': {
            description: 'KYC document details'
          },
          '404': {
            description: 'KYC document not found'
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      },
      put: {
        tags: ['KYC Documents'],
        summary: 'Update a KYC document',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'documentId',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'KYC document ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  documentType: {
                    type: 'string',
                    enum: ['passport', 'national_id', 'drivers_license', 'utility_bill', 'bank_statement', 'employment_letter', 'tax_document']
                  },
                  documentNumber: {
                    type: 'string',
                    maxLength: 100
                  },
                  documentUrl: {
                    type: 'string',
                    format: 'url'
                  },
                  documentThumbnail: {
                    type: 'string',
                    format: 'url'
                  },
                  expiresAt: {
                    type: 'string',
                    format: 'date'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'KYC document updated successfully'
          },
          '400': {
            description: 'Validation error or business logic error'
          },
          '404': {
            description: 'KYC document not found'
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      },
      delete: {
        tags: ['KYC Documents'],
        summary: 'Delete a KYC document',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'documentId',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'KYC document ID'
          }
        ],
        responses: {
          '200': {
            description: 'KYC document deleted successfully'
          },
          '400': {
            description: 'Business logic error (e.g., cannot delete non-pending document)'
          },
          '404': {
            description: 'KYC document not found'
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      }
    },
    '/api/kyc/admin/all': {
      get: {
        tags: ['KYC Documents - Admin'],
        summary: 'Get all KYC documents (Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'page',
            schema: { type: 'integer', minimum: 1 },
            description: 'Page number for pagination'
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', minimum: 1, maximum: 100 },
            description: 'Number of documents per page'
          },
          {
            in: 'query',
            name: 'status',
            schema: { type: 'string', enum: ['pending', 'approved', 'rejected', 'expired'] },
            description: 'Filter by document status'
          },
          {
            in: 'query',
            name: 'documentType',
            schema: { type: 'string', enum: ['passport', 'national_id', 'drivers_license', 'utility_bill', 'bank_statement', 'employment_letter', 'tax_document'] },
            description: 'Filter by document type'
          },
          {
            in: 'query',
            name: 'userId',
            schema: { type: 'string', format: 'uuid' },
            description: 'Filter by user ID'
          },
          {
            in: 'query',
            name: 'verifiedBy',
            schema: { type: 'string', format: 'uuid' },
            description: 'Filter by verifier ID'
          }
        ],
        responses: {
          '200': {
            description: 'List of all KYC documents'
          },
          '401': {
            description: 'Unauthorized'
          },
          '403': {
            description: 'Forbidden (not admin)'
          }
        }
      }
    },
    '/api/kyc/admin/{documentId}': {
      get: {
        tags: ['KYC Documents - Admin'],
        summary: 'Get a specific KYC document (Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'documentId',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'KYC document ID'
          }
        ],
        responses: {
          '200': {
            description: 'KYC document details'
          },
          '404': {
            description: 'KYC document not found'
          },
          '401': {
            description: 'Unauthorized'
          },
          '403': {
            description: 'Forbidden (not admin)'
          }
        }
      }
    },
    '/api/kyc/admin/{documentId}/verify': {
      post: {
        tags: ['KYC Documents - Admin'],
        summary: 'Verify a KYC document (Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'documentId',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'KYC document ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['approved', 'rejected']
                  },
                  verificationNotes: {
                    type: 'string',
                    minLength: 10,
                    maxLength: 1000
                  },
                  rejectionReason: {
                    type: 'string',
                    minLength: 10,
                    maxLength: 1000
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'KYC document verified successfully'
          },
          '400': {
            description: 'Validation error or business logic error'
          },
          '404': {
            description: 'KYC document not found'
          },
          '401': {
            description: 'Unauthorized'
          },
          '403': {
            description: 'Forbidden (not admin)'
          }
        }
      }
    },
    '/api/kyc/admin/statistics': {
      get: {
        tags: ['KYC Documents - Admin'],
        summary: 'Get KYC statistics (Admin only)',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'KYC statistics'
          },
          '401': {
            description: 'Unauthorized'
          },
          '403': {
            description: 'Forbidden (not admin)'
          }
        }
      }
    },
    // Property endpoints
    '/api/properties': {
      get: {
        tags: ['Properties'],
        summary: 'Get all properties with filtering and pagination',
        parameters: [
          {
            in: 'query',
            name: 'page',
            schema: { type: 'integer', minimum: 1, default: 1 },
            description: 'Page number'
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
            description: 'Number of properties per page'
          },
          {
            in: 'query',
            name: 'propertyType',
            schema: { type: 'string', enum: ['apartment', 'house', 'villa', 'condo', 'studio', 'penthouse', 'townhouse', 'duplex', 'bungalow', 'land', 'commercial', 'office', 'shop', 'warehouse'] },
            description: 'Filter by property type'
          },
          {
            in: 'query',
            name: 'listingType',
            schema: { type: 'string', enum: ['rent', 'sale', 'shortlet'] },
            description: 'Filter by listing type'
          },
          {
            in: 'query',
            name: 'status',
            schema: { type: 'string', enum: ['draft', 'pending', 'active', 'inactive', 'sold', 'rented', 'rejected', 'archived'] },
            description: 'Filter by status'
          },
          {
            in: 'query',
            name: 'city',
            schema: { type: 'string' },
            description: 'Filter by city'
          },
          {
            in: 'query',
            name: 'state',
            schema: { type: 'string' },
            description: 'Filter by state'
          },
          {
            in: 'query',
            name: 'country',
            schema: { type: 'string' },
            description: 'Filter by country'
          },
          {
            in: 'query',
            name: 'minPrice',
            schema: { type: 'number' },
            description: 'Minimum price filter'
          },
          {
            in: 'query',
            name: 'maxPrice',
            schema: { type: 'number' },
            description: 'Maximum price filter'
          },
          {
            in: 'query',
            name: 'bedrooms',
            schema: { type: 'integer' },
            description: 'Filter by number of bedrooms'
          },
          {
            in: 'query',
            name: 'bathrooms',
            schema: { type: 'integer' },
            description: 'Filter by number of bathrooms'
          },
          {
            in: 'query',
            name: 'furnished',
            schema: { type: 'boolean' },
            description: 'Filter by furnished status'
          },
          {
            in: 'query',
            name: 'petFriendly',
            schema: { type: 'boolean' },
            description: 'Filter by pet friendly status'
          },
          {
            in: 'query',
            name: 'featured',
            schema: { type: 'boolean' },
            description: 'Filter by featured status'
          },
          {
            in: 'query',
            name: 'sortBy',
            schema: { type: 'string', enum: ['createdAt', 'updatedAt', 'price', 'viewCount', 'favoriteCount', 'title'], default: 'createdAt' },
            description: 'Sort field'
          },
          {
            in: 'query',
            name: 'sortOrder',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
            description: 'Sort order'
          },
          {
            in: 'query',
            name: 'search',
            schema: { type: 'string' },
            description: 'Search query'
          }
        ],
        responses: {
          '200': {
            description: 'Properties retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        properties: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Property' }
                        },
                        pagination: {
                          type: 'object',
                          properties: {
                            total: { type: 'integer' },
                            page: { type: 'integer' },
                            limit: { type: 'integer' },
                            pages: { type: 'integer' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '500': {
            description: 'Internal server error'
          }
        }
      },
      post: {
        tags: ['Properties'],
        summary: 'Create a new property',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Property' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Property created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Property' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Validation error or bad request'
          },
          '401': {
            description: 'Unauthorized'
          },
          '500': {
            description: 'Internal server error'
          }
        }
      }
    },
    '/api/properties/upload': {
      post: {
        tags: ['Properties'],
        summary: 'Create a property with media uploads',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['title', 'description', 'propertyType', 'listingType', 'price', 'address', 'city', 'state', 'country'],
                properties: {
                  title: { type: 'string', description: 'Property title' },
                  description: { type: 'string', description: 'Property description' },
                  propertyType: { type: 'string', enum: ['apartment', 'house', 'villa', 'condo', 'studio', 'penthouse', 'townhouse', 'duplex', 'bungalow', 'land', 'commercial', 'office', 'shop', 'warehouse'], description: 'Property type' },
                  listingType: { type: 'string', enum: ['rent', 'sale', 'shortlet'], description: 'Listing type' },
                  price: { type: 'number', description: 'Property price' },
                  address: { type: 'string', description: 'Property address' },
                  city: { type: 'string', description: 'City' },
                  state: { type: 'string', description: 'State' },
                  country: { type: 'string', description: 'Country' },
                  images: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                    description: 'Property images (max 8)'
                  },
                  videos: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                    description: 'Property videos (max 2)'
                  },
                  documents: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                    description: 'Property documents (max 3)'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Property created successfully with media',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Property' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Validation error or file upload error'
          },
          '401': {
            description: 'Unauthorized'
          },
          '500': {
            description: 'Internal server error'
          }
        }
      }
    },
    '/api/properties/my-properties': {
      get: {
        tags: ['Properties'],
        summary: 'Get current user\'s properties',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'page',
            schema: { type: 'integer', minimum: 1, default: 1 },
            description: 'Page number'
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
            description: 'Number of properties per page'
          },
          {
            in: 'query',
            name: 'status',
            schema: { type: 'string', enum: ['draft', 'pending', 'active', 'inactive', 'sold', 'rented', 'rejected', 'archived'] },
            description: 'Filter by status'
          },
          {
            in: 'query',
            name: 'propertyType',
            schema: { type: 'string', enum: ['apartment', 'house', 'villa', 'condo', 'studio', 'penthouse', 'townhouse', 'duplex', 'bungalow', 'land', 'commercial', 'office', 'shop', 'warehouse'] },
            description: 'Filter by property type'
          },
          {
            in: 'query',
            name: 'listingType',
            schema: { type: 'string', enum: ['rent', 'sale', 'shortlet'] },
            description: 'Filter by listing type'
          }
        ],
        responses: {
          '200': {
            description: 'User properties retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        properties: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Property' }
                        },
                        pagination: {
                          type: 'object',
                          properties: {
                            total: { type: 'integer' },
                            page: { type: 'integer' },
                            limit: { type: 'integer' },
                            pages: { type: 'integer' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized'
          },
          '500': {
            description: 'Internal server error'
          }
        }
      }
    },
    '/api/properties/{propertyId}': {
      get: {
        tags: ['Properties'],
        summary: 'Get a specific property by ID',
        parameters: [
          {
            in: 'path',
            name: 'propertyId',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'Property ID'
          },
          {
            in: 'query',
            name: 'incrementView',
            schema: { type: 'boolean', default: false },
            description: 'Whether to increment view count'
          }
        ],
        responses: {
          '200': {
            description: 'Property retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Property' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Property not found'
          },
          '500': {
            description: 'Internal server error'
          }
        }
      },
      put: {
        tags: ['Properties'],
        summary: 'Update a property',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'propertyId',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'Property ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Property' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Property updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Property' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Validation error or bad request'
          },
          '401': {
            description: 'Unauthorized'
          },
          '404': {
            description: 'Property not found or no permission'
          },
          '500': {
            description: 'Internal server error'
          }
        }
      },
      delete: {
        tags: ['Properties'],
        summary: 'Delete a property',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'propertyId',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'Property ID'
          }
        ],
        responses: {
          '200': {
            description: 'Property deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Bad request'
          },
          '401': {
            description: 'Unauthorized'
          },
          '404': {
            description: 'Property not found or no permission'
          },
          '500': {
            description: 'Internal server error'
          }
        }
      }
    },
    '/api/properties/slug/{slug}': {
      get: {
        tags: ['Properties'],
        summary: 'Get a property by slug',
        parameters: [
          {
            in: 'path',
            name: 'slug',
            required: true,
            schema: { type: 'string' },
            description: 'Property slug'
          },
          {
            in: 'query',
            name: 'incrementView',
            schema: { type: 'boolean', default: false },
            description: 'Whether to increment view count'
          }
        ],
        responses: {
          '200': {
            description: 'Property retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Property' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'Property not found'
          },
          '500': {
            description: 'Internal server error'
          }
        }
      }
    },
    '/api/properties/{propertyId}/media': {
      post: {
        tags: ['Properties'],
        summary: 'Add media to a property',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'propertyId',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'Property ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  images: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                    description: 'Property images (max 8)'
                  },
                  videos: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                    description: 'Property videos (max 2)'
                  },
                  documents: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                    description: 'Property documents (max 3)'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Media added successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/PropertyMedia' }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Validation error or file upload error'
          },
          '401': {
            description: 'Unauthorized'
          },
          '403': {
            description: 'No permission to add media'
          },
          '500': {
            description: 'Internal server error'
          }
        }
      }
    },
    '/api/properties/{propertyId}/media/order': {
      put: {
        tags: ['Properties'],
        summary: 'Update media order for a property',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'propertyId',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'Property ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['mediaOrder'],
                properties: {
                  mediaOrder: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['mediaId', 'order', 'isPrimary'],
                      properties: {
                        mediaId: { type: 'string', format: 'uuid', description: 'Media ID' },
                        order: { type: 'integer', minimum: 0, description: 'Display order' },
                        isPrimary: { type: 'boolean', description: 'Whether this is the primary media' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Media order updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Validation error'
          },
          '401': {
            description: 'Unauthorized'
          },
          '404': {
            description: 'Property not found or no permission'
          },
          '500': {
            description: 'Internal server error'
          }
        }
      }
    },
    '/api/properties/media/{mediaId}': {
      delete: {
        tags: ['Properties'],
        summary: 'Delete property media',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'mediaId',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'Media ID'
          }
        ],
        responses: {
          '200': {
            description: 'Media deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Bad request'
          },
          '401': {
            description: 'Unauthorized'
          },
          '404': {
            description: 'Media not found or no permission'
          },
          '500': {
            description: 'Internal server error'
          }
        }
      }
    },
    // Admin Property endpoints
    '/api/properties/admin/all': {
      get: {
        tags: ['Properties - Admin'],
        summary: 'Get all properties (Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'page',
            schema: { type: 'integer', minimum: 1, default: 1 },
            description: 'Page number'
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
            description: 'Number of properties per page'
          },
          {
            in: 'query',
            name: 'ownerId',
            schema: { type: 'string', format: 'uuid' },
            description: 'Filter by owner ID'
          },
          {
            in: 'query',
            name: 'propertyType',
            schema: { type: 'string', enum: ['apartment', 'house', 'villa', 'condo', 'studio', 'penthouse', 'townhouse', 'duplex', 'bungalow', 'land', 'commercial', 'office', 'shop', 'warehouse'] },
            description: 'Filter by property type'
          },
          {
            in: 'query',
            name: 'listingType',
            schema: { type: 'string', enum: ['rent', 'sale', 'shortlet'] },
            description: 'Filter by listing type'
          },
          {
            in: 'query',
            name: 'status',
            schema: { type: 'string', enum: ['draft', 'pending', 'active', 'inactive', 'sold', 'rented', 'rejected', 'archived'] },
            description: 'Filter by status'
          },
          {
            in: 'query',
            name: 'city',
            schema: { type: 'string' },
            description: 'Filter by city'
          },
          {
            in: 'query',
            name: 'state',
            schema: { type: 'string' },
            description: 'Filter by state'
          },
          {
            in: 'query',
            name: 'country',
            schema: { type: 'string' },
            description: 'Filter by country'
          },
          {
            in: 'query',
            name: 'minPrice',
            schema: { type: 'number' },
            description: 'Minimum price filter'
          },
          {
            in: 'query',
            name: 'maxPrice',
            schema: { type: 'number' },
            description: 'Maximum price filter'
          },
          {
            in: 'query',
            name: 'bedrooms',
            schema: { type: 'integer' },
            description: 'Filter by number of bedrooms'
          },
          {
            in: 'query',
            name: 'bathrooms',
            schema: { type: 'integer' },
            description: 'Filter by number of bathrooms'
          },
          {
            in: 'query',
            name: 'furnished',
            schema: { type: 'boolean' },
            description: 'Filter by furnished status'
          },
          {
            in: 'query',
            name: 'petFriendly',
            schema: { type: 'boolean' },
            description: 'Filter by pet friendly status'
          },
          {
            in: 'query',
            name: 'featured',
            schema: { type: 'boolean' },
            description: 'Filter by featured status'
          },
          {
            in: 'query',
            name: 'sortBy',
            schema: { type: 'string', enum: ['createdAt', 'updatedAt', 'price', 'viewCount', 'favoriteCount', 'title'], default: 'createdAt' },
            description: 'Sort field'
          },
          {
            in: 'query',
            name: 'sortOrder',
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
            description: 'Sort order'
          },
          {
            in: 'query',
            name: 'search',
            schema: { type: 'string' },
            description: 'Search query'
          }
        ],
        responses: {
          '200': {
            description: 'Properties retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        properties: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Property' }
                        },
                        pagination: {
                          type: 'object',
                          properties: {
                            total: { type: 'integer' },
                            page: { type: 'integer' },
                            limit: { type: 'integer' },
                            pages: { type: 'integer' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized'
          },
          '403': {
            description: 'Forbidden - Admin access required'
          },
          '500': {
            description: 'Internal server error'
          }
        }
      }
    },
    '/api/properties/admin/{propertyId}': {
      get: {
        tags: ['Properties - Admin'],
        summary: 'Get a specific property (Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'propertyId',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'Property ID'
          }
        ],
        responses: {
          '200': {
            description: 'Property retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Property' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized'
          },
          '403': {
            description: 'Forbidden - Admin access required'
          },
          '404': {
            description: 'Property not found'
          },
          '500': {
            description: 'Internal server error'
          }
        }
      }
    },
    '/api/properties/admin/{propertyId}/moderate': {
      put: {
        tags: ['Properties - Admin'],
        summary: 'Moderate a property (approve/reject)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'propertyId',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'Property ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['active', 'rejected'],
                    description: 'Moderation status'
                  },
                  moderationNotes: {
                    type: 'string',
                    minLength: 10,
                    maxLength: 1000,
                    description: 'Moderation notes'
                  },
                  rejectionReason: {
                    type: 'string',
                    minLength: 10,
                    maxLength: 1000,
                    description: 'Rejection reason (required if status is rejected)'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Property moderated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Property' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Validation error'
          },
          '401': {
            description: 'Unauthorized'
          },
          '403': {
            description: 'Forbidden - Admin access required'
          },
          '404': {
            description: 'Property not found'
          },
          '500': {
            description: 'Internal server error'
          }
        }
      }
    },
    '/api/properties/admin/statistics': {
      get: {
        tags: ['Properties - Admin'],
        summary: 'Get property statistics (Admin only)',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Statistics retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        statusStats: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              status: { type: 'string' },
                              count: { type: 'integer' }
                            }
                          }
                        },
                        propertyTypeStats: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              propertyType: { type: 'string' },
                              count: { type: 'integer' }
                            }
                          }
                        },
                        listingTypeStats: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              listingType: { type: 'string' },
                              count: { type: 'integer' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized'
          },
          '403': {
            description: 'Forbidden - Admin access required'
          },
          '500': {
            description: 'Internal server error'
          }
        }
      }
    },
    // Newsletter endpoints
    '/api/newsletter/subscribe': {
      post: {
        tags: ['Newsletter'],
        summary: 'Subscribe to newsletter',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Successfully subscribed to newsletter'
          },
          '400': {
            description: 'Invalid email or already subscribed'
          }
        }
      }
    },
    '/api/newsletter/unsubscribe': {
      post: {
        tags: ['Newsletter'],
        summary: 'Unsubscribe from newsletter',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com'
                  },
                  token: {
                    type: 'string',
                    description: 'Optional unsubscribe token for security'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Successfully unsubscribed from newsletter'
          },
          '400': {
            description: 'Email not found or already unsubscribed'
          }
        }
      },
      get: {
        tags: ['Newsletter'],
        summary: 'Unsubscribe from newsletter via email link',
        parameters: [
          {
            in: 'query',
            name: 'email',
            required: true,
            schema: {
              type: 'string',
              format: 'email'
            },
            description: 'Email address to unsubscribe'
          },
          {
            in: 'query',
            name: 'token',
            schema: {
              type: 'string'
            },
            description: 'Unsubscribe token for security'
          }
        ],
        responses: {
          '200': {
            description: 'HTML page confirming unsubscription',
            content: {
              'text/html': {
                schema: {
                  type: 'string'
                }
              }
            }
          }
        }
      }
    },
    '/api/newsletter/status/{email}': {
      get: {
        tags: ['Newsletter'],
        summary: 'Check newsletter subscription status',
        parameters: [
          {
            in: 'path',
            name: 'email',
            required: true,
            schema: {
              type: 'string',
              format: 'email'
            },
            description: 'Email address to check'
          }
        ],
        responses: {
          '200': {
            description: 'Subscription status retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        subscribed: { type: 'boolean' },
                        subscribedAt: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/newsletter/subscribers': {
      get: {
        tags: ['Newsletter'],
        summary: 'Get newsletter subscribers (Admin only)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'page',
            schema: {
              type: 'integer',
              minimum: 1,
              default: 1
            },
            description: 'Page number'
          },
          {
            in: 'query',
            name: 'limit',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 50
            },
            description: 'Number of subscribers per page'
          }
        ],
        responses: {
          '200': {
            description: 'Subscribers retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        subscribers: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              email: { type: 'string', format: 'email' },
                              createdAt: { type: 'string', format: 'date-time' }
                            }
                          }
                        },
                        totalCount: { type: 'integer' },
                        totalPages: { type: 'integer' },
                        currentPage: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          },
          '403': {
            description: 'Admin access required'
          }
        }
      }
    },
    '/api/favorites': {
      get: {
        tags: ['Favorites'],
        summary: 'Get user\'s favorite properties',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'page',
            schema: {
              type: 'integer',
              minimum: 1,
              default: 1
            },
            description: 'Page number'
          },
          {
            in: 'query',
            name: 'limit',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 10
            },
            description: 'Number of favorites per page'
          },
          {
            in: 'query',
            name: 'propertyType',
            schema: {
              type: 'string',
              enum: ['apartment', 'house', 'villa', 'condo', 'studio', 'penthouse', 'townhouse', 'duplex', 'bungalow', 'land', 'commercial', 'office', 'shop', 'warehouse']
            },
            description: 'Filter by property type'
          },
          {
            in: 'query',
            name: 'listingType',
            schema: {
              type: 'string',
              enum: ['rent', 'sale', 'shortlet']
            },
            description: 'Filter by listing type'
          },
          {
            in: 'query',
            name: 'status',
            schema: {
              type: 'string',
              enum: ['draft', 'pending', 'active', 'inactive', 'sold', 'rented', 'rejected', 'archived']
            },
            description: 'Filter by property status'
          }
        ],
        responses: {
          '200': {
            description: 'Favorites retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        favorites: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/FavoriteResponse' }
                        },
                        pagination: { $ref: '#/components/schemas/PaginationResponse' }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      }
    },
    '/api/favorites/{propertyId}': {
      post: {
        tags: ['Favorites'],
        summary: 'Add a property to favorites',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'propertyId',
            required: true,
            schema: {
              type: 'string',
              format: 'uuid'
            },
            description: 'Property ID'
          }
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  notes: {
                    type: 'string',
                    maxLength: 1000,
                    description: 'Optional notes about this favorite'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Property added to favorites successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Favorite' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Validation error'
          },
          '401': {
            description: 'Unauthorized'
          },
          '404': {
            description: 'Property not found'
          },
          '409': {
            description: 'Property already in favorites'
          }
        }
      },
      delete: {
        tags: ['Favorites'],
        summary: 'Remove a property from favorites',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'propertyId',
            required: true,
            schema: {
              type: 'string',
              format: 'uuid'
            },
            description: 'Property ID'
          }
        ],
        responses: {
          '200': {
            description: 'Property removed from favorites successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Validation error'
          },
          '401': {
            description: 'Unauthorized'
          },
          '404': {
            description: 'Property not found in favorites'
          }
        }
      }
    },
    '/api/favorites/{propertyId}/status': {
      get: {
        tags: ['Favorites'],
        summary: 'Check if a property is favorited',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'propertyId',
            required: true,
            schema: {
              type: 'string',
              format: 'uuid'
            },
            description: 'Property ID'
          }
        ],
        responses: {
          '200': {
            description: 'Favorite status retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        isFavorited: { type: 'boolean' },
                        favoriteId: { type: 'string', format: 'uuid', nullable: true },
                        notes: { type: 'string', nullable: true }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Validation error'
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      }
    },
    '/api/favorites/{propertyId}/notes': {
      put: {
        tags: ['Favorites'],
        summary: 'Update favorite notes',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'propertyId',
            required: true,
            schema: {
              type: 'string',
              format: 'uuid'
            },
            description: 'Property ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['notes'],
                properties: {
                  notes: {
                    type: 'string',
                    maxLength: 1000,
                    description: 'Notes about this favorite'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Favorite notes updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Favorite' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Validation error'
          },
          '401': {
            description: 'Unauthorized'
          },
          '404': {
            description: 'Property not found in favorites'
          }
        }
      }
    },
    '/api/favorites/clear': {
      delete: {
        tags: ['Favorites'],
        summary: 'Clear all user\'s favorites',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'All favorites cleared successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        clearedCount: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      }
    }
  }
};

export { specs, swaggerUi };
