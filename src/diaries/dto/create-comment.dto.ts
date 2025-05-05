import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ description: '游记ID' })
  @IsMongoId()
  diaryId: string;

  @ApiProperty({ description: '评论内容' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: '评论内容不能超过500个字符' })
  content: string;

  @ApiProperty({ description: '父评论ID', required: false })
  @IsOptional()
  @IsMongoId()
  parentCommentId?: string;
} 