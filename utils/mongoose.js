const mongoose = require('mongoose');
const { logger } = require('./logger');
const { logExecutionTime } = require('mongoose-execution-time');

// Enhanced mongoose plugin configuration with performance monitoring
mongoose.plugin(logExecutionTime, {
  loggerFunction: (operation, collectionName, executionTimeMS, filter, update, additionalLogProperties, aggregationPipeline) => {
    // Log slow queries for performance monitoring
    if (executionTimeMS > 1000) {
      logger.warn(`SLOW QUERY: ${operation} | ${collectionName} | ${executionTimeMS} MS`, {
        filter,
        update,
        additionalLogProperties,
        aggregationPipeline,
      });
    } else {
      logger.info(` ${operation} | ${collectionName} | ${executionTimeMS} MS`, {
        filter,
        update,
        additionalLogProperties,
        aggregationPipeline,
      });
    }
  },
});

let count = 0;

// Enhanced MongoDB connection options for production
const options = {
  autoIndex: process.env.NODE_ENV !== 'production', // Disable in production for better performance
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
  bufferMaxEntries: 0, // Disable mongoose buffering
  bufferCommands: false, // Disable mongoose buffering
  heartbeatFrequencyMS: 30000, // Send a ping every 30 seconds to keep the connection alive
  connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
};

const connectWithRetry = (dbUrl = process.env.ATLAS_DNS) => {
  try {
    logger.info('Connecting... to MongoDB connection with retry');
    logger.info(`Database URL: ${dbUrl ? 'URL provided' : 'No URL provided'}`);
    
    return mongoose
      .connect(dbUrl, options)
      .then(() => {
        logger.info('✓ MongoDB is connected successfully');
        
        // Set up connection event listeners for monitoring
        mongoose.connection.on('connected', () => {
          logger.info('Mongoose connected to MongoDB');
        });
        
        mongoose.connection.on('error', (err) => {
          logger.error('Mongoose connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
          logger.warn('Mongoose disconnected from MongoDB');
        });
        
        // Graceful connection close
        process.on('SIGINT', async () => {
          try {
            await mongoose.connection.close();
            logger.info('Mongoose connection closed due to app termination');
            process.exit(0);
          } catch (err) {
            logger.error('Error closing mongoose connection:', err);
            process.exit(1);
          }
        });
        
        return mongoose.connection;
      })
      .catch((err) => {
        count++;
        logger.error(
          `MongoDB connection unsuccessful, retry attempt ${count} after 5 seconds.`
        );
        logger.error('Connection error details:', err.message);
        
        // Implement exponential backoff for retries
        const retryDelay = Math.min(5000 * Math.pow(2, count - 1), 30000); // Max 30 seconds
        
        if (count < 5) { // Max 5 retry attempts
          logger.info(`Retrying MongoDB connection in ${retryDelay}ms...`);
          setTimeout(() => connectWithRetry(dbUrl), retryDelay);
        } else {
          logger.error('Maximum retry attempts reached. Exiting application.');
          process.exit(1);
        }
      });
  } catch (error) {
    logger.error('Error in connectWithRetry function:', error);
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

// Database health check function
const checkDatabaseHealth = async () => {
  try {
    const admin = mongoose.connection.db.admin();
    const result = await admin.ping();
    return { status: 'healthy', ping: result };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return { status: 'unhealthy', error: error.message };
  }
};

// Get database statistics for monitoring
const getDatabaseStats = async () => {
  try {
    const stats = await mongoose.connection.db.stats();
    return {
      collections: stats.collections,
      dataSize: stats.dataSize,
      indexSize: stats.indexSize,
      storageSize: stats.storageSize
    };
  } catch (error) {
    logger.error('Failed to get database stats:', error);
    return { error: error.message };
  }
};

module.exports = {
  connectWithRetry,
  checkDatabaseHealth,
  getDatabaseStats,
};
