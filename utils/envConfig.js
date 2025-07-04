const path = require('path');

exports.config = () => {
  const environment = process.env.APP_ENV ? process.env.APP_ENV : 'dev';
  const envPath = path.join(`${__dirname}/../env/.env-${environment}`);
  require('dotenv').config({ path: envPath });
  console.log(`APP_ENV : ${process.env.APP_ENV} | path : ${envPath}`);
  return environment;
};
