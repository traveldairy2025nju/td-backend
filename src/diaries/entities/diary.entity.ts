import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export type DiaryDocument = Diary & Document;

export enum DiaryStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class Diary {
  @ApiProperty({ description: '游记ID' })
  _id: string;

  @ApiProperty({ description: '游记标题' })
  @Prop({ required: true })
  title: string;

  @ApiProperty({ description: '游记内容' })
  @Prop({ required: true })
  content: string;

  @ApiProperty({ description: '游记图片', type: [String] })
  @Prop({ type: [String], default: [] })
  images: string[];

  @ApiProperty({ description: '视频链接', required: false })
  @Prop({ type: String, default: null })
  video: string;

  @ApiProperty({ description: '作者ID' })
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  author: User;

  @ApiProperty({ description: '状态', enum: DiaryStatus })
  @Prop({
    type: String,
    enum: Object.values(DiaryStatus),
    default: DiaryStatus.PENDING,
  })
  status: DiaryStatus;

  @ApiProperty({ description: '拒绝原因', required: false })
  @Prop({ type: String, default: null })
  rejectReason: string;

  @ApiProperty({ description: '审核通过时间', required: false })
  @Prop({ type: Date, default: null })
  approvedAt: Date;

  @ApiProperty({ description: '审核人ID', required: false })
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  })
  reviewedBy: User;

  @ApiProperty({ description: '点赞数' })
  @Prop({ type: Number, default: 0 })
  likeCount: number;

  @ApiProperty({ description: '评论数' })
  @Prop({ type: Number, default: 0 })
  commentCount: number;

  @ApiProperty({ description: '收藏数' })
  @Prop({ type: Number, default: 0 })
  favoriteCount: number;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export const DiarySchema = SchemaFactory.createForClass(Diary);

// 添加文本索引支持搜索
DiarySchema.index({ title: 'text', content: 'text' }); 