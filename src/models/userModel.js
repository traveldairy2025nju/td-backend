const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, '用户名不能为空'],
      unique: true,
      trim: true,
      minlength: [3, '用户名至少需要3个字符']
    },
    password: {
      type: String,
      required: [true, '密码不能为空'],
      minlength: [6, '密码至少需要6个字符']
    },
    nickname: {
      type: String,
      required: [true, '昵称不能为空'],
      trim: true
    },
    avatar: {
      type: String,
      default: '/uploads/images/default-avatar.png'
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'reviewer'],
      default: 'user'
    }
  },
  {
    timestamps: true
  }
);

// 密码加密
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 比较密码
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 