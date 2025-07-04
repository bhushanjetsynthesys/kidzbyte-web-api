require('./utils/envConfig').config();
require('dotenv').config({ path: process.env.DOTENV_CONFIG_PATH || './env/.env-dev' });

const express = require('express');
const compression = require('compression');
const cors = require('cors');
const bodyParser = require('body-parser');
const { logger } = require('./utils/logger');
const swaggerUi = require('swagger-ui-express');
const { specs } = require('./utils/swagger');
const { 
  globalErrorHandler, 
  notFoundHandler 
} = require('./middlewares/errorHandler');

const app = express();

// Disable X-Powered-By header
app.disable('x-powered-by');

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = {
      method: req.method,
      originalUrl: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration} ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    if (duration > 5000) {
      logger.warn('SLOW REQUEST:', message);
    } else {
      logger.info('REQUEST:', message);
    }
  });
  next();
});

// Connect to database and start cleanup service
if (process.env.APP_ENV !== 'test') {
  require('./utils/mongoose').connectWithRetry().then(() => {
    // Start database cleanup service after successful connection
    const { cleanupService } = require('./utils/cleanup');
    cleanupService.start();
  });
}

const port = process.env.PORT || 3000;

// Basic body parsing
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Simple CORS configuration - allow all origins
app.use(cors({
  origin: true,
  credentials: true
}));
app.disable('etag');
app.use(compression());

// Static file serving
app.use('/static', express.static(__dirname + '/public'));

// API Routes
app.use('/api', require('./routes/apiRoutes'));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const { checkDatabaseHealth } = require('./utils/mongoose');
    const dbHealth = await checkDatabaseHealth();
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbHealth.status,
      uptime: process.uptime(),
      memory: {
        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`
      }
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Swagger Documentation
app.use('/web-api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customSiteTitle: 'Web API Documentation'
}));

// Global error handling middleware (should be last)
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Start server
if (process.env.APP_ENV !== 'test') {
  const server = app.listen(port, (err) => {
    if (err) {
      logger.error('Server startup error:', err);
      process.exit(1);
    }
    logger.info(`✓ Authentication API server running on port ${port}`);
    logger.info(`✓ Environment: ${process.env.APP_ENV || 'development'}`);
    logger.info(`✓ Health check available at: http://localhost:${port}/health`);
    logger.info(`✓ API documentation available at: http://localhost:${port}/web-api-docs`);
  });

  // Basic server timeout
  server.timeout = 30000; // 30 seconds

  // Graceful shutdown handling
  const gracefulShutdown = async () => {
    logger.info('Received shutdown signal, starting graceful shutdown...');
    
    server.close(async (err) => {
      if (err) {
        logger.error('Error during server shutdown:', err);
        process.exit(1);
      }
      
      try {
        // Close database connection
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        logger.info('✓ Database connection closed');
        
        logger.info('✓ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 30000);
  };

  // Handle shutdown signals
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

// Enhanced process error handling
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise,
    reason: reason?.message || reason,
    stack: reason?.stack
  });
  
  // Don't exit in production, just log
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack
  });
  
  // Always exit on uncaught exceptions
  process.exit(1);
});

// Memory leak detection in development
if (process.env.APP_ENV === 'dev') {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const used = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    if (used > 500) { // Alert if using more than 500MB
      logger.warn(`HIGH MEMORY USAGE: ${used} MB`);
    }
  }, 60000); // Check every minute
}

module.exports = app;
