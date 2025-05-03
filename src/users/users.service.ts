import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateNicknameDto } from './dto/update-nickname.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // 通过用户名查找用户
  async findByUsername(username: string): Promise<UserDocument> {
    return this.userModel.findOne({ username }).exec();
  }

  // 通过ID查找用户
  async findById(id: string): Promise<UserDocument> {
    return this.userModel.findById(id).exec();
  }

  // 创建用户（注册）
  async create(createUserDto: CreateUserDto, avatarFile?: any): Promise<UserDocument> {
    // 检查用户名是否已被占用
    const existingUser = await this.findByUsername(createUserDto.username);
    if (existingUser) {
      throw new BadRequestException('用户名已被占用');
    }

    // 创建用户
    const newUser = new this.userModel({
      ...createUserDto,
      avatar: avatarFile ? `/uploads/images/${avatarFile.filename}` : 'https://via.placeholder.com/150',
    });

    return newUser.save();
  }

  // 更新用户昵称
  async updateNickname(userId: string, updateNicknameDto: UpdateNicknameDto): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { nickname: updateNicknameDto.nickname },
        { new: true }
      )
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('用户未找到');
    }

    return user;
  }

  // 更新用户头像
  async updateAvatar(userId: string, avatarFile: any): Promise<UserDocument> {
    if (!avatarFile) {
      throw new BadRequestException('请上传头像图片');
    }

    const avatarPath = `/uploads/images/${avatarFile.filename}`;

    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { avatar: avatarPath },
        { new: true }
      )
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('用户未找到');
    }

    return user;
  }
} 