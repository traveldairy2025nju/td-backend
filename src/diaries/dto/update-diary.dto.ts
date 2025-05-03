import { IsOptional, IsString, IsArray } from 'class-validator';
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
    description: '视频',
    required: false,
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  video?: any;
} 