const Diary = require('../models/diaryModel');
const { asyncHandler } = require('../middleware/errorMiddleware');

// 获取所有已批准的日记（分页）
const getApprovedDiaries = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // 搜索条件
  const keyword = req.query.keyword
    ? {
        $or: [
          { title: { $regex: req.query.keyword, $options: 'i' } },
          { content: { $regex: req.query.keyword, $options: 'i' } }
        ]
      }
    : {};
  
  // 位置搜索
  let locationQuery = {};
  if (req.query.lat && req.query.lng && req.query.distance) {
    locationQuery = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(req.query.lng), parseFloat(req.query.lat)]
          },
          $maxDistance: parseInt(req.query.distance) * 1000 // 转为米
        }
      }
    };
  }

  // 合并查询条件
  const query = {
    status: 'approved',
    ...keyword,
    ...locationQuery
  };

  const diaries = await Diary.find(query)
    .populate('author', 'nickname avatar')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  const total = await Diary.countDocuments(query);

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

// 获取日记详情
const getDiaryById = asyncHandler(async (req, res) => {
  const diary = await Diary.findById(req.params.id).populate(
    'author',
    'nickname avatar'
  );

  if (diary) {
    // 如果日记未获批准且不是作者本人查看
    if (diary.status !== 'approved' && 
        (!req.user || diary.author._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: '无权查看此日记'
      });
    }

    res.json({
      success: true,
      data: diary
    });
  } else {
    res.status(404).json({
      success: false,
      message: '日记未找到'
    });
  }
});

// 创建新日记
const createDiary = asyncHandler(async (req, res) => {
  const { title, content, location } = req.body;
  
  // 验证图片是否存在
  if (!req.files || !req.files.images || req.files.images.length === 0) {
    return res.status(400).json({
      success: false,
      message: '请至少上传一张图片'
    });
  }

  // 处理图片路径
  const imagePaths = req.files.images.map(
    file => `/uploads/images/${file.filename}`
  );
  
  // 处理视频（如果有）
  let videoPath = null;
  if (req.files.video && req.files.video.length > 0) {
    videoPath = `/uploads/videos/${req.files.video[0].filename}`;
  }

  // 处理位置
  const locationData = location ? JSON.parse(location) : {
    type: 'Point',
    coordinates: [0, 0],
    name: ''
  };

  // 创建新日记
  const diary = await Diary.create({
    title,
    content,
    images: imagePaths,
    video: videoPath,
    location: locationData,
    author: req.user._id,
    status: 'pending' // 默认状态为待审核
  });

  res.status(201).json({
    success: true,
    data: diary
  });
});

// 获取用户自己的日记
const getUserDiaries = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // 获取状态过滤
  const status = req.query.status || null;
  const query = { author: req.user._id };
  
  if (status) {
    query.status = status;
  }

  const diaries = await Diary.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  const total = await Diary.countDocuments(query);

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

// 更新日记
const updateDiary = asyncHandler(async (req, res) => {
  const diary = await Diary.findById(req.params.id);

  if (!diary) {
    return res.status(404).json({
      success: false,
      message: '日记未找到'
    });
  }

  // 验证权限：用户必须是作者
  if (diary.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: '无权更新此日记'
    });
  }

  // 只有待审核或被拒绝的日记可以编辑
  if (diary.status === 'approved') {
    return res.status(400).json({
      success: false,
      message: '已审核通过的日记不能再次编辑'
    });
  }

  // 更新内容
  const { title, content, location } = req.body;
  
  // 处理图片
  let imagePaths = diary.images;
  if (req.files && req.files.images && req.files.images.length > 0) {
    imagePaths = req.files.images.map(
      file => `/uploads/images/${file.filename}`
    );
  }
  
  // 处理视频
  let videoPath = diary.video;
  if (req.files && req.files.video && req.files.video.length > 0) {
    videoPath = `/uploads/videos/${req.files.video[0].filename}`;
  }

  // 处理位置
  const locationData = location ? JSON.parse(location) : diary.location;

  // 更新日记
  diary.title = title || diary.title;
  diary.content = content || diary.content;
  diary.images = imagePaths;
  diary.video = videoPath;
  diary.location = locationData;
  diary.status = 'pending'; // 更新后重置为待审核状态
  diary.rejectReason = ''; // 清除拒绝原因

  const updatedDiary = await diary.save();

  res.json({
    success: true,
    data: updatedDiary
  });
});

// 删除日记
const deleteDiary = asyncHandler(async (req, res) => {
  const diary = await Diary.findById(req.params.id);

  if (!diary) {
    return res.status(404).json({
      success: false,
      message: '日记未找到'
    });
  }

  // 验证权限：用户必须是作者
  if (diary.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: '无权删除此日记'
    });
  }

  await Diary.deleteOne({ _id: req.params.id });

  res.json({
    success: true,
    message: '日记已删除'
  });
});

module.exports = {
  getApprovedDiaries,
  getDiaryById,
  createDiary,
  getUserDiaries,
  updateDiary,
  deleteDiary
}; 