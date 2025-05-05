import { IsNotEmpty, IsString, IsOptional, IsArray, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

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
    description: '视频URL(可选，通过上传接口获取)',
    required: false,
    example: 'http://172.29.4.76:9000/travel-diary/video123.mp4',
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: '视频URL格式不正确' })
  videoUrl?: string;

  @ApiProperty({
    description: '视频URL(videoUrl的别名，兼容旧版前端)',
    required: false,
    example: 'http://172.29.4.76:9000/travel-diary/video123.mp4',
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: '视频URL格式不正确' })
  @Transform(({ value, obj }) => {
    // 如果已经设置了videoUrl，则优先使用videoUrl
    return obj.videoUrl || value;
  })
  video?: string;
} 