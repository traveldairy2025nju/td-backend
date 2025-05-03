import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DiariesService } from './diaries.service';
import { DiariesController } from './diaries.controller';
import { Diary, DiarySchema } from './entities/diary.entity';
import { MinioModule } from '../minio/minio.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Diary.name, schema: DiarySchema }]),
    MulterModule.register({
      storage: memoryStorage(),
    }),
    MinioModule,
  ],
  controllers: [DiariesController],
  providers: [DiariesService],
  exports: [DiariesService],
})
export class DiariesModule {} 