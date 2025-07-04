const { logger } = require('../utils/logger');

exports.expressErrorHandler = (errorArr, customFlag = null) => {
  logger.info('commonHelper@expressErrorHandler');
  if (customFlag) {
    return { ...errorArr[0], customFlag: customFlag };
  }
  return errorArr;
};

