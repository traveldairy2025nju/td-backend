// 捕获异步错误的包装器
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 处理无效对象ID的错误
const handleCastErrorDB = (error) => {
  const message = `无效的 ${error.path}: ${error.value}.`;
  return { message, statusCode: 400 };
};

// 处理重复键错误
const handleDuplicateFieldsDB = (error) => {
  const value = error.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `重复值: ${value}. 请使用其他值!`;
  return { message, statusCode: 400 };
};

// 处理验证错误
const handleValidationErrorDB = (error) => {
  const errors = Object.values(error.errors).map(el => el.message);
  const message = `无效输入数据: ${errors.join('. ')}`;
  return { message, statusCode: 400 };
};

// 格式化错误响应
const formatError = (err, req, res, next) => {
  if (err.name === 'CastError') {
    const formattedError = handleCastErrorDB(err);
    return res.status(formattedError.statusCode).json({
      success: false,
      message: formattedError.message
    });
  }

  if (err.code === 11000) {
    const formattedError = handleDuplicateFieldsDB(err);
    return res.status(formattedError.statusCode).json({
      success: false,
      message: formattedError.message
    });
  }

  if (err.name === 'ValidationError') {
    const formattedError = handleValidationErrorDB(err);
    return res.status(formattedError.statusCode).json({
      success: false,
      message: formattedError.message
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || '服务器错误'
  });
};

module.exports = {
  asyncHandler,
  formatError
}; 