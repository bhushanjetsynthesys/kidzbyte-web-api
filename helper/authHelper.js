const algorithm = 'aes-256-GCM';
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET ? process.env.JWT_SECRET : 'test';
// Key length is dependent on the algorithm. In this case for aes256, it is
// 32 bytes (256 bits).
const key = crypto.scryptSync(secret, 'salt', 32);
const iv = Buffer.alloc(16, 0); // Initialization crypto vector
const { logger } = require('../utils/logger');
const { utilityConstants } = require('../constants/constants');

/**
 * Encrypts text
 * @param {string} text - text to encrypt
 */
exports.encrypt = (text = '') => {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  const payload = encrypted + authTag;
  const payload64 = Buffer.from(payload, 'hex').toString('base64');
  return payload64;
};

/**
* Decrypts text
* @param {string} text - text to decrypt
*/
exports.decrypt = (text = '') => {
  try {
    const receivedPayload = Buffer.from(text, 'base64').toString('hex');
    const receivedEncrypted = receivedPayload.substr(0, receivedPayload.length - 32);
    const receivedAuthTag = receivedPayload.substr(receivedPayload.length - 32, 32);
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(Buffer.from(receivedAuthTag, 'hex'));
    let decrypted = decipher.update(receivedEncrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return err;
  }
};

/**
 * Verify jwt token
 * @param {Request} req
 * @returns
 */
exports.verifyJwt = (req) => jwt.verify(
  this.decrypt(req.get('authorization')),
  process.env.JWT_SECRET,
  (err, decoded) => {
    if (err) {
      return false;
    }
    return decoded;
  },
);

/**
 * create hashpassword
 * @param {Request} req
 * @returns
 */
exports.hashPassword = async (password) => {
  return new Promise((resolve, reject) => {
    try {
      if (typeof password !== 'string') {
        throw new TypeError('Password must be a string');
      }
      const hash = crypto.createHash('sha256');
      hash.update(password);
      resolve(hash.digest('hex'));
    } catch (error) {
      reject(error);
    }
  });
}

exports.comparePassword = async (password, hashedPassword) => {
  return new Promise((resolve, reject) => {
    try {
      if (typeof password !== 'string') {
        throw new TypeError('Password must be a string');
      }
      const hash = crypto.createHash('sha256');
      hash.update(password);
      resolve(hashedPassword === hash.digest('hex'));
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate JWT token for user session
 * @param {Object} payload - User data to encode in token
 * @param {string} expiresIn - Token expiration time
 * @returns {string} JWT token
 */
exports.generateJwtToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Generate 6-digit OTP
 * @returns {string} OTP
 */
exports.generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Generate random session token
 * @returns {string} session token
 */
exports.generateSessionToken = () => {
  return crypto.randomBytes(32).toString('hex');
};