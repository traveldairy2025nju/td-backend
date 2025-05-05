import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DiariesService } from './diaries.service';
import { DiariesController } from './diaries.controller';
import { Diary, DiarySchema } from './entities/diary.entity';
import { MinioModule } from '../minio/minio.module';
import { Like, LikeSchema } from './entities/like.entity';
import { Comment, CommentSchema } from './entities/comment.entity';
import { CommentLike, CommentLikeSchema } from './entities/comment-like.entity';
import { Favorite, FavoriteSchema } from './entities/favorite.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Diary.name, schema: DiarySchema },
      { name: Like.name, schema: LikeSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: CommentLike.name, schema: CommentLikeSchema },
      { name: Favorite.name, schema: FavoriteSchema },
    ]),
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