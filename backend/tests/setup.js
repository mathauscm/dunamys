// Setup global para testes
process.env.NODE_ENV = 'test';

// Mock do Redis para testes
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    on: jest.fn()
  }))
}));

// Mock do Bull para testes
jest.mock('bull', () => {
  return jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    process: jest.fn(),
    on: jest.fn()
  }));
});

// Mock do Winston para testes
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    add: jest.fn()
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    colorize: jest.fn(),
    simple: jest.fn()
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn()
  }
}));

// Configuração global de timeout
jest.setTimeout(10000);