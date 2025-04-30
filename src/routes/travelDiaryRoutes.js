const express = require('express');
const { 
  getApprovedDiaries, 
  getDiaryById, 
  createDiary, 
  getUserDiaries, 
  updateDiary, 
  deleteDiary 
} = require('../controllers/diaryController');
const { protect } = require('../middleware/authMiddleware');
const { uploadImage, uploadVideo } = require('../utils/uploadUtils');

const router = express.Router();

// 公开路由

/**
 * @swagger
 * /api/diaries:
 *   get:
 *     summary: 获取已批准的游记列表
 *     tags: [游记]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         description: 纬度（与lng和distance一起使用）
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         description: 经度（与lat和distance一起使用）
 *       - in: query
 *         name: distance
 *         schema:
 *           type: integer
 *         description: 距离，单位：公里
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/', getApprovedDiaries);

/**
 * @swagger
 * /api/diaries/{id}:
 *   get:
 *     summary: 获取游记详情
 *     tags: [游记]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 游记ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 游记未找到
 */
router.get('/:id', getDiaryById);

// 受保护的路由 - 需要 JWT 认证
router.use(protect);

// 配置多文件上传中间件
const uploadFiles = (req, res, next) => {
  // 处理多张图片和一个视频的上传
  const imageUpload = uploadImage.array('images', 10); // 最多10张图片
  const videoUpload = uploadVideo.single('video');

  // 先处理图片上传
  imageUpload(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: `图片上传失败: ${err.message}`
      });
    }

    // 再处理视频上传（如果有）
    videoUpload(req, res, (videoErr) => {
      if (videoErr) {
        return res.status(400).json({
          success: false,
          message: `视频上传失败: ${videoErr.message}`
        });
      }
      next();
    });
  });
};

/**
 * @swagger
 * /api/diaries:
 *   post:
 *     summary: 创建新游记
 *     tags: [游记]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - images
 *             properties:
 *               title:
 *                 type: string
 *                 description: 游记标题
 *                 example: 我的北京之旅
 *               content:
 *                 type: string
 *                 description: 游记内容
 *                 example: 这是一段游记内容描述...
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 游记图片(可多张)
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: 视频(可选)
 *               location:
 *                 type: string
 *                 description: 位置信息(JSON格式)
 *                 example: '{"type":"Point","coordinates":[116.397,39.908],"name":"北京市"}'
 *     responses:
 *       201:
 *         description: 创建成功
 *       400:
 *         description: 创建失败
 *       401:
 *         description: 未授权
 */
router.post('/', uploadFiles, createDiary);

/**
 * @swagger
 * /api/diaries/user/me:
 *   get:
 *     summary: 获取当前用户的游记
 *     tags: [游记]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: 状态过滤
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 */
router.get('/user/me', getUserDiaries);

/**
 * @swagger
 * /api/diaries/{id}:
 *   put:
 *     summary: 更新游记
 *     tags: [游记]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 游记ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               video:
 *                 type: string
 *                 format: binary
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 更新失败，已审核通过的游记不能再次编辑
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权更新此游记
 *       404:
 *         description: 游记未找到
 */
router.put('/:id', uploadFiles, updateDiary);

/**
 * @swagger
 * /api/diaries/{id}:
 *   delete:
 *     summary: 删除游记
 *     tags: [游记]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 游记ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权删除此游记
 *       404:
 *         description: 游记未找到
 */
router.delete('/:id', deleteDiary);

module.exports = router; 