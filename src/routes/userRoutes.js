const express = require('express');
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateAvatar, 
  updateNickname 
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { uploadImage } = require('../utils/uploadUtils');

const router = express.Router();

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: 用户注册
 *     tags: [用户]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - nickname
 *             properties:
 *               username:
 *                 type: string
 *                 description: 用户名
 *                 example: testuser
 *               password:
 *                 type: string
 *                 description: 密码
 *                 format: password
 *                 example: password123
 *               nickname:
 *                 type: string
 *                 description: 用户昵称
 *                 example: 测试用户
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: 用户头像图片
 *     responses:
 *       201:
 *         description: 注册成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     nickname:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                     role:
 *                       type: string
 *                     token:
 *                       type: string
 *       400:
 *         description: 注册失败，用户已存在或数据无效
 */
router.post('/register', uploadImage.single('avatar'), registerUser);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: 用户登录
 *     tags: [用户]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: testuser
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT Token
 *       401:
 *         description: 登录失败，无效的用户名或密码
 */
router.post('/login', loginUser);

// 受保护的路由 - 需要 JWT 认证
router.use(protect);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: 获取用户个人资料
 *     tags: [用户]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     nickname:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: 未授权
 *       404:
 *         description: 用户未找到
 */
router.get('/profile', getUserProfile);

/**
 * @swagger
 * /api/users/avatar:
 *   put:
 *     summary: 更新用户头像
 *     tags: [用户]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: 新头像图片
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 请上传头像图片
 *       401:
 *         description: 未授权
 *       404:
 *         description: 用户未找到
 */
router.put('/avatar', uploadImage.single('avatar'), updateAvatar);

/**
 * @swagger
 * /api/users/nickname:
 *   put:
 *     summary: 更新用户昵称
 *     tags: [用户]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nickname
 *             properties:
 *               nickname:
 *                 type: string
 *                 description: 新昵称
 *                 example: 新昵称
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 昵称不能为空
 *       401:
 *         description: 未授权
 *       404:
 *         description: 用户未找到
 */
router.put('/nickname', updateNickname);

module.exports = router; 