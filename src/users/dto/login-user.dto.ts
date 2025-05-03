import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({ 
    description: '用户名', 
    example: 'testuser' 
  })
  @IsString()
  username: string;

  @ApiProperty({ 
    description: '密码', 
    example: 'test123456' 
  })
  @IsString()
  @MinLength(6, { message: '密码至少需要6个字符' })
  password: string;
} 