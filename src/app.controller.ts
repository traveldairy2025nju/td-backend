import { Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './users/entities/user.entity';
import * as bcrypt from 'bcryptjs';

@ApiTags('基础接口')
@Controller()
export class AppController {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  @Get()
  @ApiOperation({ summary: '根路径测试接口' })
  @ApiResponse({ status: 200, description: '返回 Hello World!' })
  getHello(): string {
    return 'Hello World!';
  }

  @Get('ping')
  @ApiOperation({ summary: '健康检查接口' })
  @ApiResponse({ status: 200, description: '返回 pong' })
  ping(): string {
    return 'pong';
  }
  
  @Post('init-test-user')
  @ApiOperation({ 
    summary: '创建测试用户', 
    description: '创建一个用于测试的用户账号。用户名：test，密码：test123456'
  })
  @ApiResponse({ status: 201, description: '创建测试用户成功' })
  async createTestUser() {
    try {
      // 先检查测试用户是否已存在
      const existingUser = await this.userModel.findOne({ username: 'test' }).exec();
      
      if (existingUser) {
        return {
          success: true,
          message: '测试用户已存在',
          user: {
            username: existingUser.username,
            nickname: existingUser.nickname,
            _id: existingUser._id
          },
          // 添加测试账号凭据信息
          testCredentials: {
            username: 'test',
            password: 'test123456'
          }
        };
      }
      
      // 创建测试用户 - 使用create方法而不是直接创建实例
      // 这样会触发pre-save钩子自动加密密码
      const newUser = await this.userModel.create({
        username: 'test',
        password: 'test123456',  // 明文密码，会通过pre-save钩子加密
        nickname: '测试用户',
        avatar: '/uploads/images/default-avatar.png',
        role: 'user'
      });
      
      return {
        success: true,
        message: '测试用户创建成功',
        user: {
          username: newUser.username,
          nickname: newUser.nickname,
          _id: newUser._id
        },
        // 添加测试账号凭据信息
        testCredentials: {
          username: 'test',
          password: 'test123456'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `创建测试用户失败: ${error.message}`
      };
    }
  }
} 