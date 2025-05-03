import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateNicknameDto } from './dto/update-nickname.dto';
import { MinioUtil } from '../utils/minio.utils';
import { UpdateAvatarDto } from './dto/update-avatar.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly DEFAULT_AVATAR = 'http://172.29.4.76:9000/travel-diary/default-avatar.png';

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly minioUtil: MinioUtil,
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
  async create(createUserDto: CreateUserDto, avatarFile?: Express.Multer.File): Promise<UserDocument> {
    // 检查用户名是否已被占用
    const existingUser = await this.findByUsername(createUserDto.username);
    if (existingUser) {
      throw new BadRequestException('用户名已被占用');
    }

    this.logger.log(`创建新用户: ${createUserDto.username}`);

    // 处理头像上传
    let avatarUrl = this.DEFAULT_AVATAR; // 默认头像
    if (avatarFile) {
      avatarUrl = await this.minioUtil.upload(avatarFile);
    }

    // 创建用户
    const newUser = new this.userModel({
      ...createUserDto,
      avatar: avatarUrl,
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

  // 更新用户头像 (旧方法，已废弃)
  async updateAvatarWithFile(userId: string, avatarFile: Express.Multer.File): Promise<UserDocument> {
    if (!avatarFile) {
      throw new BadRequestException('请上传头像图片');
    }

    // 上传到Minio
    const avatarUrl = await this.minioUtil.upload(avatarFile);
    
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { avatar: avatarUrl },
        { new: true }
      )
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('用户未找到');
    }

    return user;
  }

  // 更新用户头像 (新方法，使用URL)
  async updateAvatar(userId: string, updateAvatarDto: UpdateAvatarDto): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { avatar: updateAvatarDto.avatarUrl },
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