import { Injectable, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // 验证用户
  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.usersService.findByUsername(username);
    
    if (!user) {
      throw new UnauthorizedException('无效的用户名或密码');
    }
    
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      throw new UnauthorizedException('无效的用户名或密码');
    }
    
    return user;
  }

  // 生成JWT令牌
  generateToken(userId: string): string {
    const payload = { sub: userId };
    return this.jwtService.sign(payload);
  }
} 