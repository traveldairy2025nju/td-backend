import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/entities/user.entity';

export type DiaryDocument = Diary & Document;

export enum DiaryStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class Diary {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: String, default: null })
  video: string;

  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  author: User;

  @Prop({
    type: String,
    enum: Object.values(DiaryStatus),
    default: DiaryStatus.PENDING,
  })
  status: DiaryStatus;

  @Prop({ type: String, default: null })
  rejectReason: string;

  @Prop({ type: Date, default: null })
  approvedAt: Date;

  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  })
  reviewedBy: User;
}

export const DiarySchema = SchemaFactory.createForClass(Diary);

// 添加文本索引支持搜索
DiarySchema.index({ title: 'text', content: 'text' }); 