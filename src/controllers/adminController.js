const Diary = require('../models/diaryModel');
const User = require('../models/userModel');
const { asyncHandler } = require('../middleware/errorMiddleware');

// 获取待审核的日记（分页）
const getPendingDiaries = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const diaries = await Diary.find({ status: 'pending' })
    .populate('author', 'nickname avatar')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  const total = await Diary.countDocuments({ status: 'pending' });

  res.json({
    success: true,
    data: {
      diaries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// 审核通过日记
const approveDiary = asyncHandler(async (req, res) => {
  const diary = await Diary.findById(req.params.id);

  if (!diary) {
    return res.status(404).json({
      success: false,
      message: '日记未找到'
    });
  }

  if (diary.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: '此日记已审核，状态为: ' + diary.status
    });
  }

  diary.status = 'approved';
  diary.reviewedBy = req.user._id;
  diary.reviewedAt = Date.now();

  const updatedDiary = await diary.save();

  res.json({
    success: true,
    data: updatedDiary
  });
});

// 拒绝日记
const rejectDiary = asyncHandler(async (req, res) => {
  const { rejectReason } = req.body;

  if (!rejectReason) {
    return res.status(400).json({
      success: false,
      message: '请提供拒绝原因'
    });
  }

  const diary = await Diary.findById(req.params.id);

  if (!diary) {
    return res.status(404).json({
      success: false,
      message: '日记未找到'
    });
  }

  if (diary.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: '此日记已审核，状态为: ' + diary.status
    });
  }

  diary.status = 'rejected';
  diary.rejectReason = rejectReason;
  diary.reviewedBy = req.user._id;
  diary.reviewedAt = Date.now();

  const updatedDiary = await diary.save();

  res.json({
    success: true,
    data: updatedDiary
  });
});

// 管理员删除日记（逻辑删除）
const deleteDiary = asyncHandler(async (req, res) => {
  const diary = await Diary.findById(req.params.id);

  if (!diary) {
    return res.status(404).json({
      success: false,
      message: '日记未找到'
    });
  }

  await Diary.deleteOne({ _id: req.params.id });

  res.json({
    success: true,
    message: '日记已删除'
  });
});

// 获取所有审核员列表（仅管理员可用）
const getReviewers = asyncHandler(async (req, res) => {
  const reviewers = await User.find({ role: 'reviewer' }).select('-password');

  res.json({
    success: true,
    data: reviewers
  });
});

// 添加审核员（仅管理员可用）
const addReviewer = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: '用户未找到'
    });
  }

  user.role = 'reviewer';
  await user.save();

  res.json({
    success: true,
    data: {
      _id: user._id,
      username: user.username,
      nickname: user.nickname,
      role: user.role
    }
  });
});

// 移除审核员（仅管理员可用）
const removeReviewer = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: '用户未找到'
    });
  }

  if (user.role !== 'reviewer') {
    return res.status(400).json({
      success: false,
      message: '此用户不是审核员'
    });
  }

  user.role = 'user';
  await user.save();

  res.json({
    success: true,
    message: '已移除审核员角色'
  });
});

module.exports = {
  getPendingDiaries,
  approveDiary,
  rejectDiary,
  deleteDiary,
  getReviewers,
  addReviewer,
  removeReviewer
}; 