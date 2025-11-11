require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const axios = require('axios');
const CircuitBreaker = require('opossum');
const logger = require('./utils/logger');
const requestId = require('./middleware/requestId');
const { authenticate } = require('./middleware/auth');
const { globalLimiter, authLimiter, registerLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 8000;

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://service_users:8000';
const ORDERS_SERVICE_URL = process.env.ORDERS_SERVICE_URL || 'http://service_orders:8000';

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  credentials: true
}));

// Request tracking and logging
app.use(requestId);
app.use(pinoHttp({ logger }));
app.use(express.json());

// Global rate limiting
app.use(globalLimiter);

// Circuit breaker configuration
const circuitOptions = {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 10000
};

const createCircuitBreaker = (serviceName) => {
  const breaker = new CircuitBreaker(async (config) => {
    return await axios(config);
  }, circuitOptions);

  breaker.fallback(() => ({
    data: {
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: `${serviceName} service temporarily unavailable`
      }
    },
    status: 503
  }));

  return breaker;
};

const usersCircuit = createCircuitBreaker('Users');
const ordersCircuit = createCircuitBreaker('Orders');

// Proxy helper function
const proxyRequest = async (circuit, serviceUrl, req, res) => {
  try {
    const config = {
      method: req.method,
      url: `${serviceUrl}${req.path}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': req.id
      },
      params: req.query,
      validateStatus: () => true
    };

    if (req.user) {
      config.headers['X-User-ID'] = req.user.id;
      config.headers['X-User-Role'] = req.user.role;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      config.data = req.body;
    }

    const response = await circuit.fire(config);
    res.status(response.status).json(response.data);
  } catch (error) {
    logger.error({ err: error, requestId: req.id }, 'Proxy request error');
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Internal server error'
      }
    });
  }
};

// Auth routes with rate limiting
app.post('/v1/auth/register', registerLimiter, (req, res) => 
  proxyRequest(usersCircuit, USERS_SERVICE_URL, req, res)
);

app.post('/v1/auth/login', authLimiter, (req, res) => 
  proxyRequest(usersCircuit, USERS_SERVICE_URL, req, res)
);

// Apply authentication middleware for all routes except public ones
app.use(authenticate);

// User routes
app.all('/v1/auth/*', (req, res) => 
  proxyRequest(usersCircuit, USERS_SERVICE_URL, req, res)
);

app.all('/v1/users*', (req, res) => 
  proxyRequest(usersCircuit, USERS_SERVICE_URL, req, res)
);

// Order routes
app.all('/v1/orders*', (req, res) => 
  proxyRequest(ordersCircuit, ORDERS_SERVICE_URL, req, res)
);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'API Gateway',
    timestamp: new Date().toISOString(),
    circuits: {
      users: usersCircuit.status,
      orders: ordersCircuit.status
    }
  });
});

app.get('/status', (req, res) => {
  res.json({ status: 'API Gateway is running' });
});

// Error handling
app.use((err, req, res, next) => {
  logger.error({ err, requestId: req.id }, 'Unhandled error');
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'Internal server error'
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`API Gateway running on port ${PORT}`);

  usersCircuit.on('open', () => logger.warn('Users circuit opened'));
  usersCircuit.on('close', () => logger.info('Users circuit closed'));
  ordersCircuit.on('open', () => logger.warn('Orders circuit opened'));
  ordersCircuit.on('close', () => logger.info('Orders circuit closed'));
});
