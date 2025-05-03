import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { ApiProperty } from '@nestjs/swagger';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @ApiProperty({ description: '用户ID' })
  _id: string;

  @ApiProperty({ description: '用户名', example: 'testuser' })
  @Prop({
    required: [true, '用户名不能为空'],
    unique: true,
    trim: true,
    minlength: [3, '用户名至少需要3个字符'],
  })
  username: string;

  @ApiProperty({ description: '密码', example: 'test123456' })
  @Prop({
    required: [true, '密码不能为空'],
    minlength: [6, '密码至少需要6个字符'],
  })
  password: string;

  @ApiProperty({ description: '昵称', example: '测试用户' })
  @Prop({
    required: [true, '昵称不能为空'],
    trim: true,
  })
  nickname: string;

  @ApiProperty({ description: '用户头像路径', example: '/uploads/images/default-avatar.png' })
  @Prop({
    default: '/uploads/images/default-avatar.png',
  })
  avatar: string;

  @ApiProperty({ description: '用户角色', enum: ['user', 'admin', 'reviewer'], example: 'user' })
  @Prop({
    type: String,
    enum: ['user', 'admin', 'reviewer'],
    default: 'user',
  })
  role: string;

  // 比较密码的方法
  async matchPassword(enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

// 添加实例方法
UserSchema.methods.matchPassword = async function(enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 保存前的中间件 - 密码加密
UserSchema.pre('save', async function (next) {
  const user = this as UserDocument;
  
  if (!user.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error);
  }
}); 