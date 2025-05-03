import { registerAs } from '@nestjs/config';

export default registerAs('minio', () => ({
  endpoint: process.env.MINIO_ENDPOINT || 'http://172.29.4.76:9000',
  port: parseInt(process.env.MINIO_PORT, 10) || 9000,
  accessKey: process.env.MINIO_ACCESS_KEY || 'oczHlzwcCdhYgLiEJzXD',
  secretKey: process.env.MINIO_SECRET_KEY || 'pppwxAoCI1SX1GNlUGOPalWNrwfCcb0kqpzzBMFM',
  bucketName: process.env.MINIO_BUCKET || 'travel-diary',
  useSSL: process.env.MINIO_USE_SSL === 'true' || false,
})); 