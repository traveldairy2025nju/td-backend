import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDiaryDto {
  @ApiProperty({
    description: '游记标题',
    example: '我的北京之旅',
  })
  @IsNotEmpty({ message: '标题不能为空' })
  @IsString()
  title: string;

  @ApiProperty({
    description: '游记内容',
    example: '这是一段游记内容描述...',
  })
  @IsNotEmpty({ message: '内容不能为空' })
  @IsString()
  content: string;

  @ApiProperty({
    description: '游记图片(可多张)',
    type: [String],
    required: true,
    example: ['http://172.29.4.76:9000/travel-diary/image1.jpg'],
  })
  @IsArray()
  images: string[];

  @ApiProperty({
    description: '视频(可选)',
    required: false,
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  video?: any;
} 