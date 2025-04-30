const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const config = require('./config/config');
const connectDB = require('./config/db');

// 初始化 Express 应用
const app = express();

// 连接到数据库
connectDB();

// 中间件
app.use(helmet()); // 增强安全性
app.use(cors()); // 允许跨域请求
app.use(morgan('dev')); // 请求日志
app.use(express.json()); // 解析 JSON 请求体
app.use(express.urlencoded({ extended: false })); // 解析 URL 编码的请求体

// 静态文件
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../public')));

// Swagger文档
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 提供swagger.json端点
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// 路由导入
const userRoutes = require('./routes/userRoutes');
const travelDiaryRoutes = require('./routes/travelDiaryRoutes');
const adminRoutes = require('./routes/adminRoutes');

// 路由使用
app.use('/api/users', userRoutes);
app.use('/api/diaries', travelDiaryRoutes);
app.use('/api/admin', adminRoutes);

// 根路由
app.get('/', (req, res) => {
  res.json({ message: '旅游日记平台 API 服务运行中' });
});

// 错误处理中间件
app.use((req, res, next) => {
  const error = new Error('接口不存在');
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message
    }
  });
});

// 启动服务器
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`API文档地址: http://localhost:${PORT}/api-docs`);
});

module.exports = app; 