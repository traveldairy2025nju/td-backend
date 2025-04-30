const jwt = require('jsonwebtoken');
const config = require('../config/config');

// 生成 JWT
const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
};

// 验证 JWT
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    return { valid: true, expired: false, id: decoded.id };
  } catch (error) {
    return {
      valid: false,
      expired: error.name === 'TokenExpiredError',
      id: null
    };
  }
};

module.exports = {
  generateToken,
  verifyToken
}; 