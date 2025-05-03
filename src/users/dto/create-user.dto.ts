import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: '用户名', example: 'user123', minLength: 3 })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(3, { message: '用户名至少需要3个字符' })
  username: string;

  @ApiProperty({ description: '密码', example: 'password123', minLength: 6 })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码至少需要6个字符' })
  password: string;

  @ApiProperty({ description: '昵称', example: '测试用户' })
  @IsString()
  @IsNotEmpty({ message: '昵称不能为空' })
  nickname: string;
} 