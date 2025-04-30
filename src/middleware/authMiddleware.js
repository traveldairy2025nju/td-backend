const { verifyToken } = require('../utils/jwtUtils');
const User = require('../models/userModel');

// 保护路由 - 需要登录
const protect = async (req, res, next) => {
  let token;

  // 检查请求头中的令牌
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 获取令牌
      token = req.headers.authorization.split(' ')[1];

      // 验证令牌
      const decoded = verifyToken(token);

      if (!decoded.valid) {
        return res.status(401).json({
          success: false,
          message: decoded.expired ? '令牌已过期' : '无效的令牌'
        });
      }

      // 获取用户信息
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ success: false, message: '用户不存在' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ success: false, message: '未授权，令牌失败' });
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: '未授权，无令牌' });
  }
};

// 角色检查中间件
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未授权，请先登录'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '您没有执行此操作的权限'
      });
    }

    next();
  };
};

module.exports = {
  protect,
  restrictTo
}; 