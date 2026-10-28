import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'OrientCompanion API',
      version: '1.0.0',
      description: 'Moroccan Academic and Career Orientation Platform - Express.js REST API',
      contact: {
        name: 'OrientCompanion Support',
        email: 'support@orientcompanion.ma'
      }
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1 Server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Provide your JWT access token in the format: Bearer <token>'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  data: { type: 'null', example: null },
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'string', example: 'UNAUTHORIZED' },
                      message: { type: 'string', example: 'Authentication required' },
                      details: { type: 'null', example: null }
                    }
                  }
                }
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions or premium required',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  data: { type: 'null', example: null },
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'string', example: 'FORBIDDEN' },
                      message: { type: 'string', example: 'Insufficient permissions' },
                      details: { type: 'null', example: null }
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
  apis: [
    './src/modules/**/*.routes.js',
    './src/app.js'
  ]
};

export const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
