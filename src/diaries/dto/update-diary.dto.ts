import { IsOptional, IsString, IsArray, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDiaryDto {
  @ApiProperty({
    description: '游记标题',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: '游记内容',
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({
    description: '游记图片(可多张)',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiProperty({
    description: '视频URL(可选，通过上传接口获取)',
    required: false,
    example: 'http://172.29.4.76:9000/travel-diary/video123.mp4',
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: '视频URL格式不正确' })
  videoUrl?: string;
} 