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

  async create(createDiaryDto: CreateDiaryDto, author: User, videoFile?: Express.Multer.File): Promise<DiaryDocument> {
    try {
      // 上传视频文件
      let videoUrl = null;
      if (videoFile) {
        videoUrl = await this.minioUtil.upload(videoFile);
      }

      // 创建新日记
      const newDiary = new this.diaryModel({
        title: createDiaryDto.title,
        content: createDiaryDto.content,
        images: createDiaryDto.images,
        video: videoUrl,
        author: author._id,
        status: DiaryStatus.PENDING,
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
      .populate('author', 'username nickname avatar')
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
      .populate('author', 'username nickname avatar')
      .populate('reviewedBy', 'username nickname')
      .exec();
      
    if (!diary) {
      throw new NotFoundException('日记未找到');
    }
    
    return diary;
  }

  async update(id: string, updateDiaryDto: UpdateDiaryDto, userId: string, videoFile?: Express.Multer.File): Promise<DiaryDocument> {
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
    
    // 检查状态
    if (diary.status === DiaryStatus.APPROVED) {
      throw new BadRequestException('已审核通过的日记不能再次编辑');
    }
    
    // 上传视频文件
    let videoUrl = diary.video;
    if (videoFile) {
      videoUrl = await this.minioUtil.upload(videoFile);
    }
    
    // 更新日记
    const updatedDiary = await this.diaryModel.findByIdAndUpdate(
      id,
      {
        title: updateDiaryDto.title || diary.title,
        content: updateDiaryDto.content || diary.content,
        images: updateDiaryDto.images || diary.images,
        video: videoUrl,
        status: DiaryStatus.PENDING, // 重新设置为待审核
        rejectReason: null, // 清除拒绝原因
        reviewedBy: null, // 清除审核人
        approvedAt: null, // 清除审核通过时间
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
      .exec();
      
    return {
      diaries,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }
} 