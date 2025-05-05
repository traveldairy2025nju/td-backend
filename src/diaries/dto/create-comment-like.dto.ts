import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class CreateCommentLikeDto {
  @ApiProperty({ description: '评论ID' })
  @IsMongoId()
  commentId: string;
} 