const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '旅游日记平台 API',
      version: '1.0.0',
      description: '旅游日记平台的后端API服务，包含用户系统和游记管理功能'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '本地开发服务器'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js'], // 指定API路由文件位置
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec; 