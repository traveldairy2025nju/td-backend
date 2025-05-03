import { Module } from '@nestjs/common';
import { MinioUtil } from '../utils/minio.utils';

@Module({
  providers: [MinioUtil],
  exports: [MinioUtil],
})
export class MinioModule {} 