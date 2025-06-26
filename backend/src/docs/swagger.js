const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Igreja Membros API',
            version: '1.0.0',
            description: 'API para sistema de gerenciamento de membros e escalas da igreja',
            contact: {
                name: 'Suporte',
                email: 'suporte@igreja.com'
            }
        },
        servers: [
            {
                url: process.env.API_URL || 'http://localhost:5000',
                description: 'Servidor de desenvolvimento'
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
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        phone: { type: 'string' },
                        role: { type: 'string', enum: ['ADMIN', 'MEMBER'] },
                        status: { type: 'string', enum: ['PENDING', 'ACTIVE', 'INACTIVE', 'REJECTED'] },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                Schedule: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                        date: { type: 'string', format: 'date' },
                        time: { type: 'string' },
                        location: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        members: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/User' }
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        details: {
                            type: 'array',
                            items: { type: 'string' }
                        }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./src/routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;