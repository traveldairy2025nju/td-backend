import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/entities/user.entity';
import { Diary } from './diary.entity';
import { ApiProperty } from '@nestjs/swagger';

export type LikeDocument = Like & Document;

@Schema({ timestamps: true })
export class Like {
  @ApiProperty({ description: '点赞ID' })
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

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export const LikeSchema = SchemaFactory.createForClass(Like);

// 创建复合索引确保用户对同一游记只能点赞一次
LikeSchema.index({ diary: 1, user: 1 }, { unique: true }); 