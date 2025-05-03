import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateNicknameDto } from './dto/update-nickname.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // 通过用户名查找用户
  async findByUsername(username: string): Promise<UserDocument> {
    this.logger.log(`查找用户: ${username}`);
    const user = await this.userModel.findOne({ username }).exec();
    if (user) {
      // 输出密码（只用于调试）
      this.logger.debug(`找到用户: ${username}, 密码: ${user.password}`);
    } else {
      this.logger.warn(`未找到用户: ${username}`);
    }
    return user;
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

    this.logger.log(`创建新用户: ${createUserDto.username}`);

    // 创建用户
    const newUser = new this.userModel({
      ...createUserDto,
      avatar: avatarFile ? `/uploads/images/${avatarFile.filename}` : '/uploads/images/default-avatar.png',
    });

    const savedUser = await newUser.save();
    this.logger.log(`用户已保存: ${savedUser.username}, 密码: ${savedUser.password}`);
    return savedUser;
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