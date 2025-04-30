const express = require('express');
const { 
  getPendingDiaries, 
  approveDiary, 
  rejectDiary, 
  deleteDiary,
  getReviewers,
  addReviewer,
  removeReviewer
} = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// 所有路由都需要 JWT 认证和适当的角色
router.use(protect);

/**
 * @swagger
 * /api/admin/diaries/pending:
 *   get:
 *     summary: 获取待审核游记列表
 *     tags: [管理员]
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
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权限
 */
router.get('/diaries/pending', restrictTo('reviewer', 'admin'), getPendingDiaries);

/**
 * @swagger
 * /api/admin/diaries/{id}/approve:
 *   put:
 *     summary: 审核通过游记
 *     tags: [管理员]
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
 *         description: 审核通过成功
 *       400:
 *         description: 游记已审核
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权限
 *       404:
 *         description: 游记未找到
 */
router.put('/diaries/:id/approve', restrictTo('reviewer', 'admin'), approveDiary);

/**
 * @swagger
 * /api/admin/diaries/{id}/reject:
 *   put:
 *     summary: 拒绝游记
 *     tags: [管理员]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rejectReason
 *             properties:
 *               rejectReason:
 *                 type: string
 *                 description: 拒绝原因
 *                 example: 内容不符合规范
 *     responses:
 *       200:
 *         description: 拒绝成功
 *       400:
 *         description: 请提供拒绝原因 或 游记已审核
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权限
 *       404:
 *         description: 游记未找到
 */
router.put('/diaries/:id/reject', restrictTo('reviewer', 'admin'), rejectDiary);

/**
 * @swagger
 * /api/admin/diaries/{id}:
 *   delete:
 *     summary: 管理员删除游记
 *     tags: [管理员]
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
 *         description: 无权限
 *       404:
 *         description: 游记未找到
 */
router.delete('/diaries/:id', restrictTo('reviewer', 'admin'), deleteDiary);

/**
 * @swagger
 * /api/admin/reviewers:
 *   get:
 *     summary: 获取所有审核员列表
 *     tags: [管理员]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权限
 */
router.get('/reviewers', restrictTo('admin'), getReviewers);

/**
 * @swagger
 * /api/admin/reviewers:
 *   post:
 *     summary: 添加审核员
 *     tags: [管理员]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 要添加为审核员的用户ID
 *     responses:
 *       200:
 *         description: 添加成功
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权限
 *       404:
 *         description: 用户未找到
 */
router.post('/reviewers', restrictTo('admin'), addReviewer);

/**
 * @swagger
 * /api/admin/reviewers:
 *   delete:
 *     summary: 移除审核员
 *     tags: [管理员]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 要移除审核员权限的用户ID
 *     responses:
 *       200:
 *         description: 移除成功
 *       400:
 *         description: 此用户不是审核员
 *       401:
 *         description: 未授权
 *       403:
 *         description: 无权限
 *       404:
 *         description: 用户未找到
 */
router.delete('/reviewers', restrictTo('admin'), removeReviewer);

module.exports = router; 