# nest-td-backend

旅游日记平台后端 API，基于 NestJS 框架开发。

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

- **服务端**: Node.js, NestJS
- **数据库**: MongoDB, Mongoose
- **认证**: JWT (JSON Web Tokens), Passport
- **文件上传**: Multer
- **安全**: bcryptjs
- **API文档**: Swagger/OpenAPI

## 安装与运行

### 前提条件

- Node.js (v14+)
- MongoDB

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

## 项目结构

```
nest-td-backend/
├── src/
│   ├── auth/               # 认证相关功能
│   │   ├── guards/         # 认证守卫
│   │   ├── strategies/     # 认证策略
│   │   ├── auth.module.ts  # 认证模块
│   │   └── auth.service.ts # 认证服务
│   ├── common/             # 通用功能
│   │   ├── decorators/     # 自定义装饰器
│   │   ├── exceptions/     # 异常过滤器
│   │   └── pipes/          # 验证管道
│   ├── config/             # 配置文件
│   ├── users/              # 用户模块
│   │   ├── dto/            # 数据传输对象
│   │   ├── entities/       # 实体定义
│   │   ├── users.controller.ts # 用户控制器
│   │   ├── users.module.ts     # 用户模块
│   │   └── users.service.ts    # 用户服务
│   ├── utils/              # 工具函数
│   ├── app.module.ts       # 主模块
│   └── main.ts             # 入口文件
├── uploads/                # 上传文件存储
│   ├── images/             # 图片存储
│   └── videos/             # 视频存储
├── .env                    # 环境变量
├── package.json            # 项目配置
└── tsconfig.json           # TypeScript配置
```

## API 端点列表

### 用户相关 API

| 方法 | 端点 | 描述 | 权限 |
|------|------|------|------|
| POST | /api/users/register | 用户注册 | 公开 |
| POST | /api/users/login | 用户登录 | 公开 |
| GET | /api/users/profile | 获取用户资料 | 用户 |
| PUT | /api/users/avatar | 更新用户头像 | 用户 |
| PUT | /api/users/nickname | 更新用户昵称 | 用户 | 