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

@ApiTags('管理员')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly diariesService: DiariesService,
  ) {}

  @Get('diaries/pending')
  @UseGuards(ReviewerGuard)
  @ApiOperation({ summary: '获取待审核游记列表' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: '页码' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: '每页数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  async findPendingDiaries(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const result = await this.adminService.findPendingDiaries(page, limit);
    return {
      success: true,
      data: {
        items: result.diaries,
        total: result.total,
        page,
        limit,
        totalPages: result.totalPages
      }
    };
  }

  @Put('diaries/:id/approve')
  @UseGuards(ReviewerGuard)
  @ApiOperation({ summary: '审核通过游记' })
  @ApiParam({ name: 'id', description: '游记ID' })
  @ApiResponse({ status: 200, description: '审核通过成功' })
  @ApiResponse({ status: 400, description: '游记已审核' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '游记未找到' })
  async approveDiary(
    @Param('id') id: string,
    @GetUser('_id') userId: string,
  ) {
    const diary = await this.adminService.approveDiary(id, userId);
    return {
      success: true,
      message: '审核通过成功',
      data: diary
    };
  }

  @Put('diaries/:id/reject')
  @UseGuards(ReviewerGuard)
  @ApiOperation({ summary: '拒绝游记' })
  @ApiParam({ name: 'id', description: '游记ID' })
  @ApiBody({ type: RejectDiaryDto })
  @ApiResponse({ status: 200, description: '拒绝成功' })
  @ApiResponse({ status: 400, description: '请提供拒绝原因 或 游记已审核' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '游记未找到' })
  async rejectDiary(
    @Param('id') id: string,
    @Body() rejectDiaryDto: RejectDiaryDto,
    @GetUser('_id') userId: string,
  ) {
    const diary = await this.adminService.rejectDiary(id, rejectDiaryDto, userId);
    return {
      success: true,
      message: '拒绝成功',
      data: diary
    };
  }

  @Delete('diaries/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '管理员删除游记' })
  @ApiParam({ name: 'id', description: '游记ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiResponse({ status: 404, description: '游记未找到' })
  async removeDiary(
    @Param('id') id: string,
    @GetUser('_id') userId: string,
  ) {
    await this.diariesService.remove(id, userId, true);
    return {
      success: true,
      message: '删除成功'
    };
  }
} 