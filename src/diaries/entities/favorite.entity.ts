import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/entities/user.entity';
import { Diary } from './diary.entity';
import { ApiProperty } from '@nestjs/swagger';

export type FavoriteDocument = Favorite & Document;

@Schema({ timestamps: true })
export class Favorite {
  @ApiProperty({ description: '收藏ID' })
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

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);

// 创建复合索引确保用户对同一游记只能收藏一次
FavoriteSchema.index({ diary: 1, user: 1 }, { unique: true }); 