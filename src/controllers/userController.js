const User = require('../models/userModel');
const { generateToken } = require('../utils/jwtUtils');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { uploadImage } = require('../utils/uploadUtils');

// 注册用户
const registerUser = asyncHandler(async (req, res) => {
  const { username, password, nickname } = req.body;

  // 检查用户是否已存在
  const userExists = await User.findOne({ username });
  if (userExists) {
    res.status(400).json({ success: false, message: '用户名已被占用' });
    return;
  }

  // 创建用户
  const user = await User.create({
    username,
    password,
    nickname,
    avatar: req.file ? `/uploads/images/${req.file.filename}` : '/uploads/images/default-avatar.png'
  });

  if (user) {
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
        token: generateToken(user._id)
      }
    });
  } else {
    res.status(400).json({ success: false, message: '用户数据无效' });
  }
});

// 用户登录
const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  
  // 查找用户
  const user = await User.findOne({ username });
  
  // 验证用户和密码
  if (user && (await user.matchPassword(password))) {
    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
        token: generateToken(user._id)
      }
    });
  } else {
    res.status(401).json({ success: false, message: '无效的用户名或密码' });
  }
});

// 获取用户个人资料
const getUserProfile = asyncHandler(async (req, res) => {
  // req.user 由 auth 中间件提供
  const user = await User.findById(req.user._id).select('-password');
  
  if (user) {
    res.json({
      success: true,
      data: user
    });
  } else {
    res.status(404).json({ success: false, message: '用户未找到' });
  }
});

// 更新用户头像
const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: '请上传头像图片' });
  }

  const avatarPath = `/uploads/images/${req.file.filename}`;
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: avatarPath },
    { new: true }
  ).select('-password');

  if (user) {
    res.json({
      success: true,
      data: user
    });
  } else {
    res.status(404).json({ success: false, message: '用户未找到' });
  }
});

// 更新用户昵称
const updateNickname = asyncHandler(async (req, res) => {
  const { nickname } = req.body;

  if (!nickname) {
    return res.status(400).json({ success: false, message: '昵称不能为空' });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { nickname },
    { new: true }
  ).select('-password');

  if (user) {
    res.json({
      success: true,
      data: user
    });
  } else {
    res.status(404).json({ success: false, message: '用户未找到' });
  }
});

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateAvatar,
  updateNickname
}; 