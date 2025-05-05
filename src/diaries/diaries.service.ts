import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Diary, DiaryDocument, DiaryStatus } from './entities/diary.entity';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';
import { User } from '../users/entities/user.entity';
import { MinioUtil } from '../utils/minio.utils';

@Injectable()
export class DiariesService {
  constructor(
    @InjectModel(Diary.name) private diaryModel: Model<DiaryDocument>,
    private readonly minioUtil: MinioUtil,
  ) {}

  async create(createDiaryDto: CreateDiaryDto, author: User): Promise<DiaryDocument> {
    try {
      // 创建新日记（开发模式下默认为已审核通过）
      const newDiary = new this.diaryModel({
        title: createDiaryDto.title,
        content: createDiaryDto.content,
        images: createDiaryDto.images,
        video: createDiaryDto.videoUrl || null,
        author: author._id,
        status: DiaryStatus.APPROVED, // 默认为已审核通过，方便调试
        approvedAt: new Date(), // 添加审核通过时间
      });

      return await newDiary.save();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('创建日记失败: ' + error.message);
    }
  }

  async findAllApproved(
    page = 1, 
    limit = 10, 
    keyword?: string
  ): Promise<{ diaries: DiaryDocument[], total: number, totalPages: number }> {
    const skip = (page - 1) * limit;
    
    // 构建查询条件
    const query: any = { status: DiaryStatus.APPROVED };
    
    // 关键词搜索
    if (keyword) {
      query.$text = { $search: keyword };
    }
    
    // 执行查询
    const total = await this.diaryModel.countDocuments(query);
    const diaries = await this.diaryModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('_id title content images video author status approvedAt createdAt updatedAt')
      .populate('author', '_id username nickname avatar')
      .exec();
      
    return {
      diaries,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(id: string): Promise<DiaryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('无效的日记ID');
    }
    
    const diary = await this.diaryModel.findById(id)
      .select('_id title content images video author status rejectReason approvedAt reviewedBy createdAt updatedAt')
      .populate('author', '_id username nickname avatar')
      .populate('reviewedBy', '_id username nickname')
      .exec();
      
    if (!diary) {
      throw new NotFoundException('日记未找到');
    }
    
    return diary;
  }

  async update(id: string, updateDiaryDto: UpdateDiaryDto, userId: string): Promise<DiaryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('无效的日记ID');
    }
    
    // 获取日记
    const diary = await this.diaryModel.findById(id);
    
    if (!diary) {
      throw new NotFoundException('日记未找到');
    }
    
    // 检查权限
    if (diary.author.toString() !== userId.toString()) {
      throw new ForbiddenException('无权更新此日记');
    }
    
    // 开发模式：允许更新已审核通过的游记，注释掉以下限制检查
    /*
    // 检查状态
    if (diary.status === DiaryStatus.APPROVED) {
      throw new BadRequestException('已审核通过的日记不能再次编辑');
    }
    */
    
    // 保存原状态，开发模式下保持状态不变
    const originalStatus = diary.status;
    const originalApprovedAt = diary.approvedAt;
    const originalReviewedBy = diary.reviewedBy;
    
    // 更新日记
    const updatedDiary = await this.diaryModel.findByIdAndUpdate(
      id,
      {
        title: updateDiaryDto.title || diary.title,
        content: updateDiaryDto.content || diary.content,
        images: updateDiaryDto.images || diary.images,
        video: updateDiaryDto.videoUrl !== undefined ? updateDiaryDto.videoUrl : diary.video,
        // 保持原状态，不重置为pending
        status: originalStatus,
        rejectReason: null, // 清除拒绝原因
        reviewedBy: originalReviewedBy,
        approvedAt: originalApprovedAt,
      },
      { new: true }
    ).populate('author', 'username nickname avatar');
    
    return updatedDiary;
  }

  async remove(id: string, userId: string, isAdmin = false): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('无效的日记ID');
    }
    
    const diary = await this.diaryModel.findById(id);
    
    if (!diary) {
      throw new NotFoundException('日记未找到');
    }
    
    // 检查权限
    if (!isAdmin && diary.author.toString() !== userId.toString()) {
      throw new ForbiddenException('无权删除此日记');
    }
    
    await this.diaryModel.findByIdAndDelete(id);
  }

  async findUserDiaries(
    userId: string, 
    page = 1, 
    limit = 10, 
    status?: DiaryStatus
  ): Promise<{ diaries: DiaryDocument[], total: number, totalPages: number }> {
    const skip = (page - 1) * limit;
    const query: any = { author: userId };
    
    if (status) {
      query.status = status;
    }
    
    const total = await this.diaryModel.countDocuments(query);
    const diaries = await this.diaryModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('_id title content images video status rejectReason approvedAt createdAt updatedAt')
      .exec();
      
    return {
      diaries,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  async search(
    keyword: string,
    page = 1, 
    limit = 10, 
  ): Promise<{ diaries: DiaryDocument[], total: number, totalPages: number }> {
    const skip = (page - 1) * limit;
    
    // 构建查询条件 - 只搜索已审核通过的游记
    const baseQuery = { status: DiaryStatus.APPROVED };
    
    // 聚合管道查询
    const aggregate = this.diaryModel.aggregate([
      // 第一步：匹配已审核通过的游记
      { $match: baseQuery },
      
      // 第二步：关联作者信息
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'authorInfo'
        }
      },
      
      // 第三步：展开作者信息数组
      { $unwind: '$authorInfo' },
      
      // 第四步：匹配关键词（标题、内容或作者昵称）
      {
        $match: {
          $or: [
            { title: { $regex: keyword, $options: 'i' } },
            { content: { $regex: keyword, $options: 'i' } },
            { 'authorInfo.nickname': { $regex: keyword, $options: 'i' } }
          ]
        }
      },
      
      // 第五步：添加排序
      { $sort: { createdAt: -1 } },
      
      // 第六步：计算总数（在分页前）
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $skip: skip },
            { $limit: limit },
            // 格式化输出结果，保持与其他查询方法一致的字段结构
            {
              $project: {
                _id: 1,
                title: 1,
                content: 1,
                images: 1,
                video: 1,
                status: 1,
                approvedAt: 1,
                createdAt: 1,
                updatedAt: 1,
                author: {
                  _id: '$authorInfo._id',
                  username: '$authorInfo.username',
                  nickname: '$authorInfo.nickname',
                  avatar: '$authorInfo.avatar'
                }
              }
            }
          ]
        }
      }
    ]);
    
    const result = await aggregate.exec();
    
    // 处理结果
    const total = result[0].metadata[0]?.total || 0;
    const diaries = result[0].data || [];
    
    return {
      diaries,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }
} 