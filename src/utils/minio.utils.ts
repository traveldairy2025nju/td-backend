import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class MinioUtil {
  private readonly minioClient: Minio.Client;
  private readonly logger = new Logger(MinioUtil.name);
  private readonly bucketName: string;
  private readonly endpoint: string;
  private readonly accessKey: string;
  private readonly secretKey: string;

  constructor(private configService: ConfigService) {
    const minioConfig = this.configService.get('minio');
    
    this.endpoint = minioConfig.endpoint;
    this.bucketName = minioConfig.bucketName;
    this.accessKey = minioConfig.accessKey;
    this.secretKey = minioConfig.secretKey;
    
    // 从URL中提取主机名，不包含协议前缀
    const endpointUrl = new URL(minioConfig.endpoint);
    
    this.minioClient = new Minio.Client({
      endPoint: endpointUrl.hostname,
      port: minioConfig.port,
      useSSL: minioConfig.useSSL,
      accessKey: minioConfig.accessKey,
      secretKey: minioConfig.secretKey,
    });
  }

  /**
   * 上传文件到Minio
   * @param file Multer文件对象
   * @returns 文件URL
   */
  async upload(file: Express.Multer.File): Promise<string> {
    if (!file) {
      return null;
    }

    try {
      const extname = path.extname(file.originalname);
      const objectName = `${uuidv4()}${extname}`;
      
      await this.minioClient.putObject(
        this.bucketName,
        objectName,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
        }
      );

      this.logger.log(`文件 ${objectName} 上传成功`);
      return `${this.endpoint}/${this.bucketName}/${objectName}`;
    } catch (error) {
      this.logger.error(`文件上传失败: ${error.message}`);
      throw new Error('文件上传失败');
    }
  }
} 