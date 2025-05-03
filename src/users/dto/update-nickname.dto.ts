import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateNicknameDto {
  @ApiProperty({ description: '用户昵称', example: '新昵称' })
  @IsString()
  @IsNotEmpty({ message: '昵称不能为空' })
  nickname: string;
} 