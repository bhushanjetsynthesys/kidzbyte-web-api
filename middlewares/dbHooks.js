const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

exports.addPreFindHook = (model) => {
  logger.info('middleware::dbHooks@addPreFindHook');
  model.pre('countDocuments', function () {
    const query = this.getQuery();
    if (query?._id?.$in && Array.isArray(query?._id?.$in)) {
    //   console.log("🚀 ~ model.pre", this._conditions)
      const validMongoIds = query._id.$in.filter((id) => {
        try {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            new mongoose.Types.ObjectId(id);
          }
          return true;
        } catch (err) {
          return false;
        }
      });
      this._conditions._id.$in = validMongoIds;
    //   console.log("🚀 ~ model.post", this._conditions)
    } else {
      let validMongoId = query?._id?.$in;
      try {
        if (!mongoose.Types.ObjectId.isValid(validMongoId)) {
          new mongoose.Types.ObjectId(validMongoId);
          this._conditions._id.$in = validMongoId;
        }
        return true;
      } catch (err) {
        return false;
      }
    }
  });

  model.pre('find', function () {
    const query = this.getQuery();
    if (query?._id?.$in && Array.isArray(query?._id?.$in)) {
    //   console.log("🚀 ~ model.pre", this._conditions)
      const validMongoIds = query._id.$in.filter((id) => {
        try {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            new mongoose.Types.ObjectId(id);
          }
          return true;
        } catch (err) {
          return false;
        }
      });
      this._conditions._id.$in = validMongoIds;
    //   console.log("🚀 ~ model.post", this._conditions)
    } else {
      let validMongoId = query?._id?.$in;
      try {
        if (!mongoose.Types.ObjectId.isValid(validMongoId)) {
          new mongoose.Types.ObjectId(validMongoId);
          this._conditions._id.$in = validMongoId;
        }
        return true;
      } catch (err) {
        return false;
      }
    }
  });
  return this;
};
