import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('基础接口')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: '根路径测试接口' })
  @ApiResponse({ status: 200, description: '返回 Hello World!' })
  getHello(): string {
    return 'Hello World!';
  }

  @Get('ping')
  @ApiOperation({ summary: '健康检查接口' })
  @ApiResponse({ status: 200, description: '返回 pong' })
  ping(): string {
    return 'pong';
  }
} 