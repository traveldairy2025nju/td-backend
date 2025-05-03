import { Injectable, UnauthorizedException, Inject, forwardRef, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // 验证用户
  async validateUser(username: string, password: string): Promise<User> {
    this.logger.log(`正在尝试验证用户: ${username}`);
    
    try {
      const user = await this.usersService.findByUsername(username);
      
      if (!user) {
        this.logger.error(`用户未找到: ${username}`);
        throw new UnauthorizedException('无效的用户名或密码');
      }
      
      this.logger.log(`用户找到，正在验证密码，用户密码哈希: ${user.password.substring(0, 10)}...`);
      let isMatch = false;
      
      try {
        // 直接使用bcrypt比较，而不是模型方法
        isMatch = await bcrypt.compare(password, user.password);
        this.logger.log(`密码验证结果: ${isMatch}，明文密码长度: ${password.length}，哈希密码长度: ${user.password.length}`);
      } catch (error) {
        this.logger.error(`密码验证出错: ${error.message}`);
        throw new UnauthorizedException('验证密码时出错');
      }
      
      if (!isMatch) {
        this.logger.error(`密码不匹配`);
        throw new UnauthorizedException('无效的用户名或密码');
      }
      
      this.logger.log(`用户验证成功`);
      return user;
    } catch (error) {
      this.logger.error(`验证用户时出错: ${error.message}`);
      throw error;
    }
  }

  // 生成JWT令牌
  generateToken(userId: string): string {
    const payload = { sub: userId };
    return this.jwtService.sign(payload);
  }
} 