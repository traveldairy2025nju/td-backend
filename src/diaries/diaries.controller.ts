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
  DefaultValuePipe,
  HttpStatus,
  HttpCode
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
import { CreateLikeDto } from './dto/create-like.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateCommentLikeDto } from './dto/create-comment-like.dto';
import { CommentWithReplies } from './interfaces/comment-with-replies.interface';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

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
      message: '游记创建成功，已自动审核通过（开发模式）',
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
    
    // 确保每个游记的_id字段存在
    const transformedDiaries = result.diaries.map(diary => {
      const diaryObj = diary.toObject ? diary.toObject() : diary;
      if (!diaryObj._id && diaryObj.id) {
        diaryObj._id = diaryObj.id;
      }
      return diaryObj;
    });
    
    return {
      success: true,
      data: {
        items: transformedDiaries,
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
    
    // 确保每个游记的_id字段存在
    const transformedDiaries = result.diaries.map(diary => {
      const diaryObj = diary.toObject ? diary.toObject() : diary;
      if (!diaryObj._id && diaryObj.id) {
        diaryObj._id = diaryObj.id;
      }
      return diaryObj;
    });
    
    return {
      success: true,
      data: {
        items: transformedDiaries,
        total: result.total,
        page,
        limit,
        totalPages: result.totalPages
      }
    };
  }

  @Get('rejected')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取已拒绝的游记列表' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: '页码' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: '每页数量' })
  @ApiQuery({ name: 'keyword', type: String, required: false, description: '搜索关键词' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findAllRejected(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('keyword') keyword?: string,
  ) {
    const result = await this.diariesService.findAllRejected(page, limit, keyword);
    
    // 确保每个游记的_id字段存在
    const transformedDiaries = result.diaries.map(diary => {
      const diaryObj = diary.toObject ? diary.toObject() : diary;
      if (!diaryObj._id && diaryObj.id) {
        diaryObj._id = diaryObj.id;
      }
      return diaryObj;
    });
    
    return {
      success: true,
      data: {
        items: transformedDiaries,
        total: result.total,
        page,
        limit,
        totalPages: result.totalPages
      }
    };
  }

  @Get('search')
  @ApiOperation({ summary: '搜索游记' })
  @ApiQuery({ name: 'keyword', required: true, description: '搜索关键词，支持标题、内容、作者昵称' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: '页码' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: '每页数量' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  async search(
    @Query('keyword') keyword: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (!keyword) {
      return {
        success: false,
        message: '搜索关键词不能为空',
        data: {
          items: [],
          total: 0,
          page,
          limit,
          totalPages: 0
        }
      };
    }

    const result = await this.diariesService.search(keyword, page, limit);
    
    // 确保每个游记的_id字段存在
    const transformedDiaries = result.diaries.map(diary => {
      const diaryObj = diary.toObject ? diary.toObject() : diary;
      if (!diaryObj._id && diaryObj.id) {
        diaryObj._id = diaryObj.id;
      }
      return diaryObj;
    });
    
    return {
      success: true,
      data: {
        items: transformedDiaries,
        total: result.total,
        page,
        limit,
        totalPages: result.totalPages
      }
    };
  }

  @Get('nearby')
  @ApiOperation({ summary: '获取附近的游记' })
  @ApiQuery({ name: 'latitude', type: Number, required: true, description: '当前位置纬度' })
  @ApiQuery({ name: 'longitude', type: Number, required: true, description: '当前位置经度' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: '页码' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: '每页数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  async findNearbyDiaries(
    @Query('latitude') latitudeStr: string,
    @Query('longitude') longitudeStr: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    // 转换经纬度为数字
    const latitude = parseFloat(latitudeStr);
    const longitude = parseFloat(longitudeStr);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return {
        success: false,
        message: '无效的经纬度值',
        data: null
      };
    }
    
    try {
      const result = await this.diariesService.findNearbyDiaries(
        latitude,
        longitude,
        page,
        limit
      );
      
      // 处理数据，加入距离的显示格式
      const diaries = result.diaries.map(diary => {
        const diaryObj = diary.toObject ? diary.toObject() : diary;
        
        // 格式化距离显示
        if (diaryObj.distance !== null && diaryObj.distance !== undefined) {
          if (diaryObj.distance < 1000) {
            diaryObj.distanceText = `${Math.round(diaryObj.distance)}米`;
          } else {
            diaryObj.distanceText = `${(diaryObj.distance / 1000).toFixed(1)}公里`;
          }
        } else {
          diaryObj.distanceText = '未知距离';
        }
        
        return diaryObj;
      });
      
      return {
        success: true,
        data: {
          items: diaries,
          total: result.total,
          page,
          limit,
          totalPages: result.totalPages
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '获取附近游记失败',
        statusCode: error.status || 400
      };
    }
  }

  @Get(':id')
  @ApiOperation({ summary: '获取游记详情' })
  @ApiParam({ name: 'id', description: '游记ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '游记未找到' })
  async findOne(@Param('id') id: string) {
    const diary = await this.diariesService.findOne(id);
    
    // 确保_id字段存在
    const diaryObj = diary.toObject ? diary.toObject() : diary;
    if (!diaryObj._id && diaryObj.id) {
      diaryObj._id = diaryObj.id;
    }
    
    return {
      success: true,
      data: diaryObj
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新游记' })
  @ApiParam({ name: 'id', description: '游记ID' })
  @ApiBody({ type: UpdateDiaryDto })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '更新失败' })
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
      message: '游记更新成功，状态已重置为待审核',
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

  @Get(':id/with-like-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取游记详情（包含点赞状态）' })
  @ApiParam({ name: 'id', description: '游记ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '游记未找到' })
  async findOneWithLikeStatus(
    @Param('id') id: string,
    @GetUser('_id') userId: string
  ) {
    const diary = await this.diariesService.findOneWithLikeStatus(id, userId);
    
    // 确保_id字段存在
    const diaryObj = diary.toObject ? diary.toObject() : diary;
    if (!diaryObj._id && diaryObj.id) {
      diaryObj._id = diaryObj.id;
    }
    
    return {
      success: true,
      data: diaryObj
    };
  }

  @Post('like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '点赞/取消点赞游记' })
  @ApiBody({ type: CreateLikeDto })
  @ApiResponse({ status: 200, description: '操作成功' })
  @ApiResponse({ status: 400, description: '操作失败' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '游记未找到' })
  @HttpCode(HttpStatus.OK)
  async likeDiary(
    @Body() createLikeDto: CreateLikeDto,
    @GetUser() user: User
  ) {
    const result = await this.diariesService.likeDiary(createLikeDto, user);
    return {
      success: true,
      message: result.liked ? '点赞成功' : '取消点赞成功',
      data: result
    };
  }

  @Post('comment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '添加评论' })
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({ status: 201, description: '评论成功' })
  @ApiResponse({ status: 400, description: '评论失败' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '游记未找到' })
  async addComment(
    @Body() createCommentDto: CreateCommentDto,
    @GetUser() user: User
  ) {
    const comment = await this.diariesService.addComment(createCommentDto, user);
    return {
      success: true,
      message: '评论成功',
      data: comment
    };
  }

  @Get(':id/comments')
  @ApiOperation({ summary: '获取游记评论' })
  @ApiParam({ name: 'id', description: '游记ID' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: '页码' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: '每页数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '游记未找到' })
  async getComments(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<{ success: boolean, data: { items: CommentWithReplies[], total: number, page: number, limit: number, totalPages: number } }> {
    const result = await this.diariesService.getComments(id, page, limit);
    
    return {
      success: true,
      data: {
        items: result.comments,
        total: result.total,
        page,
        limit,
        totalPages: result.totalPages
      }
    };
  }

  @Delete('comment/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除评论' })
  @ApiParam({ name: 'id', description: '评论ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权删除此评论' })
  @ApiResponse({ status: 404, description: '评论未找到' })
  async removeComment(
    @Param('id') id: string,
    @GetUser('_id') userId: string
  ) {
    await this.diariesService.removeComment(id, userId);
    return {
      success: true,
      message: '评论删除成功'
    };
  }

  @Post('comment/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '点赞/取消点赞评论' })
  @ApiBody({ type: CreateCommentLikeDto })
  @ApiResponse({ status: 200, description: '操作成功' })
  @ApiResponse({ status: 400, description: '操作失败' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '评论未找到' })
  @HttpCode(HttpStatus.OK)
  async likeComment(
    @Body() createCommentLikeDto: CreateCommentLikeDto,
    @GetUser() user: User
  ) {
    const result = await this.diariesService.likeComment(createCommentLikeDto, user);
    return {
      success: true,
      message: result.liked ? '评论点赞成功' : '取消评论点赞成功',
      data: result
    };
  }

  @Get(':id/comments-with-like-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取游记评论（包含点赞状态）' })
  @ApiParam({ name: 'id', description: '游记ID' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: '页码' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: '每页数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '游记未找到' })
  async getCommentsWithLikeStatus(
    @Param('id') id: string,
    @GetUser('_id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const result = await this.diariesService.getCommentsWithLikeStatus(id, userId, page, limit);
    
    return {
      success: true,
      data: {
        items: result.comments,
        total: result.total,
        page,
        limit,
        totalPages: result.totalPages
      }
    };
  }

  @Post('favorite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '收藏/取消收藏游记' })
  @ApiBody({ type: CreateFavoriteDto })
  @ApiResponse({ status: 200, description: '操作成功' })
  @ApiResponse({ status: 400, description: '操作失败' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '游记未找到' })
  @HttpCode(HttpStatus.OK)
  async favoriteDiary(
    @Body() createFavoriteDto: CreateFavoriteDto,
    @GetUser() user: User
  ) {
    const result = await this.diariesService.favoriteDiary(createFavoriteDto, user);
    return {
      success: true,
      message: result.favorited ? '收藏成功' : '取消收藏成功',
      data: result
    };
  }

  @Get('user/favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户收藏的游记列表' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: '页码' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: '每页数量' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getUserFavorites(
    @GetUser('_id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    try {
      console.log('收藏列表API - 用户ID:', userId);
      const result = await this.diariesService.getUserFavorites(userId, page, limit);
      
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
    } catch (error) {
      console.error('收藏列表API错误:', error);
      return {
        success: false,
        message: error.message || '获取收藏列表失败',
        statusCode: error.status || 400
      };
    }
  }

  @Get(':id/with-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取游记详情（包含点赞和收藏状态）' })
  @ApiParam({ name: 'id', description: '游记ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '游记未找到' })
  async findOneWithUserStatus(
    @Param('id') id: string,
    @GetUser('_id') userId: string,
  ) {
    const diary = await this.diariesService.findOneWithUserStatus(id, userId);
    return {
      success: true,
      data: diary
    };
  }
} 