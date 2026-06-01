# 匿名社交平台 - 分区自治社区

基于 PRD 和技术方案开发的匿名社交平台，支持分区自治、负责人选举、匿名发帖等核心功能。

## 技术栈

| 层级 | 技术 |
|---|---|
| 用户端 App | React Native + TypeScript |
| 后台管理 | React + TypeScript + Ant Design |
| 后端 API | Go + Gin |
| 数据库 | PostgreSQL |
| 缓存 | Redis |
| 实时通信 | WebSocket |

## 项目结构

```
├── app/                    # React Native 用户端
│   ├── src/
│   │   ├── api/           # API 请求封装
│   │   ├── components/    # 公共组件
│   │   ├── navigation/    # 导航配置
│   │   ├── screens/       # 页面
│   │   │   ├── Auth/      # 登录/注册
│   │   │   ├── Home/      # 首页信息流
│   │   │   ├── Category/  # 分区列表
│   │   │   ├── Post/      # 帖子详情
│   │   │   ├── Publish/   # 发布帖子
│   │   │   ├── Message/   # 消息列表
│   │   │   ├── Chat/      # 私聊详情
│   │   │   └── Profile/   # 个人中心
│   │   └── store/         # 状态管理 (Zustand)
│   └── package.json
│
├── admin/                  # React 后台管理端
│   ├── src/
│   │   ├── pages/         # 页面
│   │   ├── components/    # 组件
│   │   └── store/         # 状态管理
│   └── package.json
│
├── server/                 # Go 后端
│   ├── cmd/api/           # 入口
│   ├── internal/
│   │   ├── config/        # 配置 + 数据模型
│   │   ├── middleware/    # 中间件
│   │   ├── pkg/           # 公共包
│   │   └── modules/       # 业务模块
│   │       ├── account/   # 账号认证
│   │       ├── category/  # 分区
│   │       ├── post/      # 帖子
│   │       ├── comment/   # 评论
│   │       ├── like/      # 点赞
│   │       ├── chat/      # 私聊 + WebSocket
│   │       ├── moderation/# 治理
│   │       ├── report/    # 举报
│   │       ├── election/  # 选举
│   │       └── admin/     # 后台管理
│   └── go.mod
│
├── DESIGN.md              # UI 设计文档
├── docker-compose.yml     # Docker 编排
└── .env.example           # 环境变量模板
```

## 快速开始

### 1. 启动基础设施

```bash
docker-compose up -d postgres redis
```

### 2. 启动后端

```bash
cd server
cp ../.env.example .env
go mod download
go run cmd/api/main.go
```

### 3. 启动用户端 App

```bash
cd app
npm install
npm run android  # or npm run ios
```

### 4. 启动后台管理

```bash
cd admin
npm install
npm run dev
```

## API 文档

| 模块 | 基础路径 |
|---|---|
| 认证 | `/api/v1/auth/*` |
| 用户 | `/api/v1/users/*` |
| 分区 | `/api/v1/categories/*` |
| 帖子 | `/api/v1/posts/*` |
| 评论 | `/api/v1/posts/:id/comments` |
| 点赞 | `/api/v1/posts/:id/like` |
| 私聊 | `/api/v1/conversations/*` |
| 治理 | `/api/v1/moderation/*` |
| 举报 | `/api/v1/reports` |
| 选举 | `/api/v1/elections/*` |
| 后台 | `/api/v1/admin/*` |

## 设计文档

UI 设计基于 Google Stitch 生成，详见 [DESIGN.md](./DESIGN.md)。

## 核心功能

- [x] 用户注册/登录（用户名+密码）
- [x] 匿名昵称/头像自动生成
- [x] 分区浏览与发帖
- [x] 帖子信息流（最新/热门）
- [x] 点赞、评论
- [x] 私聊（WebSocket 实时消息）
- [x] 分区负责人/副负责人管理
- [x] 选举系统（报名、投票、结果公示）
- [x] 举报与治理
- [x] 后台管理（用户、分区、帖子、负责人、选举）
# small_du_d
