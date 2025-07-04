const { createLogger, transports, format } = require('winston');
require('winston-daily-rotate-file');
require('./envConfig').config();
const path = require('path');

const logDir = path.join(__dirname, `../appLogs/`);

console.log('logdir::', logDir);
exports.logger = createLogger({
  level: 'info',
  format: format.combine(format.errors({ stack: true }), format.timestamp(), format.json({ space: '', replacer: null })),
  transports: [
    new transports.DailyRotateFile({
      filename: path.join(logDir, 'auth-api-error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      level: 'error',
    }),
    new transports.DailyRotateFile({
      filename: path.join(logDir, 'auth-api-combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
    }),
    new transports.Console(),
  ],
});
