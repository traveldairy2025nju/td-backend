import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Diary, DiaryDocument, DiaryStatus } from '../diaries/entities/diary.entity';
import { User, UserDocument } from '../users/entities/user.entity';
import { RejectDiaryDto } from './dto/reject-diary.dto';
import { AiReviewService } from '../common/services/ai-review.service';
import { AiReviewResultDto } from './dto/ai-review-result.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Diary.name) private diaryModel: Model<DiaryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly aiReviewService: AiReviewService,
  ) {}

  async findAllPendingDiaries(
    page = 1,
    limit = 10,
    keyword?: string
  ): Promise<{ diaries: DiaryDocument[], total: number, totalPages: number }> {
    const skip = (page - 1) * limit;
    
    // 构建查询条件
    const query: any = { status: DiaryStatus.PENDING };
    
    // 关键词搜索
    if (keyword && keyword.trim()) {
      const keywordRegex = new RegExp(keyword, 'i');
      query.$or = [
        { title: { $regex: keywordRegex } },
        { content: { $regex: keywordRegex } }
      ];
    }
    
    const total = await this.diaryModel.countDocuments(query);
    const diaries = await this.diaryModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', '_id username nickname avatar')
      .exec();
      
    return {
      diaries,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  async approveDiary(id: string, adminId: string): Promise<DiaryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('无效的日记ID');
    }
    
    const diary = await this.diaryModel.findById(id);
    if (!diary) {
      throw new NotFoundException('日记未找到');
    }
    
    if (diary.status === DiaryStatus.APPROVED) {
      throw new BadRequestException('该日记已经审核通过');
    }
    
    return await this.diaryModel.findByIdAndUpdate(
      id,
      {
        status: DiaryStatus.APPROVED,
        approvedAt: new Date(),
        reviewedBy: new Types.ObjectId(adminId),
        rejectReason: null,
      },
      { new: true }
    ).populate('author', '_id username nickname avatar');
  }

  async rejectDiary(id: string, adminId: string, reason: string): Promise<DiaryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('无效的日记ID');
    }
    
    const diary = await this.diaryModel.findById(id);
    if (!diary) {
      throw new NotFoundException('日记未找到');
    }
    
    if (diary.status === DiaryStatus.REJECTED) {
      throw new BadRequestException('该日记已经被拒绝');
    }
    
    return await this.diaryModel.findByIdAndUpdate(
      id,
      {
        status: DiaryStatus.REJECTED,
        reviewedBy: new Types.ObjectId(adminId),
        rejectReason: reason,
        approvedAt: null,
      },
      { new: true }
    ).populate('author', '_id username nickname avatar');
  }

  async removeDiary(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('无效的日记ID');
    }
    
    const diary = await this.diaryModel.findById(id);
    if (!diary) {
      throw new NotFoundException('日记未找到');
    }
    
    await this.diaryModel.findByIdAndDelete(id);
  }

  // 新增：AI辅助审核方法
  async aiReviewDiary(id: string): Promise<AiReviewResultDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('无效的日记ID');
    }
    
    const diary = await this.diaryModel.findById(id);
    if (!diary) {
      throw new NotFoundException('日记未找到');
    }

    // 调用AI审核服务
    const aiResult = await this.aiReviewService.reviewContent(
      diary.title,
      diary.content
    );

    return {
      approved: aiResult.approved,
      reason: aiResult.reason
    };
  }
} 