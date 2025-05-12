# 旅游日记平台后端 (nest-td-backend)

![版本](https://img.shields.io/badge/version-1.0.0-blue.svg)
![NestJS](https://img.shields.io/badge/NestJS-10.0.0-red.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-8.14.1-green.svg)
![许可证](https://img.shields.io/badge/license-MIT-brightgreen.svg)

## 📝 项目概述

旅游日记平台是一个完整的社交内容创作与分享平台，让用户能够记录、分享和互动他们的旅行体验。该平台包含一个移动端用户系统和一个PC端管理系统。用户可以创建包含文本、图片、视频和位置信息的旅游日记，同时支持点赞、评论、收藏等社交互动功能。管理系统则负责内容审核和用户管理。

### 💡 主要功能

#### 用户系统 (移动端)
- **游记浏览**：瀑布流展示审核通过的游记，支持关键词搜索和附近游记发现
- **游记创建**：支持富文本内容、多图片上传、视频上传和位置标记
- **游记管理**：用户可查看、编辑和删除自己发布的游记
- **游记互动**：支持点赞、评论、回复评论和收藏功能
- **用户管理**：包括注册、登录、个人资料编辑、头像上传等

#### 管理系统 (PC端)
- **内容审核**：管理员可查看待审核游记，进行审核通过或拒绝操作
- **内容管理**：管理员可删除违规内容，查看已审核内容
- **AI辅助审核**：提供AI自动审核建议，辅助人工审核决策
- **用户角色管理**：支持不同角色权限控制（普通用户、审核员、管理员）

## 🛠️ 技术栈

- **框架**: [NestJS](https://nestjs.com/) v10.0.0 - 基于Express的Node.js框架
- **数据库**: [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/) v8.14.1 - NoSQL数据库
- **认证**: [JWT](https://jwt.io/) + [Passport](https://www.passportjs.org/) - JSON Web Token认证
- **API文档**: [Swagger/OpenAPI](https://swagger.io/) - API自动文档生成
- **文件存储**: [MinIO](https://min.io/) v8.0.5 - 对象存储服务
- **验证**: [class-validator](https://github.com/typestack/class-validator) v0.14.1 - 请求数据验证
- **安全**: [bcryptjs](https://github.com/dcodeIO/bcrypt.js) v3.0.2 - 密码加密
- **速率限制**: [@nestjs/throttler](https://docs.nestjs.com/security/rate-limiting) v6.4.0 - API请求限流保护

## 🗂️ 数据模型

系统包含以下核心数据模型:

### 1. User (用户)
- `_id`: MongoDB ObjectId
- `username`: 用户名，唯一标识
- `password`: 加密后的密码
- `nickname`: 用户昵称
- `avatar`: 用户头像路径
- `role`: 用户角色，可选值: 'user'(普通用户), 'reviewer'(审核员), 'admin'(管理员)
- `createdAt/updatedAt`: 时间戳

### 2. Diary (游记)
- `_id`: MongoDB ObjectId
- `title`: 游记标题
- `content`: 游记内容
- `images`: 游记图片数组
- `video`: 视频链接(可选)
- `location`: 位置信息，包含位置名称、地址和经纬度
- `author`: 关联到User的引用
- `status`: 游记状态，可选值: 'pending'(待审核), 'approved'(已通过), 'rejected'(已拒绝)
- `rejectReason`: 拒绝原因(可选)
- `approvedAt`: 审核通过时间
- `reviewedBy`: 审核人ID，关联到User
- `likeCount`: 点赞数
- `commentCount`: 评论数
- `favoriteCount`: 收藏数
- `createdAt/updatedAt`: 时间戳

### 3. Comment (评论)
- `_id`: MongoDB ObjectId
- `diary`: 关联到Diary的引用
- `user`: 关联到User的引用
- `content`: 评论内容
- `parentComment`: 关联到父评论的引用(用于回复)
- `likeCount`: 评论点赞数
- `createdAt/updatedAt`: 时间戳

### 4. Like (点赞)
- `_id`: MongoDB ObjectId
- `diary`: 关联到Diary的引用
- `user`: 关联到User的引用
- `createdAt/updatedAt`: 时间戳

### 5. CommentLike (评论点赞)
- `_id`: MongoDB ObjectId
- `comment`: 关联到Comment的引用
- `user`: 关联到User的引用
- `createdAt/updatedAt`: 时间戳

### 6. Favorite (收藏)
- `_id`: MongoDB ObjectId
- `diary`: 关联到Diary的引用
- `user`: 关联到User的引用
- `createdAt/updatedAt`: 时间戳

## 📋 API文档

启动应用后，可通过以下URL访问API文档：
```
http://localhost:3000/api-docs
```

如需获取JSON格式的API文档，可访问：
```
http://localhost:3000/api-json
```

### 🔍 主要API端点

#### 认证与用户

| 方法   | 端点                  | 描述               | 权限要求 |
|--------|----------------------|-------------------|---------|
| POST   | /api/users/register  | 用户注册           | 无      |
| POST   | /api/users/login     | 用户登录           | 无      |
| GET    | /api/users/profile   | 获取用户资料        | 用户    |
| PUT    | /api/users/avatar    | 更新用户头像        | 用户    |
| PUT    | /api/users/nickname  | 更新用户昵称        | 用户    |

#### 游记管理

| 方法   | 端点                            | 描述                      | 权限要求  |
|--------|--------------------------------|--------------------------|----------|
| POST   | /api/diaries                   | 创建新游记                 | 用户      |
| GET    | /api/diaries                   | 获取已批准的游记列表        | 无        |
| GET    | /api/diaries/:id               | 获取游记详情               | 无        |
| PUT    | /api/diaries/:id               | 更新游记                   | 用户(作者) |
| DELETE | /api/diaries/:id               | 删除游记                   | 用户(作者) |
| GET    | /api/diaries/user/me           | 获取当前用户的游记          | 用户      |
| GET    | /api/diaries/search            | 搜索游记                   | 无        |
| GET    | /api/diaries/nearby            | 获取附近的游记              | 无        |
| GET    | /api/diaries/:id/with-status   | 获取游记(含点赞和收藏状态)   | 用户      |

#### 社交互动

| 方法   | 端点                              | 描述                    | 权限要求 |
|--------|---------------------------------|------------------------|---------|
| POST   | /api/diaries/comment            | 添加评论                 | 用户     |
| GET    | /api/diaries/:id/comments       | 获取游记评论              | 无       |
| DELETE | /api/diaries/comment/:id        | 删除评论                 | 用户(作者)|
| POST   | /api/diaries/like               | 点赞/取消点赞游记          | 用户     |
| POST   | /api/diaries/comment/like       | 点赞/取消点赞评论          | 用户     |
| POST   | /api/diaries/favorite           | 收藏/取消收藏游记          | 用户     |
| GET    | /api/diaries/user/favorites     | 获取用户收藏列表           | 用户     |

#### 管理功能

| 方法   | 端点                              | 描述                    | 权限要求      |
|--------|---------------------------------|--------------------------|--------------|
| GET    | /api/admin/diaries/pending      | 获取待审核游记列表         | 管理员/审核员 |
| PUT    | /api/admin/diaries/:id/approve  | 审核通过游记              | 管理员/审核员 |
| PUT    | /api/admin/diaries/:id/reject   | 拒绝游记                  | 管理员/审核员 |
| DELETE | /api/admin/diaries/:id          | 管理员删除游记             | 管理员       |
| GET    | /api/admin/diaries/:id/ai-review| AI辅助审核游记             | 管理员/审核员 |

#### 文件上传

| 方法   | 端点         | 描述       | 权限要求 |
|--------|-------------|-----------|---------|
| POST   | /api/upload | 上传文件    | 用户    |

## 🚀 安装与运行

### 前提条件

- [Node.js](https://nodejs.org/) v14.0.0 或更高版本
- [MongoDB](https://www.mongodb.com/) v4.0.0 或更高版本
- [MinIO](https://min.io/) 服务 (用于文件存储)

### 安装步骤

1. **克隆代码库**
   ```bash
   git clone https://github.com/your-username/nest-td-backend.git
   cd nest-td-backend
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **创建环境配置文件**
   创建 `.env` 文件在项目根目录，内容如下:
   ```
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/travel_diary
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=30d
   
   # MinIO配置
   MINIO_ENDPOINT=localhost
   MINIO_PORT=9000
   MINIO_USE_SSL=false
   MINIO_ACCESS_KEY=your_minio_access_key
   MINIO_SECRET_KEY=your_minio_secret_key
   MINIO_BUCKET=travel-diary
   ```

4. **运行应用**
   ```bash
   # 开发环境
   npm run start:dev
   
   # 或者生产环境
   npm run build
   npm run start:prod
   ```

5. **访问API**
   启动成功后，API服务将运行在 http://localhost:3000/api

## 🏗️ 项目结构

```
nest-td-backend/
├── dist/                  # 编译输出目录
├── src/
│   ├── admin/             # 管理员模块
│   │   ├── dto/           # 数据传输对象
│   │   ├── guards/        # 管理员守卫
│   │   ├── admin.controller.ts
│   │   ├── admin.module.ts
│   │   └── admin.service.ts
│   ├── auth/              # 认证模块
│   │   ├── guards/        # 认证守卫
│   │   ├── strategies/    # 认证策略
│   │   ├── auth.module.ts
│   │   └── auth.service.ts
│   ├── common/            # 通用功能
│   │   ├── decorators/    # 自定义装饰器
│   │   └── services/      # 通用服务
│   ├── config/            # 配置文件
│   │   └── configuration.ts
│   ├── diaries/           # 游记模块
│   │   ├── dto/           # 数据传输对象
│   │   ├── entities/      # 实体定义
│   │   ├── interfaces/    # 接口定义
│   │   ├── diaries.controller.ts
│   │   ├── diaries.module.ts
│   │   └── diaries.service.ts
│   ├── minio/             # MinIO模块
│   │   ├── minio.module.ts
│   │   └── minio.service.ts
│   ├── upload/            # 文件上传模块
│   │   ├── upload.controller.ts
│   │   ├── upload.module.ts
│   │   └── upload.service.ts
│   ├── users/             # 用户模块
│   │   ├── dto/           # 数据传输对象
│   │   ├── entities/      # 实体定义
│   │   ├── users.controller.ts
│   │   ├── users.module.ts
│   │   └── users.service.ts
│   ├── utils/             # 工具函数
│   ├── app.module.ts      # 主模块
│   └── main.ts            # 入口文件
├── .env                   # 环境变量
├── .gitignore             # Git忽略文件
├── package.json           # 项目配置
├── tsconfig.json          # TypeScript配置
└── README.md              # 项目文档
```

## 📊 数据库索引

为了提高查询性能，系统使用了以下索引:

- **Diary**: 在`title`和`content`字段上建立文本索引，用于全文搜索
- **Like**: 在`diary`和`user`字段上建立复合唯一索引，确保用户对同一游记只能点赞一次
- **CommentLike**: 在`comment`和`user`字段上建立复合唯一索引，确保用户对同一评论只能点赞一次
- **Favorite**: 在`diary`和`user`字段上建立复合唯一索引，确保用户对同一游记只能收藏一次
- **Comment**: 在`diary`、`user`和`parentComment`字段上建立索引，加速评论查询

## 🔒 安全特性

- **密码安全**: 使用bcryptjs进行密码加密存储
- **输入验证**: 使用class-validator对所有输入进行验证
- **JWT认证**: 使用JWT进行API认证保护
- **CORS保护**: 配置CORS防止跨站请求伪造
- **请求限流**: 使用ThrottlerModule防止暴力攻击
- **权限控制**: 基于角色的访问控制(RBAC)系统

## 🧪 测试

项目配置了单元测试和端到端测试:

```bash
# 运行单元测试
npm run test

# 运行测试覆盖率报告
npm run test:cov

# 运行端到端测试
npm run test:e2e
```

## 🔄 持续集成/持续部署

项目可以配合CI/CD工具如GitHub Actions、Jenkins或GitLab CI实现自动化部署。

## 📋 其他说明

- 初始管理员账户需要在数据库中手动设置用户的角色为`admin`
- 默认情况下，所有新注册用户的角色为`user`
- 系统支持三种角色:
  - `user`: 普通用户，可以创建和管理自己的内容
  - `reviewer`: 审核员，可以审核内容
  - `admin`: 管理员，拥有所有权限

## 📄 许可证

本项目采用MIT许可证。详情请查看LICENSE文件。

## 👥 贡献

欢迎提交Issue和Pull Request。对于重大变更，请先开Issue讨论您想要改变的内容。

---

*旅游日记平台后端 - 让您的旅行记忆更美好，分享更轻松* 