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
import { CommentLike, CommentLikeDocument } from './entities/comment-like.entity';
import { CreateLikeDto } from './dto/create-like.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateCommentLikeDto } from './dto/create-comment-like.dto';
import { CommentWithReplies } from './interfaces/comment-with-replies.interface';
import { Favorite, FavoriteDocument } from './entities/favorite.entity';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

@Injectable()
export class DiariesService {
  constructor(
    @InjectModel(Diary.name) private diaryModel: Model<DiaryDocument>,
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(CommentLike.name) private commentLikeModel: Model<CommentLikeDocument>,
    @InjectModel(Favorite.name) private favoriteModel: Model<FavoriteDocument>,
    private readonly minioUtil: MinioUtil,
  ) {}

  async create(createDiaryDto: CreateDiaryDto, author: User): Promise<DiaryDocument> {
    try {
      // 创建新日记（状态为待审核）
      const newDiary = new this.diaryModel({
        title: createDiaryDto.title,
        content: createDiaryDto.content,
        images: createDiaryDto.images,
        video: createDiaryDto.videoUrl || createDiaryDto.video || null,
        location: createDiaryDto.location || null, // 添加位置信息
        author: author._id,
        status: DiaryStatus.PENDING, // 修改为待审核状态
        approvedAt: null, // 清空审核时间
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
    
    // 关键词搜索 - 使用正则表达式实现模糊搜索
    if (keyword && keyword.trim()) {
      const keywordRegex = new RegExp(keyword, 'i'); // 'i'表示不区分大小写
      query.$or = [
        { title: { $regex: keywordRegex } },
        { content: { $regex: keywordRegex } }
      ];
    }
    
    // 执行查询
    const total = await this.diaryModel.countDocuments(query);
    const diaries = await this.diaryModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('_id title content images video location author status likeCount commentCount approvedAt createdAt updatedAt')
      .populate('author', '_id username nickname avatar')
      .exec();
      
    return {
      diaries,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findAllRejected(
    page = 1, 
    limit = 10, 
    keyword?: string
  ): Promise<{ diaries: DiaryDocument[], total: number, totalPages: number }> {
    const skip = (page - 1) * limit;
    
    // 构建查询条件
    const query: any = { status: DiaryStatus.REJECTED };
    
    // 关键词搜索 - 使用正则表达式实现模糊搜索
    if (keyword && keyword.trim()) {
      const keywordRegex = new RegExp(keyword, 'i'); // 'i'表示不区分大小写
      query.$or = [
        { title: { $regex: keywordRegex } },
        { content: { $regex: keywordRegex } }
      ];
    }
    
    // 执行查询
    const total = await this.diaryModel.countDocuments(query);
    const diaries = await this.diaryModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('_id title content images video location author status rejectReason likeCount commentCount createdAt updatedAt')
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
      .select('_id title content images video location author status rejectReason approvedAt reviewedBy likeCount commentCount createdAt updatedAt')
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
    
    // 更新日记，并将状态重置为待审核
    const updatedDiary = await this.diaryModel.findByIdAndUpdate(
      id,
      {
        title: updateDiaryDto.title || diary.title,
        content: updateDiaryDto.content || diary.content,
        images: updateDiaryDto.images || diary.images,
        video: updateDiaryDto.videoUrl !== undefined ? updateDiaryDto.videoUrl : diary.video,
        location: updateDiaryDto.location !== undefined ? updateDiaryDto.location : diary.location, // 更新位置信息
        // 将状态重置为待审核
        status: DiaryStatus.PENDING,
        rejectReason: null, // 清除拒绝原因
        reviewedBy: null, // 清除审核人
        approvedAt: null, // 清除审核时间
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
      .select('_id title content images video location author status rejectReason likeCount commentCount approvedAt createdAt updatedAt')
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
                location: 1,  // 添加位置信息
                status: 1,
                approvedAt: 1,
                createdAt: 1,
                updatedAt: 1,
                likeCount: 1,
                commentCount: 1,
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
  async findOneWithLikeStatus(id: string, userId?: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('无效的日记ID');
    }
    
    const diary = await this.diaryModel.findById(id)
      .select('_id title content images video location author status rejectReason approvedAt reviewedBy likeCount commentCount createdAt updatedAt')
      .populate('author', '_id username nickname avatar')
      .populate('reviewedBy', '_id username nickname')
      .exec();
      
    if (!diary) {
      throw new NotFoundException('日记未找到');
    }
    
    // 如果提供了用户ID，则检查用户是否已点赞
    if (userId) {
      const isLiked = await this.getUserLikeStatus(id, userId);
      const diaryObj = diary.toObject();
      return { ...diaryObj, isLiked };
    }
    
    return diary;
  }

  // 评论点赞功能
  async likeComment(createCommentLikeDto: CreateCommentLikeDto, user: User): Promise<{ liked: boolean }> {
    const { commentId } = createCommentLikeDto;

    if (!Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException('无效的评论ID');
    }

    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    // 检查用户是否已经点赞
    const existingLike = await this.commentLikeModel.findOne({
      comment: commentId,
      user: user._id
    });

    // 如果已点赞，则取消点赞
    if (existingLike) {
      await this.commentLikeModel.findByIdAndDelete(existingLike._id);
      // 更新点赞数量
      await this.commentModel.findByIdAndUpdate(commentId, { $inc: { likeCount: -1 } });
      return { liked: false };
    }

    // 如果未点赞，则添加点赞
    const newLike = new this.commentLikeModel({
      comment: commentId,
      user: user._id
    });

    await newLike.save();

    // 更新点赞数量
    await this.commentModel.findByIdAndUpdate(commentId, { $inc: { likeCount: 1 } });

    return { liked: true };
  }

  // 获取用户是否已点赞评论
  async getUserCommentLikeStatus(commentId: string, userId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(commentId)) {
      throw new BadRequestException('无效的评论ID');
    }

    const existingLike = await this.commentLikeModel.findOne({
      comment: commentId,
      user: userId
    });

    return !!existingLike;
  }

  // 扩展getComments方法，包含点赞状态
  async getCommentsWithLikeStatus(
    diaryId: string,
    userId: string | null,
    page = 1,
    limit = 10
  ): Promise<{ comments: (CommentWithReplies & { isLiked?: boolean })[], total: number, totalPages: number }> {
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

    // 获取子评论并添加点赞状态
    const commentResults: (CommentWithReplies & { isLiked?: boolean })[] = [];

    for (const comment of comments) {
      const replies = await this.commentModel.find({
        parentComment: comment._id
      })
        .sort({ createdAt: 1 })
        .populate('user', '_id username nickname avatar')
        .lean()  // 转换为普通JavaScript对象
        .exec();

      // 如果提供了用户ID，添加点赞状态
      let isCommentLiked = false;
      if (userId) {
        isCommentLiked = await this.getUserCommentLikeStatus(comment._id.toString(), userId);
      }

      // 获取子评论的点赞状态
      const repliesWithLikeStatus = [];
      if (userId) {
        for (const reply of replies) {
          const isReplyLiked = await this.getUserCommentLikeStatus(reply._id.toString(), userId);
          repliesWithLikeStatus.push({
            ...reply,
            isLiked: isReplyLiked
          });
        }
      } else {
        repliesWithLikeStatus.push(...replies);
      }

      // 将回复添加到评论对象中
      const commentWithReplies = {
        ...comment,
        isLiked: isCommentLiked,
        replies: repliesWithLikeStatus || []
      };

      commentResults.push(commentWithReplies);
    }

    return {
      comments: commentResults,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  // 收藏游记
  async favoriteDiary(createFavoriteDto: CreateFavoriteDto, user: User): Promise<{ favorited: boolean }> {
    const { diaryId } = createFavoriteDto;
    
    if (!Types.ObjectId.isValid(diaryId)) {
      throw new BadRequestException('无效的游记ID');
    }
    
    const diary = await this.diaryModel.findById(diaryId);
    if (!diary) {
      throw new NotFoundException('游记不存在');
    }
    
    if (diary.status !== DiaryStatus.APPROVED) {
      throw new BadRequestException('只能收藏已审核通过的游记');
    }
    
    // 检查用户是否已经收藏
    const existingFavorite = await this.favoriteModel.findOne({ 
      diary: diaryId, 
      user: user._id 
    });
    
    // 如果已收藏，则取消收藏
    if (existingFavorite) {
      await this.favoriteModel.findByIdAndDelete(existingFavorite._id);
      // 更新收藏数量
      await this.diaryModel.findByIdAndUpdate(diaryId, { $inc: { favoriteCount: -1 } });
      return { favorited: false };
    }
    
    // 如果未收藏，则添加收藏
    const newFavorite = new this.favoriteModel({
      diary: diaryId,
      user: user._id
    });
    
    await newFavorite.save();
    
    // 更新收藏数量
    await this.diaryModel.findByIdAndUpdate(diaryId, { $inc: { favoriteCount: 1 } });
    
    return { favorited: true };
  }
  
  // 获取用户是否已收藏
  async getUserFavoriteStatus(diaryId: string, userId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(diaryId)) {
      throw new BadRequestException('无效的游记ID');
    }
    
    const existingFavorite = await this.favoriteModel.findOne({ 
      diary: diaryId, 
      user: userId 
    });
    
    return !!existingFavorite;
  }
  
  // 获取用户收藏的所有游记
  async getUserFavorites(
    userId: string,
    page = 1,
    limit = 10
  ): Promise<{ diaries: any[], total: number, totalPages: number }> {
    console.log('获取用户收藏列表，用户ID:', userId);
    
    if (!userId) {
      throw new BadRequestException('用户ID不能为空');
    }
    
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('无效的用户ID');
    }
    
    try {
      const skip = (page - 1) * limit;
      
      // 查找用户的所有收藏
      const favoriteEntries = await this.favoriteModel.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'diary',
          match: { status: DiaryStatus.APPROVED }, // 只返回已审核通过的游记
          populate: {
            path: 'author',
            select: '_id username nickname avatar'
          }
        })
        .exec();
      
      // 提取游记并过滤掉可能已删除的游记（diary为null的情况）
      const diaries = favoriteEntries
        .map(favorite => favorite.diary)
        .filter(diary => diary !== null);
      
      // 获取总收藏数
      const total = await this.favoriteModel.countDocuments({
        user: userId
      });
      
      return {
        diaries,
        total,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('获取收藏列表错误:', error);
      throw new BadRequestException('获取收藏列表失败: ' + error.message);
    }
  }

  // 扩展findOne方法，包含点赞和收藏状态
  async findOneWithUserStatus(id: string, userId?: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('无效的日记ID');
    }
    
    const diary = await this.diaryModel.findById(id)
      .select('_id title content images video location author status rejectReason approvedAt reviewedBy likeCount commentCount favoriteCount createdAt updatedAt')
      .populate('author', '_id username nickname avatar')
      .populate('reviewedBy', '_id username nickname')
      .exec();
      
    if (!diary) {
      throw new NotFoundException('日记未找到');
    }
    
    // 如果提供了用户ID，则检查用户是否已点赞和收藏
    if (userId) {
      const isLiked = await this.getUserLikeStatus(id, userId);
      const isFavorited = await this.getUserFavoriteStatus(id, userId);
      const diaryObj = diary.toObject();
      return { ...diaryObj, isLiked, isFavorited };
    }
    
    return diary;
  }

  // 根据用户当前位置获取附近的游记
  async findNearbyDiaries(
    latitude: number,
    longitude: number,
    page = 1,
    limit = 10,
  ): Promise<{ diaries: DiaryDocument[], total: number, totalPages: number }> {
    // 验证经纬度合法性
    if (latitude < -90 || latitude > 90) {
      throw new BadRequestException('纬度值必须在-90到90之间');
    }
    if (longitude < -180 || longitude > 180) {
      throw new BadRequestException('经度值必须在-180到180之间');
    }

    // 计算分页
    const skip = (page - 1) * limit;

    try {
      // 使用聚合查询
      const aggregate = this.diaryModel.aggregate([
        // 只查询已审核通过的游记
        { $match: { status: DiaryStatus.APPROVED } },
        
        // 计算距离 - 使用MongoDB的geoNear计算方式
        {
          $addFields: {
            hasLocation: {
              $and: [
                { $ne: ["$location", null] },
                { $ne: ["$location.latitude", null] },
                { $ne: ["$location.longitude", null] }
              ]
            }
          }
        },
        
        // 添加计算距离的字段
        {
          $addFields: {
            distance: {
              $cond: {
                if: "$hasLocation",
                then: {
                  // 使用余弦定理计算距离（地球上两点间的球面距离）
                  $multiply: [
                    6371000, // 地球半径（米）
                    {
                      $acos: {
                        $min: [
                          1,
                          {
                            $sum: [
                              {
                                $multiply: [
                                  { $sin: { $degreesToRadians: "$location.latitude" } },
                                  { $sin: { $degreesToRadians: latitude } }
                                ]
                              },
                              {
                                $multiply: [
                                  { $cos: { $degreesToRadians: "$location.latitude" } },
                                  { $cos: { $degreesToRadians: latitude } },
                                  { $cos: { $subtract: [
                                    { $degreesToRadians: "$location.longitude" },
                                    { $degreesToRadians: longitude }
                                  ]}}
                                ]
                              }
                            ]
                          }
                        ]
                      }
                    }
                  ]
                },
                else: 999999999 // 对于没有位置信息的游记，设置一个最大距离值
              }
            }
          }
        },
        
        // 按照是否有位置和距离排序
        {
          $addFields: {
            sortOrder: {
              $cond: { if: "$hasLocation", then: 0, else: 1 }
            }
          }
        },
        
        // 先按照有无位置排序，再按距离排序，最后按创建时间排序
        { $sort: { sortOrder: 1, distance: 1, createdAt: -1 } },
        
        // 关联作者信息
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'authorInfo'
          }
        },
        { $unwind: '$authorInfo' },
        
        // 计算总数和分页
        {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              { $skip: skip },
              { $limit: limit },
              // 格式化输出
              {
                $project: {
                  _id: 1,
                  title: 1,
                  content: 1,
                  images: 1,
                  video: 1,
                  location: 1,
                  status: 1,
                  distance: { 
                    $cond: { 
                      if: "$hasLocation", 
                      then: "$distance", 
                      else: null 
                    } 
                  },
                  hasLocation: 1,
                  likeCount: 1,
                  commentCount: 1,
                  favoriteCount: 1,
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
    } catch (error) {
      console.error('获取附近游记失败:', error);
      throw new BadRequestException('获取附近游记失败: ' + error.message);
    }
  }
}