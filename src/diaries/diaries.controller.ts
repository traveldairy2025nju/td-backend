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
  ApiBody,
  ApiQuery,
  ApiParam
} from '@nestjs/swagger';
import { DiariesService } from './diaries.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { DiaryStatus } from './entities/diary.entity';

@ApiTags('游记')
@Controller('diaries')
export class DiariesController {
  constructor(private readonly diariesService: DiariesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建新游记' })
  @ApiBody({ type: CreateDiaryDto })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '创建失败' })
  @ApiResponse({ status: 401, description: '未授权' })
  async create(
    @Body() createDiaryDto: CreateDiaryDto,
    @GetUser() user: User
  ) {
    const diary = await this.diariesService.create(createDiaryDto, user);
    return {
      success: true,
      message: '游记创建成功，等待审核',
      data: diary,
    };
  }

  @Get()
  @ApiOperation({ summary: '获取已批准的游记列表' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: '页码' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: '每页数量' })
  @ApiQuery({ name: 'keyword', type: String, required: false, description: '搜索关键词' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('keyword') keyword?: string,
  ) {
    const result = await this.diariesService.findAllApproved(page, limit, keyword);
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

  @Get('user/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户的游记' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: '页码' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: '每页数量' })
  @ApiQuery({ 
    name: 'status', 
    enum: DiaryStatus, 
    required: false, 
    description: '状态过滤' 
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findUserDiaries(
    @GetUser('_id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: DiaryStatus,
  ) {
    const result = await this.diariesService.findUserDiaries(userId, page, limit, status);
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

  @Get(':id')
  @ApiOperation({ summary: '获取游记详情' })
  @ApiParam({ name: 'id', description: '游记ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '游记未找到' })
  async findOne(@Param('id') id: string) {
    const diary = await this.diariesService.findOne(id);
    return {
      success: true,
      data: diary
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新游记' })
  @ApiParam({ name: 'id', description: '游记ID' })
  @ApiBody({ type: UpdateDiaryDto })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '更新失败，已审核通过的游记不能再次编辑' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权更新此游记' })
  @ApiResponse({ status: 404, description: '游记未找到' })
  async update(
    @Param('id') id: string,
    @Body() updateDiaryDto: UpdateDiaryDto,
    @GetUser('_id') userId: string
  ) {
    const diary = await this.diariesService.update(id, updateDiaryDto, userId);
    return {
      success: true,
      message: '游记更新成功，等待审核',
      data: diary
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除游记' })
  @ApiParam({ name: 'id', description: '游记ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权删除此游记' })
  @ApiResponse({ status: 404, description: '游记未找到' })
  async remove(
    @Param('id') id: string,
    @GetUser('_id') userId: string
  ) {
    await this.diariesService.remove(id, userId);
    return {
      success: true,
      message: '游记删除成功'
    };
  }
} 