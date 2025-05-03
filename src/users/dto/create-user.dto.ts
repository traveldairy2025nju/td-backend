import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ 
    description: '用户名', 
    example: 'testuser',
    minLength: 3
  })
  @IsString()
  @MinLength(3, { message: '用户名至少需要3个字符' })
  username: string;

  @ApiProperty({ 
    description: '密码', 
    example: 'test123456',
    minLength: 6
  })
  @IsString()
  @MinLength(6, { message: '密码至少需要6个字符' })
  password: string;

  @ApiProperty({ 
    description: '昵称', 
    example: '测试用户'
  })
  @IsString()
  nickname: string;
} 