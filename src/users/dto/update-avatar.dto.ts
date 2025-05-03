import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class UpdateAvatarDto {
  @ApiProperty({
    description: '头像URL，通过上传接口获取',
    example: 'https://minio.example.com/travel-diary/abc123.jpg'
  })
  @IsNotEmpty({ message: '头像URL不能为空' })
  @IsString({ message: '头像URL必须是字符串' })
  @IsUrl({}, { message: '头像URL格式不正确' })
  avatarUrl: string;
} 