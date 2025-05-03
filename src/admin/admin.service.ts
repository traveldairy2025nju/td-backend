import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Diary, DiaryDocument, DiaryStatus } from '../diaries/entities/diary.entity';
import { User, UserDocument } from '../users/entities/user.entity';
import { RejectDiaryDto } from './dto/reject-diary.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Diary.name) private diaryModel: Model<DiaryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findPendingDiaries(page = 1, limit = 10): Promise<{ diaries: DiaryDocument[], total: number, totalPages: number }> {
    const skip = (page - 1) * limit;
    
    const total = await this.diaryModel.countDocuments({ status: DiaryStatus.PENDING });
    const diaries = await this.diaryModel.find({ status: DiaryStatus.PENDING })
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

  async approveDiary(id: string, reviewerId: string): Promise<DiaryDocument> {
    const diary = await this.diaryModel.findById(id);
    
    if (!diary) {
      throw new NotFoundException('游记未找到');
    }
    
    if (diary.status !== DiaryStatus.PENDING) {
      throw new BadRequestException('游记已审核');
    }
    
    return await this.diaryModel.findByIdAndUpdate(
      id,
      {
        status: DiaryStatus.APPROVED,
        approvedAt: new Date(),
        reviewedBy: reviewerId,
      },
      { new: true }
    );
  }

  async rejectDiary(id: string, rejectDiaryDto: RejectDiaryDto, reviewerId: string): Promise<DiaryDocument> {
    if (!rejectDiaryDto.rejectReason) {
      throw new BadRequestException('请提供拒绝原因');
    }
    
    const diary = await this.diaryModel.findById(id);
    
    if (!diary) {
      throw new NotFoundException('游记未找到');
    }
    
    if (diary.status !== DiaryStatus.PENDING) {
      throw new BadRequestException('游记已审核');
    }
    
    return await this.diaryModel.findByIdAndUpdate(
      id,
      {
        status: DiaryStatus.REJECTED,
        rejectReason: rejectDiaryDto.rejectReason,
        reviewedBy: reviewerId,
      },
      { new: true }
    );
  }
} 