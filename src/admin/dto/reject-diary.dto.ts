import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectDiaryDto {
  @ApiProperty({
    description: '拒绝原因',
    example: '内容不符合规范',
  })
  @IsNotEmpty({ message: '拒绝原因不能为空' })
  @IsString()
  rejectReason: string;
} 