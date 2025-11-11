require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pinoHttp = require('pino-http');
const connectDatabase = require('./config/database');
const logger = require('./utils/logger');
const requestId = require('./middleware/requestId');

const app = express();
const PORT = process.env.PORT || 8000;

connectDatabase();

app.use(requestId);
app.use(pinoHttp({ logger }));
app.use(cors());
app.use(express.json());

app.use('/v1/orders', require('./routes/orders'));

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Orders Service',
    timestamp: new Date().toISOString()
  });
});

app.get('/status', (req, res) => {
  res.json({ status: 'Orders service is running' });
});

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
  logger.info(`Orders service running on port ${PORT}`);
});
