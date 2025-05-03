# nest-td-backend

旅游日记平台后端 API，基于 NestJS 框架开发。

## 项目概述

旅游日记平台是一个包含用户系统（移动端）和审核管理系统（PC 站点）的应用。用户可以发布、查看和分享游记，而管理系统则负责对游记进行审核和管理。

### 主要功能

#### 用户系统（移动端）
- 游记列表（首页）：瀑布流展示审核通过的游记，支持搜索
- 我的游记：展示当前用户发布的游记，支持编辑和删除
- 游记发布：支持多图片和单视频上传
- 游记详情：展示完整内容，支持图片滑动和视频播放
- 用户登录/注册：基于用户名和密码，支持头像上传

#### 审核管理系统（PC 站点）
- 审核列表：展示待审核游记，支持审核通过、拒绝和逻辑删除
- 角色管理：分为审核人员和管理员两种角色，管理员拥有所有操作权限

## 技术栈

- **服务端**: Node.js, NestJS
- **数据库**: MongoDB, Mongoose
- **认证**: JWT (JSON Web Tokens), Passport
- **对象存储**: MinIO
- **安全**: bcryptjs
- **API文档**: Swagger/OpenAPI

## 安装与运行

### 前提条件

- Node.js (v14+)
- MongoDB
- MinIO 服务

### 安装步骤

1. 克隆代码库
   ```bash
   git clone https://github.com/your-username/nest-td-backend.git
   cd nest-td-backend
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
   
   # MinIO配置
   MINIO_ENDPOINT=localhost
   MINIO_PORT=9000
   MINIO_ACCESS_KEY=minioadmin
   MINIO_SECRET_KEY=minioadmin
   MINIO_BUCKET=travel-diary
   MINIO_USE_SSL=false
   ```

4. 运行应用
   ```bash
   # 开发环境
   npm run start:dev
   
   # 生产环境
   npm run start:prod
   ```

## API 文档

项目使用 Swagger/OpenAPI 自动生成API文档。启动应用后，可通过以下URL访问API文档：
```
http://localhost:3000/api-docs
```

如需获取JSON格式的API文档，可访问：
```
http://localhost:3000/api-json
```

## 项目结构

```
nest-td-backend/
├── src/
│   ├── admin/              # 管理员模块
│   │   ├── dto/            # 数据传输对象
│   │   ├── guards/         # 管理员守卫
│   │   ├── admin.controller.ts
│   │   ├── admin.module.ts
│   │   └── admin.service.ts
│   ├── auth/               # 认证相关功能
│   │   ├── guards/         # 认证守卫
│   │   ├── strategies/     # 认证策略
│   │   ├── auth.module.ts  # 认证模块
│   │   └── auth.service.ts # 认证服务
│   ├── common/             # 通用功能
│   │   ├── decorators/     # 自定义装饰器
│   ├── config/             # 配置文件
│   ├── diaries/            # 游记模块
│   │   ├── dto/            # 数据传输对象
│   │   ├── entities/       # 实体定义
│   │   ├── diaries.controller.ts
│   │   ├── diaries.module.ts
│   │   └── diaries.service.ts
│   ├── minio/              # MinIO模块
│   │   ├── minio.module.ts
│   ├── users/              # 用户模块
│   │   ├── dto/            # 数据传输对象
│   │   ├── entities/       # 实体定义
│   │   ├── users.controller.ts
│   │   ├── users.module.ts
│   │   └── users.service.ts
│   ├── utils/              # 工具函数
│   │   ├── minio.utils.ts  # MinIO工具类
│   ├── app.controller.ts   # 主控制器
│   ├── app.module.ts       # 主模块
│   ├── app.service.ts      # 主服务
│   └── main.ts             # 入口文件
├── .env                    # 环境变量
├── package.json            # 项目配置
└── tsconfig.json           # TypeScript配置
```

## API 端点列表

### 用户相关 API

| 方法 | 端点 | 描述 | 权限 |
|------|------|------|------|
| POST | /users/register | 用户注册 | 公开 |
| POST | /auth/login | 用户登录 | 公开 |
| GET | /users/me | 获取用户资料 | 用户 |
| PUT | /users/avatar | 更新用户头像 | 用户 |
| PUT | /users/nickname | 更新用户昵称 | 用户 |

### 游记相关 API

| 方法 | 端点 | 描述 | 权限 |
|------|------|------|------|
| GET | /diaries | 获取已批准的游记列表 | 公开 |
| GET | /diaries/:id | 获取游记详情 | 公开 |
| POST | /diaries | 创建新游记 | 用户 |
| PUT | /diaries/:id | 更新游记 | 用户 |
| DELETE | /diaries/:id | 删除游记 | 用户 |
| GET | /diaries/user/me | 获取当前用户的游记 | 用户 |

### 管理员相关 API

| 方法 | 端点 | 描述 | 权限 |
|------|------|------|------|
| GET | /admin/diaries/pending | 获取待审核游记列表 | 审核员/管理员 |
| PUT | /admin/diaries/:id/approve | 审核通过游记 | 审核员/管理员 |
| PUT | /admin/diaries/:id/reject | 拒绝游记 | 审核员/管理员 |
| DELETE | /admin/diaries/:id | 管理员删除游记 | 管理员 |

## 关于数据库

本项目使用MongoDB作为数据库，主要包含以下集合：
- users: 存储用户信息
- diaries: 存储游记信息

用户角色分为三种：
- user: 普通用户
- reviewer: 审核员
- admin: 管理员

管理员和审核员的添加需要在数据库中直接修改用户的role字段。 