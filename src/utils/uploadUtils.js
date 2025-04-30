const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

// 确保上传目录存在
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// 图片存储
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/images');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`);
  }
});

// 视频存储
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/videos');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`);
  }
});

// 文件过滤器 - 仅允许特定格式
const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

// 允许的文件类型
const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/webm', 'video/quicktime'];

// 配置上传
const uploadImage = multer({
  storage: imageStorage,
  limits: {
    fileSize: config.uploadLimits.imageSize
  },
  fileFilter: fileFilter(allowedImageTypes)
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: {
    fileSize: config.uploadLimits.videoSize
  },
  fileFilter: fileFilter(allowedVideoTypes)
});

module.exports = {
  uploadImage,
  uploadVideo,
  allowedImageTypes,
  allowedVideoTypes
}; 