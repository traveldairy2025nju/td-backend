import { BadRequestException, Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Diary, DiaryDocument, DiaryStatus } from './entities/diary.entity';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';
import { User } from '../users/entities/user.entity';
import { MinioUtil } from '../utils/minio.utils';
import { Like, LikeDocument } from './entities/like.entity';
import { Comment, CommentDocument } from './entities/comment.entity';
import { CreateLikeDto } from './dto/create-like.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentWithReplies } from './interfaces/comment-with-replies.interface';

@Injectable()
export class DiariesService {
  constructor(
    @InjectModel(Diary.name) private diaryModel: Model<DiaryDocument>,
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
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

  // 点赞功能
  async likeDiary(createLikeDto: CreateLikeDto, user: User): Promise<{ liked: boolean }> {
    const { diaryId } = createLikeDto;
    
    if (!Types.ObjectId.isValid(diaryId)) {
      throw new BadRequestException('无效的游记ID');
    }
    
    const diary = await this.diaryModel.findById(diaryId);
    if (!diary) {
      throw new NotFoundException('游记不存在');
    }
    
    if (diary.status !== DiaryStatus.APPROVED) {
      throw new BadRequestException('只能点赞已审核通过的游记');
    }
    
    // 检查用户是否已经点赞
    const existingLike = await this.likeModel.findOne({ 
      diary: diaryId, 
      user: user._id 
    });
    
    // 如果已点赞，则取消点赞
    if (existingLike) {
      await this.likeModel.findByIdAndDelete(existingLike._id);
      // 更新点赞数量
      await this.diaryModel.findByIdAndUpdate(diaryId, { $inc: { likeCount: -1 } });
      return { liked: false };
    }
    
    // 如果未点赞，则添加点赞
    const newLike = new this.likeModel({
      diary: diaryId,
      user: user._id
    });
    
    await newLike.save();
    
    // 更新点赞数量
    await this.diaryModel.findByIdAndUpdate(diaryId, { $inc: { likeCount: 1 } });
    
    return { liked: true };
  }
  
  // 获取用户是否已点赞
  async getUserLikeStatus(diaryId: string, userId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(diaryId)) {
      throw new BadRequestException('无效的游记ID');
    }
    
    const existingLike = await this.likeModel.findOne({ 
      diary: diaryId, 
      user: userId 
    });
    
    return !!existingLike;
  }
  
  // 添加评论
  async addComment(createCommentDto: CreateCommentDto, user: User): Promise<CommentDocument> {
    const { diaryId, content, parentCommentId } = createCommentDto;
    
    if (!Types.ObjectId.isValid(diaryId)) {
      throw new BadRequestException('无效的游记ID');
    }
    
    const diary = await this.diaryModel.findById(diaryId);
    if (!diary) {
      throw new NotFoundException('游记不存在');
    }
    
    if (diary.status !== DiaryStatus.APPROVED) {
      throw new BadRequestException('只能评论已审核通过的游记');
    }
    
    // 如果有父评论，需要验证父评论是否存在
    if (parentCommentId) {
      if (!Types.ObjectId.isValid(parentCommentId)) {
        throw new BadRequestException('无效的父评论ID');
      }
      
      const parentComment = await this.commentModel.findById(parentCommentId);
      if (!parentComment) {
        throw new NotFoundException('父评论不存在');
      }
      
      // 检查父评论是否属于同一个游记
      if (parentComment.diary.toString() !== diaryId) {
        throw new BadRequestException('父评论不属于该游记');
      }
    }
    
    // 创建新评论
    const newComment = new this.commentModel({
      diary: diaryId,
      user: user._id,
      content,
      parentComment: parentCommentId || null
    });
    
    const savedComment = await newComment.save();
    
    // 更新评论数量
    await this.diaryModel.findByIdAndUpdate(diaryId, { $inc: { commentCount: 1 } });
    
    return await this.commentModel.findById(savedComment._id)
      .populate('user', '_id username nickname avatar');
  }
  
  // 获取游记评论
  async getComments(
    diaryId: string, 
    page = 1, 
    limit = 10
  ): Promise<{ comments: CommentWithReplies[], total: number, totalPages: number }> {
    if (!Types.ObjectId.isValid(diaryId)) {
      throw new BadRequestException('无效的游记ID');
    }
    
    const skip = (page - 1) * limit;
    
    // 获取顶级评论（没有父评论的评论）
    const total = await this.commentModel.countDocuments({ 
      diary: diaryId,
      parentComment: null
    });
    
    const comments = await this.commentModel.find({ 
      diary: diaryId,
      parentComment: null
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', '_id username nickname avatar')
      .lean()  // 转换为普通JavaScript对象，便于修改
      .exec();
    
    // 获取子评论
    const commentResults: CommentWithReplies[] = [];
    for (const comment of comments) {
      const replies = await this.commentModel.find({ 
        parentComment: comment._id 
      })
        .sort({ createdAt: 1 })
        .populate('user', '_id username nickname avatar')
        .lean()  // 转换为普通JavaScript对象
        .exec();
      
      // 将回复添加到评论对象中
      const commentWithReplies = comment as CommentWithReplies;
      commentWithReplies.replies = replies || [];
      commentResults.push(commentWithReplies);
    }
    
    return {
      comments: commentResults,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }
  
  // 删除评论
  async removeComment(commentId: string, userId: string, isAdmin = false): Promise<void> {
    if (!Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException('无效的评论ID');
    }
    
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('评论不存在');
    }
    
    // 检查权限，只有评论作者或管理员可以删除
    if (!isAdmin && comment.user.toString() !== userId) {
      throw new ForbiddenException('无权删除此评论');
    }
    
    const diaryId = comment.diary;
    
    // 找出并删除所有子评论
    const childComments = await this.commentModel.find({ parentComment: commentId });
    const childCount = childComments.length;
    
    // 删除子评论
    await this.commentModel.deleteMany({ parentComment: commentId });
    
    // 删除当前评论
    await this.commentModel.findByIdAndDelete(commentId);
    
    // 更新评论计数（减去自身和所有子评论）
    await this.diaryModel.findByIdAndUpdate(diaryId, { 
      $inc: { commentCount: -(childCount + 1) } 
    });
  }

  // 扩展findOne方法，包含点赞状态
  async findOneWithLikeStatus(id: string, userId?: string): Promise<DiaryDocument & { isLiked?: boolean }> {
    const diary = await this.findOne(id);
    
    // 如果提供了用户ID，则检查用户是否已点赞
    if (userId) {
      const isLiked = await this.getUserLikeStatus(id, userId);
      return { ...diary.toObject(), isLiked };
    }
    
    return diary;
  }
} 