import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

// 确保目录存在
export const ensureDir = (dirPath: string) => {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
};

// 创建文件上传配置
export const fileStorage = (destination: string) => {
  return diskStorage({
    destination: (req, file, cb) => {
      ensureDir(destination);
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      // 替换文件名中的空格为下划线
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  });
};

// 图片过滤器
export const imageFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return callback(new BadRequestException('只支持图片文件上传'), false);
  }
  callback(null, true);
};

// 视频过滤器
export const videoFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(mp4|mpeg|webm|mov)$/i)) {
    return callback(new BadRequestException('只支持视频文件上传'), false);
  }
  callback(null, true);
}; 