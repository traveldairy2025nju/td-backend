import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/td-app',
  jwtSecret: process.env.JWT_SECRET || 'td-nest-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
})); 