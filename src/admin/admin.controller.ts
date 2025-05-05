import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  UseGuards, 
  Query, 
  Put,
  ParseIntPipe,
  DefaultValuePipe
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { RejectDiaryDto } from './dto/reject-diary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { ReviewerGuard } from './guards/reviewer.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { DiariesService } from '../diaries/diaries.service';
import { User } from '../users/entities/user.entity';
import { AiReviewResultDto } from './dto/ai-review-result.dto';

@ApiTags('管理员')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly diariesService: DiariesService,
  ) {}

  @Get('diaries/pending')
  @ApiOperation({ summary: '获取待审核的游记列表' })
  async findAllPendingDiaries(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('keyword') keyword?: string,
  ) {
    return await this.adminService.findAllPendingDiaries(+page, +limit, keyword);
  }

  @Put('diaries/:id/approve')
  @ApiOperation({ summary: '审核通过游记' })
  async approveDiary(
    @Param('id') id: string,
    @GetUser() admin: User,
  ) {
    return await this.adminService.approveDiary(id, admin._id.toString());
  }

  @Put('diaries/:id/reject')
  @ApiOperation({ summary: '拒绝游记' })
  async rejectDiary(
    @Param('id') id: string,
    @Body() rejectDiaryDto: RejectDiaryDto,
    @GetUser() admin: User,
  ) {
    return await this.adminService.rejectDiary(id, admin._id.toString(), rejectDiaryDto.rejectReason);
  }

  @Delete('diaries/:id')
  @ApiOperation({ summary: '删除游记' })
  async removeDiary(@Param('id') id: string) {
    return await this.adminService.removeDiary(id);
  }

  @Get('diaries/:id/ai-review')
  @ApiOperation({ summary: 'AI辅助审核游记' })
  @ApiResponse({ 
    status: 200, 
    description: 'AI审核结果',
    type: AiReviewResultDto 
  })
  async aiReviewDiary(@Param('id') id: string): Promise<AiReviewResultDto> {
    return await this.adminService.aiReviewDiary(id);
  }
} 