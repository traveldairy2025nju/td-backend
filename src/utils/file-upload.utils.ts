import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// 确保上传目录存在
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const IMAGES_DIR = path.join(UPLOADS_DIR, 'images');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// 图片文件过滤器
export const imageFileFilter = (req, file, callback) => {
  if (!file || !file.originalname) {
    // 如果没有上传文件，也允许通过
    return callback(null, true);
  }
  
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return callback(
      new BadRequestException('只允许上传jpg、jpeg、png、gif格式的图片文件!'),
      false,
    );
  }
  callback(null, true);
};

// 自定义文件名生成规则
export const editFileName = (req, file, callback) => {
  if (!file || !file.originalname) {
    // 如果没有上传文件，返回null
    return callback(null, null);
  }
  
  const fileExtName = path.extname(file.originalname);
  const randomName = uuidv4();
  callback(null, `${randomName}${fileExtName}`);
};

// 文件上传配置
export const fileUploadOptions = {
  storage: diskStorage({
    destination: IMAGES_DIR,
    filename: editFileName,
  }),
  fileFilter: imageFileFilter,
}; 