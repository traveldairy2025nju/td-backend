require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/travel_diary',
  jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret_key',
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtExpiresIn: '7d',
  uploadLimits: {
    imageSize: 5 * 1024 * 1024, // 5MB
    videoSize: 100 * 1024 * 1024 // 100MB
  }
}; 