const swaggerUi = require('swagger-ui-express');
const express = require('express');
import type { Request, Response } from 'express';

const spec = {
  openapi: '3.0.0',
  info: {
    title: 'Suggestion API',
    version: '1.0.0',
    description: 'Basic backend API with auth',
  },
  servers: [
    { url: '/', description: 'This server (same origin)' },
    { url: 'http://localhost:3000', description: 'Local' },
  ],
  paths: {
    '/': {
      get: {
        summary: 'Welcome',
        tags: ['General'],
        responses: {
          200: {
            description: 'Welcome message',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Hello from the backend' },
                    ok: { type: 'boolean', example: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/health': {
      get: {
        summary: 'Health check',
        tags: ['General'],
        responses: {
          200: {
            description: 'Service health',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', minLength: 6, example: 'secret123' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'User registered' },
                    user: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string' },
                        email: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation error (missing/invalid email or password)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          409: {
            description: 'Email already registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Login an existing user',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', minLength: 6, example: 'secret123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'User logged in',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'User logged in' },
                    token: { type: 'string', example: 'dXNlcl9pZDoxNzA4MTY2NTAwMDAw' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid email or password',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/feedback-forms': {
      post: {
        summary: 'Create a feedback form',
        tags: ['Feedback Forms'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/FeedbackFormInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Feedback form created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Feedback form created' },
                    feedbackForm: { $ref: '#/components/schemas/FeedbackForm' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      get: {
        summary: 'List feedback forms',
        tags: ['Feedback Forms'],
        responses: {
          200: {
            description: 'List of feedback forms',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    feedbackForms: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/FeedbackForm' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/feedback-forms/{id}': {
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Feedback form id',
        },
      ],
      get: {
        summary: 'Get feedback form by id',
        tags: ['Feedback Forms'],
        responses: {
          200: {
            description: 'Feedback form',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    feedbackForm: { $ref: '#/components/schemas/FeedbackForm' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid id',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          404: {
            description: 'Feedback form not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      put: {
        summary: 'Update feedback form by id',
        tags: ['Feedback Forms'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/FeedbackFormUpdateInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'Feedback form updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Feedback form updated' },
                    feedbackForm: { $ref: '#/components/schemas/FeedbackForm' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          404: {
            description: 'Feedback form not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Delete feedback form by id',
        tags: ['Feedback Forms'],
        responses: {
          200: {
            description: 'Feedback form deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Feedback form deleted' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid id',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          404: {
            description: 'Feedback form not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/feedback-forms/{id}/qr': {
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
          description: 'Feedback form id',
        },
      ],
      post: {
        summary: 'Generate QR code for feedback form',
        tags: ['Feedback Forms'],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/FeedbackFormQrInput' },
            },
          },
        },
        responses: {
          200: {
            description: 'QR code generated for feedback form URL',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/FeedbackFormQrResponse' },
              },
            },
          },
          400: {
            description: 'Invalid id or payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          404: {
            description: 'Feedback form not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/v1/business': {
      get: {
        summary: 'List all businesses',
        tags: ['Business'],
        responses: {
          200: {
            description: 'List of businesses',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Business API v1' },
                    ok: { type: 'boolean', example: true },
                    businesses: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          owner: { type: 'string' },
                          businessname: { type: 'string' },
                          location: { type: 'string' },
                          pancardNumber: { type: 'number' },
                          description: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      FeedbackFormQrInput: {
        type: 'object',
        properties: {
          frontendBaseUrl: {
            type: 'string',
            example: 'https://frontend.example.com/forms',
            description: 'Optional frontend base URL. Form id is appended automatically.',
          },
        },
      },
      FeedbackFormQrResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Feedback form QR generated' },
          formUrl: {
            type: 'string',
            example: 'https://frontend.example.com/forms/65f1f6c5f685ecf3f71f6f0a',
          },
          qrCodeDataUrl: {
            type: 'string',
            example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
          },
        },
      },
      FeedbackFieldInput: {
        type: 'object',
        required: ['name', 'label', 'type'],
        properties: {
          name: { type: 'string', example: 'wouldRecommend' },
          label: { type: 'string', example: 'Would you recommend us?' },
          type: {
            type: 'string',
            enum: ['checkbox', 'short_text', 'long_text', 'big_text', 'image_upload'],
            example: 'checkbox',
          },
          required: { type: 'boolean', example: true },
          placeholder: { type: 'string', example: 'Write your answer here' },
        },
      },
      FeedbackFormInput: {
        type: 'object',
        required: ['title', 'fields'],
        properties: {
          title: { type: 'string', example: 'Product feedback form' },
          description: { type: 'string', example: 'Collect customer feedback after purchase' },
          fields: {
            type: 'array',
            items: { $ref: '#/components/schemas/FeedbackFieldInput' },
          },
        },
      },
      FeedbackFormUpdateInput: {
        type: 'object',
        properties: {
          title: { type: 'string', example: 'Updated feedback form title' },
          description: { type: 'string', example: 'Updated description' },
          fields: {
            type: 'array',
            items: { $ref: '#/components/schemas/FeedbackFieldInput' },
          },
        },
      },
      FeedbackForm: {
        allOf: [
          { $ref: '#/components/schemas/FeedbackFormInput' },
          {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  },
};

function setupSwagger(app:any, basePath = '/api-docs') {
  const basePathWithSlash = `${basePath}/`;
  const swaggerSetup = swaggerUi.setup(spec, {
    customCss: '.swagger-ui .topbar { display: none }',
  });
  // Serve HTML at both /api-docs and /api-docs/ (no redirect to avoid ERR_TOO_MANY_REDIRECTS)
  const serveHtml = (req:Request, res:any, next:Function) => {
    const originalSend = res.send;
    res.send = function (body:any) {
      if (typeof body === 'string' && body.includes('swagger-ui-bundle.js'))
        body = body.replace('<head>', `<head><base href="${basePathWithSlash}">`);
      return originalSend.call(this, body);
    };
    swaggerSetup(req, res, next);
  };
  app.get(`${basePath}.json`, (req:Request, res:Response) => res.json(spec));
  app.get(basePath, serveHtml);
  app.get(basePathWithSlash, serveHtml);
  app.use(basePath, swaggerUi.serve);
  return spec;
}

module.exports = { setupSwagger, spec };
