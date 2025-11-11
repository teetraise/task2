require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pinoHttp = require('pino-http');
const connectDatabase = require('./config/database');
const logger = require('./utils/logger');
const requestId = require('./middleware/requestId');

const app = express();
const PORT = process.env.PORT || 8000;

// Connect to database
connectDatabase();

// Middleware
app.use(requestId);
app.use(pinoHttp({ logger }));
app.use(cors());
app.use(express.json());

// Routes
app.use('/v1/auth', require('./routes/auth'));
app.use('/v1/users', require('./routes/users'));

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Users Service',
    timestamp: new Date().toISOString()
  });
});

app.get('/status', (req, res) => {
  res.json({ status: 'Users service is running' });
});

// Error handling middleware
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Users service running on port ${PORT}`);
});
