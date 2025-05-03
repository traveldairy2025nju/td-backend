import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateNicknameDto {
  @ApiProperty({ 
    description: '新昵称', 
    example: '新测试用户' 
  })
  @IsString()
  nickname: string;
} 