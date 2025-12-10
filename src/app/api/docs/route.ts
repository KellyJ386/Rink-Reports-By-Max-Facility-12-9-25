import { NextResponse } from 'next/server';

/**
 * OpenAPI/Swagger specification for MFO API
 */
const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Max Facility Operations (MFO) API',
    description: 'API for ice rink facility management - handles ice resurfacing, refrigeration, incidents, scheduling, forms, and more.',
    version: '1.0.0',
    contact: {
      name: 'MFO Support',
      email: 'support@mfo.dev',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'Production API',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Ice Resurfacing', description: 'Ice depth readings and analysis' },
    { name: 'Refrigeration', description: 'Refrigeration system monitoring' },
    { name: 'Air Quality', description: 'Air quality monitoring' },
    { name: 'Incidents', description: 'Incident reporting and management' },
    { name: 'Schedules', description: 'Employee scheduling' },
    { name: 'Equipment', description: 'Equipment management' },
    { name: 'Forms', description: 'Dynamic forms and submissions' },
    { name: 'Alerts', description: 'Alert management' },
    { name: 'Reports', description: 'Report generation' },
    { name: 'Users', description: 'User management' },
    { name: 'Search', description: 'Global search' },
    { name: 'Dashboard', description: 'Dashboard statistics' },
  ],
  paths: {
    '/auth/signin': {
      post: {
        tags: ['Auth'],
        summary: 'Sign in',
        description: 'Authenticate user and create session',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Successfully authenticated' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/ice-depth': {
      get: {
        tags: ['Ice Resurfacing'],
        summary: 'Get ice depth readings',
        description: 'Retrieve ice depth readings with optional filtering',
        parameters: [
          { name: 'rinkId', in: 'query', schema: { type: 'string' } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: {
          200: {
            description: 'List of ice depth readings',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/IceDepthReading' } },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Ice Resurfacing'],
        summary: 'Create ice depth reading',
        description: 'Record a new ice depth reading with measurement points',
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateIceDepthReading' },
            },
          },
        },
        responses: {
          201: { description: 'Reading created successfully' },
          400: { description: 'Invalid input' },
        },
      },
    },
    '/ice-depth/analysis': {
      get: {
        tags: ['Ice Resurfacing'],
        summary: 'Get ice depth analysis',
        description: 'Get statistical analysis including trends, SPC data, and comparisons',
        parameters: [
          { name: 'rinkId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'days', in: 'query', schema: { type: 'integer', default: 30 } },
        ],
        responses: {
          200: {
            description: 'Ice depth analysis data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/IceDepthAnalysis' },
              },
            },
          },
        },
      },
    },
    '/refrigeration': {
      get: {
        tags: ['Refrigeration'],
        summary: 'Get refrigeration logs',
        parameters: [
          { name: 'rinkId', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 100 } },
        ],
        responses: {
          200: { description: 'List of refrigeration logs' },
        },
      },
      post: {
        tags: ['Refrigeration'],
        summary: 'Create refrigeration log',
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateRefrigerationLog' },
            },
          },
        },
        responses: {
          201: { description: 'Log created successfully' },
        },
      },
    },
    '/incidents': {
      get: {
        tags: ['Incidents'],
        summary: 'Get incidents',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] } },
          { name: 'severity', in: 'query', schema: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] } },
          { name: 'type', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          200: {
            description: 'List of incidents',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Incident' } },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Incidents'],
        summary: 'Create incident',
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateIncident' },
            },
          },
        },
        responses: {
          201: { description: 'Incident created' },
        },
      },
    },
    '/incidents/{id}': {
      get: {
        tags: ['Incidents'],
        summary: 'Get incident by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Incident details' },
          404: { description: 'Incident not found' },
        },
      },
      put: {
        tags: ['Incidents'],
        summary: 'Update incident',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateIncident' },
            },
          },
        },
        responses: {
          200: { description: 'Incident updated' },
        },
      },
    },
    '/schedules': {
      get: {
        tags: ['Schedules'],
        summary: 'Get schedules',
        responses: {
          200: { description: 'List of schedules' },
        },
      },
      post: {
        tags: ['Schedules'],
        summary: 'Create schedule',
        responses: {
          201: { description: 'Schedule created' },
        },
      },
    },
    '/schedules/shifts': {
      get: {
        tags: ['Schedules'],
        summary: 'Get shifts',
        parameters: [
          { name: 'scheduleId', in: 'query', schema: { type: 'string' } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          200: { description: 'List of shifts' },
        },
      },
      post: {
        tags: ['Schedules'],
        summary: 'Create shift',
        responses: {
          201: { description: 'Shift created' },
        },
      },
    },
    '/equipment': {
      get: {
        tags: ['Equipment'],
        summary: 'Get equipment list',
        responses: {
          200: { description: 'List of equipment' },
        },
      },
      post: {
        tags: ['Equipment'],
        summary: 'Create equipment',
        responses: {
          201: { description: 'Equipment created' },
        },
      },
    },
    '/forms': {
      get: {
        tags: ['Forms'],
        summary: 'Get form templates',
        responses: {
          200: { description: 'List of form templates' },
        },
      },
    },
    '/forms/{formId}/submissions': {
      get: {
        tags: ['Forms'],
        summary: 'Get form submissions',
        parameters: [{ name: 'formId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'List of submissions' },
        },
      },
      post: {
        tags: ['Forms'],
        summary: 'Submit form',
        parameters: [{ name: 'formId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Submission created' },
        },
      },
    },
    '/alerts': {
      get: {
        tags: ['Alerts'],
        summary: 'Get alerts',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'] } },
          { name: 'priority', in: 'query', schema: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] } },
        ],
        responses: {
          200: { description: 'List of alerts' },
        },
      },
    },
    '/alerts/{id}/acknowledge': {
      post: {
        tags: ['Alerts'],
        summary: 'Acknowledge alert',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Alert acknowledged' },
        },
      },
    },
    '/search': {
      get: {
        tags: ['Search'],
        summary: 'Global search',
        description: 'Search across incidents, equipment, users, forms, and rinks',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string', minLength: 2 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: {
            description: 'Search results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/SearchResult' },
                    },
                    totalResults: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/dashboard/stats': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get dashboard statistics',
        responses: {
          200: { description: 'Dashboard statistics' },
        },
      },
    },
    '/reports/generate': {
      post: {
        tags: ['Reports'],
        summary: 'Generate report',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['ICE_DEPTH', 'INCIDENT', 'REFRIGERATION', 'DAILY_OPS', 'EQUIPMENT'] },
                  startDate: { type: 'string', format: 'date' },
                  endDate: { type: 'string', format: 'date' },
                  rinkId: { type: 'string' },
                },
                required: ['type'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Generated report HTML' },
        },
      },
    },
  },
  components: {
    schemas: {
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          totalCount: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      IceDepthReading: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          rinkId: { type: 'string' },
          readingDate: { type: 'string', format: 'date-time' },
          averageDepth: { type: 'number' },
          minDepth: { type: 'number' },
          maxDepth: { type: 'number' },
          surfaceTemp: { type: 'number' },
          quality: { type: 'string', enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'] },
          points: { type: 'array', items: { $ref: '#/components/schemas/ReadingPoint' } },
        },
      },
      ReadingPoint: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          xPosition: { type: 'number' },
          yPosition: { type: 'number' },
          depth: { type: 'number' },
          label: { type: 'string' },
        },
      },
      CreateIceDepthReading: {
        type: 'object',
        properties: {
          rinkId: { type: 'string' },
          surfaceTemp: { type: 'number' },
          ambientTemp: { type: 'number' },
          humidity: { type: 'number' },
          notes: { type: 'string' },
          points: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                depth: { type: 'number' },
                label: { type: 'string' },
              },
            },
          },
        },
        required: ['rinkId', 'points'],
      },
      IceDepthAnalysis: {
        type: 'object',
        properties: {
          summary: {
            type: 'object',
            properties: {
              averageDepth: { type: 'number' },
              minDepth: { type: 'number' },
              maxDepth: { type: 'number' },
              stdDev: { type: 'number' },
              totalReadings: { type: 'integer' },
            },
          },
          trend: { type: 'string', enum: ['INCREASING', 'DECREASING', 'STABLE'] },
          spcData: { type: 'object' },
          weekComparison: { type: 'object' },
        },
      },
      CreateRefrigerationLog: {
        type: 'object',
        properties: {
          rinkId: { type: 'string' },
          compressorStatus: { type: 'string' },
          suctionPressure: { type: 'number' },
          dischargePressure: { type: 'number' },
          brineSupplyTemp: { type: 'number' },
          brineReturnTemp: { type: 'number' },
          condenserTemp: { type: 'number' },
          oilLevel: { type: 'string' },
          refrigerantLevel: { type: 'string' },
          notes: { type: 'string' },
        },
        required: ['rinkId'],
      },
      Incident: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          reportNumber: { type: 'string' },
          type: { type: 'string' },
          severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] },
          title: { type: 'string' },
          description: { type: 'string' },
          location: { type: 'string' },
          occurredAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateIncident: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          title: { type: 'string' },
          description: { type: 'string' },
          location: { type: 'string' },
          occurredAt: { type: 'string', format: 'date-time' },
        },
        required: ['type', 'severity', 'title'],
      },
      UpdateIncident: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] },
          severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          assignedToId: { type: 'string' },
          resolution: { type: 'string' },
        },
      },
      SearchResult: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['incident', 'equipment', 'user', 'form', 'rink'] },
          title: { type: 'string' },
          subtitle: { type: 'string' },
          url: { type: 'string' },
        },
      },
    },
    securitySchemes: {
      sessionAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'next-auth.session-token',
        description: 'NextAuth session cookie',
      },
    },
  },
  security: [{ sessionAuth: [] }],
};

export async function GET() {
  return NextResponse.json(openApiSpec);
}
