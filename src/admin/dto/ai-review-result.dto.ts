import { ApiProperty } from '@nestjs/swagger';

export class AiReviewResultDto {
  @ApiProperty({
    description: 'AI审核是否通过',
    example: true,
  })
  approved: boolean;

  @ApiProperty({
    description: 'AI审核意见和理由',
    example: '内容符合规范，未发现违规内容。',
  })
  reason: string;
} 