export default () => ({
  // 应用程序配置
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
  },
  
  // 数据库配置
  database: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/travel-diary',
  },
  
  // MinIO配置
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'http://172.29.4.76:9000',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucketName: process.env.MINIO_BUCKET || 'travel-diary',
  },
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'traveldiarysecretkey',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // 限流配置
  throttling: {
    ttl: 60, // 时间窗口，单位秒
    limit: 100, // 在时间窗口内的最大请求数
  },
}); 