import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/entities/user.entity';
import { Comment } from './comment.entity';
import { ApiProperty } from '@nestjs/swagger';

export type CommentLikeDocument = CommentLike & Document;

@Schema({ timestamps: true })
export class CommentLike {
  @ApiProperty({ description: '评论点赞ID' })
  _id: string;

  @ApiProperty({ description: '评论ID' })
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Comment', 
    required: true 
  })
  comment: Comment;

  @ApiProperty({ description: '用户ID' })
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  user: User;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export const CommentLikeSchema = SchemaFactory.createForClass(CommentLike);

// 创建复合索引确保用户对同一评论只能点赞一次
CommentLikeSchema.index({ comment: 1, user: 1 }, { unique: true }); 