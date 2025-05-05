import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/entities/user.entity';
import { Diary } from './diary.entity';
import { ApiProperty } from '@nestjs/swagger';

export type CommentDocument = Comment & Document;

@Schema({ timestamps: true })
export class Comment {
  @ApiProperty({ description: '评论ID' })
  _id: string;

  @ApiProperty({ description: '游记ID' })
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Diary', 
    required: true 
  })
  diary: Diary;

  @ApiProperty({ description: '用户ID' })
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  user: User;

  @ApiProperty({ description: '评论内容' })
  @Prop({ required: true })
  content: string;

  @ApiProperty({ description: '父评论ID', required: false })
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Comment',
    default: null
  })
  parentComment: Comment;

  @ApiProperty({ description: '点赞数' })
  @Prop({ type: Number, default: 0 })
  likeCount: number;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

// 添加索引以加速查询
CommentSchema.index({ diary: 1 });
CommentSchema.index({ user: 1 });
CommentSchema.index({ parentComment: 1 }); 