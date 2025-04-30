# td-backend

旅游日记平台后端 API，基于 Node.js 和 Express 框架开发。

## 项目概述

旅游日记平台是一个包含用户系统（移动端）和审核管理系统（PC 站点）的应用。用户可以发布、查看和分享游记，而管理系统则负责对游记进行审核和管理。

### 主要功能

#### 用户系统（移动端）
- 游记列表（首页）：瀑布流展示审核通过的游记，支持搜索
- 我的游记：展示当前用户发布的游记，支持编辑和删除
- 游记发布：支持多图片和单视频上传，支持定位功能
- 游记详情：展示完整内容，支持图片滑动和视频播放
- 用户登录/注册：基于用户名和密码，支持头像上传

#### 审核管理系统（PC 站点）
- 审核列表：展示待审核游记，支持审核通过、拒绝和逻辑删除
- 角色管理：分为审核人员和管理员两种角色，管理员拥有所有操作权限

## 技术栈

- **服务端**: Node.js, Express
- **数据库**: MongoDB, Mongoose
- **认证**: JWT (JSON Web Tokens)
- **文件上传**: Multer
- **安全**: Helmet, bcryptjs
- **API文档**: Swagger/OpenAPI

## API 端点列表

### 用户相关 API

| 方法 | 端点 | 描述 | 权限 |
|------|------|------|------|
| POST | /api/users/register | 用户注册 | 公开 |
| POST | /api/users/login | 用户登录 | 公开 |
| GET | /api/users/profile | 获取用户资料 | 用户 |
| PUT | /api/users/avatar | 更新用户头像 | 用户 |
| PUT | /api/users/nickname | 更新用户昵称 | 用户 |

### 游记相关 API

| 方法 | 端点 | 描述 | 权限 |
|------|------|------|------|
| GET | /api/diaries | 获取已批准的游记列表 | 公开 |
| GET | /api/diaries/:id | 获取游记详情 | 公开 |
| POST | /api/diaries | 创建新游记 | 用户 |
| GET | /api/diaries/user/me | 获取当前用户的游记 | 用户 |
| PUT | /api/diaries/:id | 更新游记 | 用户(作者) |
| DELETE | /api/diaries/:id | 删除游记 | 用户(作者) |

### 管理员 API

| 方法 | 端点 | 描述 | 权限 |
|------|------|------|------|
| GET | /api/admin/diaries/pending | 获取待审核游记 | 审核员/管理员 |
| PUT | /api/admin/diaries/:id/approve | 通过游记 | 审核员/管理员 |
| PUT | /api/admin/diaries/:id/reject | 拒绝游记 | 审核员/管理员 |
| DELETE | /api/admin/diaries/:id | 删除游记 | 审核员/管理员 |
| GET | /api/admin/reviewers | 获取审核员列表 | 管理员 |
| POST | /api/admin/reviewers | 添加审核员 | 管理员 |
| DELETE | /api/admin/reviewers | 移除审核员 | 管理员 |

## 安装与运行

### 前提条件

- Node.js (v14+)
- MongoDB

### 安装步骤

1. 克隆代码库
   ```bash
   git clone https://github.com/your-username/td-backend.git
   cd td-backend
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 创建 `.env` 文件
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/travel_diary
   JWT_SECRET=travel_diary_secret_key_123456
   NODE_ENV=development
   ```

4. 运行应用
   ```bash
   # 开发环境
   npm run dev
   
   # 生产环境
   npm start
   ```

## API 文档

项目使用 Swagger/OpenAPI 自动生成API文档，文档通过代码注释维护。

### API文档管理规范

**重要提示**：所有API接口更改必须同步更新Swagger注释！

开发者须知：
1. **添加新接口**：必须在路由文件中添加完整的Swagger JSDoc注释
2. **修改现有接口**：更新相应的Swagger注释，确保参数和响应格式一致
3. **提交前检查**：确保API文档中正确显示了所有更改
4. **协作开发**：使用共享的API文档作为团队接口规范参考

示例（添加新接口时）：
```javascript
/**
 * @swagger
 * /api/your-new-endpoint:
 *   post:
 *     summary: 新接口说明
 *     tags: [分类标签]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               propertyName:
 *                 type: string
 *     responses:
 *       200:
 *         description: 成功响应
 */
router.post('/your-new-endpoint', yourController);
```

### 访问 API 文档

启动应用后，可通过以下URL访问API文档：
```
http://localhost:3000/api-docs
```

### 导入到 Apifox

可以通过以下URL获取OpenAPI规范JSON文件：
```
http://localhost:3000/swagger.json
```

然后按以下步骤导入Apifox：
1. 打开 Apifox
2. 点击导入 -> 从URL导入
3. 输入URL: http://localhost:3000/swagger.json
4. 选择文件格式: OpenAPI
5. 点击导入

## 项目结构

```
td-backend/
├── public/             # 静态文件
├── src/
│   ├── config/         # 配置文件
│   │   ├── config.js   # 主配置文件
│   │   ├── db.js       # 数据库配置
│   │   └── swagger.js  # Swagger文档配置
│   ├── controllers/    # 控制器
│   ├── middleware/     # 中间件
│   ├── models/         # 数据模型
│   ├── routes/         # 路由
│   └── utils/          # 工具函数
├── uploads/            # 上传文件存储
│   ├── images/         # 图片存储
│   └── videos/         # 视频存储
├── .env                # 环境变量
├── index.js            # 入口文件
└── package.json        # 项目配置
```

## 待实现功能

1. 大模型 API 集成用于内容审查
2. 图片压缩和处理
3. 基于地理位置的搜索优化
4. 社交媒体分享功能

