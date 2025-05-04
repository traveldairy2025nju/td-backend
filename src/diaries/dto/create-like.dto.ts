import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class CreateLikeDto {
  @ApiProperty({ description: '游记ID' })
  @IsMongoId()
  diaryId: string;
} 