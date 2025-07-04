const { utilityConstants } = require('../constants/constants');
const { logger } = require('../utils/logger');
const { newsDetails } = require('../models');

exports.createNews = (data, select = utilityConstants.modelConfig.commonSkipFields) => {
  logger.info('ORM::newsDetails@createNews');
  return new Promise((resolve, reject) => {
    const newsArticle = new newsDetails(data);
    newsArticle
      .save()
      .then((response) => resolve(response.toObject()))
      .catch((err) => {
        reject(err);
      });
  });
};

exports.updateOrCreateNews = (where, data, select = utilityConstants.modelConfig.commonSkipFields) => {
  logger.info('ORM::newsDetails@updateOrCreateNews');
  return new Promise((resolve, reject) => {
    newsDetails
      .findOneAndUpdate(where, data, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      })
      .select(select)
      .exec()
      .then((response) => resolve(response.toObject()))
      .catch((err) => {
        reject(err);
      });
  });
};

exports.updateNews = (where, data, select = utilityConstants.modelConfig.commonSkipFields) => {
  logger.info('ORM::newsDetails@updateNews');
  return new Promise((resolve, reject) => {
    newsDetails
      .findOneAndUpdate(where, data, {
        new: true,
        runValidators: true,
      })
      .select(select)
      .exec()
      .then((response) => {
        if (response) {
          resolve(response.toObject());
        } else {
          resolve(null);
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
};

exports.getNews = (limit = 10, page = 1, sort = { createdAt: -1 }, query = {}, select = utilityConstants.modelConfig.commonSkipFields, isRunCount = false) => {
  logger.info('ORM::newsDetails@getNews');
  return new Promise((resolve, reject) => {
    newsDetails
      .find(query)
      .select(select)
      .sort(sort)
      .skip(limit * page - limit)
      .limit(limit)
      .lean()
      .exec()
      .then((docs) => {
        if (isRunCount) {
          newsDetails
            .countDocuments(query)
            .then((totalCount) => resolve({ docs, totalCount }))
            .catch((error) => {
              reject(error);
            });
        } else {
          return resolve({ docs });
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
};

exports.getOneNews = (where, select = utilityConstants.modelConfig.commonSkipFields) => {
  logger.info('ORM::newsDetails@getOneNews');
  return new Promise((resolve, reject) => {
    newsDetails
      .findOne(where)
      .select(select)
      .lean()
      .exec()
      .then((response) => resolve(response))
      .catch((err) => {
        reject(err);
      });
  });
};

exports.deleteOneNews = async (where) => {
  logger.info('ORM::newsDetails@deleteOneNews');
  return new Promise((resolve, reject) => {
    newsDetails
      .findOneAndUpdate(where, { $set: { isActive: false } }, { new: true })
      .exec()
      .then((response) => resolve(response ? true : false))
      .catch((err) => {
        reject(err);
      });
  });
};

exports.incrementViewCount = (where) => {
  logger.info('ORM::newsDetails@incrementViewCount');
  return new Promise((resolve, reject) => {
    newsDetails
      .findOneAndUpdate(where, { $inc: { viewCount: 1 } }, { new: true })
      .select('viewCount')
      .exec()
      .then((response) => resolve(response ? response.viewCount : 0))
      .catch((err) => {
        reject(err);
      });
  });
};

exports.getNewsCount = (query = {}) => {
  logger.info('ORM::newsDetails@getNewsCount');
  return new Promise((resolve, reject) => {
    newsDetails
      .countDocuments(query)
      .then((count) => resolve(count))
      .catch((err) => {
        reject(err);
      });
  });
};
