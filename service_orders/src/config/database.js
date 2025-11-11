const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error({ err: error }, 'MongoDB connection error');
    process.exit(1);
  }
};

module.exports = connectDatabase;
