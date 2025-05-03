import { Injectable } from '@nestjs/common';
import { MinioUtil } from '../utils/minio.utils';

@Injectable()
export class UploadService {
  constructor(private readonly minioUtil: MinioUtil) {}

  /**
   * 上传文件
   * @param file 文件对象
   * @returns 上传后的文件URL
   */
  async uploadFile(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new Error('文件不能为空');
    }
    
    return await this.minioUtil.upload(file);
  }
} 