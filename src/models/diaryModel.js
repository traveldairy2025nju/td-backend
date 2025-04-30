const mongoose = require('mongoose');

const diarySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, '标题不能为空'],
      trim: true,
      maxlength: [100, '标题最多100个字符']
    },
    content: {
      type: String,
      required: [true, '内容不能为空'],
      trim: true
    },
    images: [{
      type: String,
      required: [true, '至少需要一张图片']
    }],
    video: {
      type: String,
      default: null
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [经度, 纬度]
        default: [0, 0]
      },
      name: {
        type: String,
        default: ''
      }
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rejectReason: {
      type: String,
      default: ''
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// 创建索引
diarySchema.index({ location: '2dsphere' });
diarySchema.index({ status: 1 });
diarySchema.index({ author: 1 });
diarySchema.index({ createdAt: -1 });

const Diary = mongoose.model('Diary', diarySchema);

module.exports = Diary; 