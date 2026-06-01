# 匿名社交平台 — 项目开发状态

> 本文档记录当前项目各模块的实现状态，供后续开发参考。
> 最后更新：2026-06-01

---

## 一、项目概述

| 项目 | 说明 |
|---|---|
| 名称 | 匿名社交平台（分区自治型匿名社区） |
| 用户端 | React Native App |
| 管理后台 | React + Vite Web |
| 后端 | Go + Gin |
| 数据库 | PostgreSQL + Redis |
| 通信 | WebSocket |

---

## 二、目录结构

```
/
├── admin/              # 管理后台（React + Vite）
│   └── src/
│       └── ...
├── app/                # 用户端 App（React Native）
│   └── src/
│       ├── api/        # API 封装
│       ├── components/ # 公共组件
│       ├── navigation/ # 路由导航
│       ├── screens/    # 页面
│       ├── store/      # 状态管理
│       └── theme/      # 主题配置
├── server/             # 后端服务（Go）
│   └── internal/
│       ├── config/     # 配置、数据库模型、迁移
│       ├── middleware/ # JWT、CORS、日志、Recovery
│       ├── pkg/        # 工具包（response、logger）
│       └── modules/    # 业务模块
├── prd.md              # 产品需求文档
├── 技术方案.md         # 技术架构文档
├── 测试用例.md         # 测试计划文档
├── 测试报告_2026-06-01.md  # 测试报告
└── PROJECT_STATUS.md   # 本文档
```

---

## 三、后端 API 实现清单

### 3.1 认证模块 (`/api/v1/auth/*`)

| 方法 | 路径 | 状态 | 说明 |
|---|---|---|---|
| POST | `/auth/register` | ✅ | 注册，自动生成匿名昵称 |
| POST | `/auth/login` | ✅ | 登录，返回 JWT Token |
| POST | `/auth/refresh` | ✅ | 刷新 Token |

### 3.2 用户模块 (`/api/v1/users/*`)

| 方法 | 路径 | 状态 | 说明 |
|---|---|---|---|
| GET | `/users/me` | ✅ | 获取当前用户信息 |
| PUT | `/users/me` | ✅ | 更新用户信息（昵称/头像/bio） |
| PUT | `/users/me/password` | ✅ | 修改密码 |

### 3.3 分区模块 (`/api/v1/categories/*`)

| 方法 | 路径 | 状态 | 说明 |
|---|---|---|---|
| GET | `/categories` | ✅ | 分区列表 |
| GET | `/categories/:id` | ✅ | 分区详情 |
| GET | `/categories/:id/posts` | ✅ | 分区帖子流（游标分页） |
| GET | `/categories/:id/moderators` | ✅ | 分区负责人列表 |

### 3.4 帖子模块 (`/api/v1/posts/*`)

| 方法 | 路径 | 状态 | 说明 |
|---|---|---|---|
| GET | `/posts/feed` | ✅ | 首页信息流（最新/热门） |
| POST | `/posts` | ✅ | 创建帖子 |
| GET | `/posts/:id` | ✅ | 帖子详情（含浏览数自增） |
| DELETE | `/posts/:id` | ✅ | 删除自己的帖子 |
| POST | `/posts/:id/like` | ✅ | 点赞/取消点赞帖子（事务） |
| DELETE | `/posts/:id/like` | ✅ | 取消点赞（同上） |

### 3.5 评论模块 (`/api/v1/posts/:id/comments`, `/api/v1/comments/*`)

| 方法 | 路径 | 状态 | 说明 |
|---|---|---|---|
| GET | `/posts/:id/comments` | ✅ | 评论列表 |
| POST | `/posts/:id/comments` | ✅ | 发表评论 |
| DELETE | `/comments/:id` | ✅ | 删除自己的评论 |

### 3.6 点赞模块 (`/api/v1/posts/:id/like`, `/api/v1/comments/:id/like`)

| 方法 | 路径 | 状态 | 说明 |
|---|---|---|---|
| POST | `/posts/:id/like` | ✅ | 点赞帖子（事务） |
| DELETE | `/posts/:id/like` | ✅ | 取消点赞帖子 |
| POST | `/comments/:id/like` | ✅ | 点赞评论（事务） |
| DELETE | `/comments/:id/like` | ✅ | 取消点赞评论 |

### 3.7 私聊模块 (`/api/v1/conversations/*`, `/ws`)

| 方法 | 路径 | 状态 | 说明 |
|---|---|---|---|
| GET | `/conversations` | ✅ | 会话列表 |
| POST | `/conversations` | ✅ | 创建会话 |
| GET | `/conversations/:id/messages` | ✅ | 消息列表 |
| WS | `/ws?token=xxx` | ✅ | WebSocket 实时消息（JWT 验证） |

### 3.8 举报模块 (`/api/v1/reports/*`)

| 方法 | 路径 | 状态 | 说明 |
|---|---|---|---|
| POST | `/reports` | ✅ | 创建举报 |
| GET | `/reports/my` | ✅ | 获取我的举报记录 |

### 3.9 分区治理模块 (`/api/v1/moderation/*`)

| 方法 | 路径 | 状态 | 说明 |
|---|---|---|---|
| POST | `/moderation/posts/:id/delete` | ✅ | 负责人删帖 |
| POST | `/moderation/comments/:id/delete` | ✅ | 负责人删评论 |
| GET | `/moderation/categories/:id/reports` | ✅ | 本分区举报列表 |
| POST | `/moderation/reports/:id/handle` | ✅ | 处理举报 |
| POST | `/moderation/categories/:id/announcement` | ✅ | 编辑分区公告 |
| POST | `/moderation/categories/:id/rules` | ✅ | 编辑分区规则 |
| GET | `/moderation/logs` | ✅ | 操作日志 |

### 3.10 选举模块 (`/api/v1/elections/*`)

| 方法 | 路径 | 状态 | 说明 |
|---|---|---|---|
| GET | `/elections` | ✅ | 选举列表 |
| GET | `/elections/:id` | ✅ | 选举详情 |
| POST | `/elections/:id/candidates` | ✅ | 报名参选 |
| GET | `/elections/:id/candidates` | ✅ | 候选人列表 |
| POST | `/elections/:id/vote` | ✅ | 投票（事务） |
| GET | `/elections/:id/result` | ✅ | 选举结果 |

### 3.11 后台管理模块 (`/api/v1/admin/*`)

| 方法 | 路径 | 状态 | 说明 |
|---|---|---|---|
| GET | `/admin/users` | ✅ | 用户列表 |
| PATCH | `/admin/users/:id/status` | ✅ | 修改用户状态 |
| GET | `/admin/categories` | ✅ | 分区列表 |
| POST | `/admin/categories` | ✅ | 创建分区 |
| PUT | `/admin/categories/:id` | ✅ | 更新分区 |
| GET | `/admin/posts` | ✅ | 帖子列表 |
| POST | `/admin/posts/:id/delete` | ✅ | 删除帖子 |
| GET | `/admin/moderators` | ✅ | 负责人列表 |
| POST | `/admin/moderators` | ✅ | 任命负责人 |
| DELETE | `/admin/moderators/:id` | ✅ | 撤销负责人 |
| GET | `/admin/elections` | ✅ | 选举列表 |
| POST | `/admin/elections` | ✅ | 创建选举 |
| POST | `/admin/elections/:id/finish` | ✅ | 结束选举并自动任命 |

---

## 四、App 端页面实现清单

### 4.1 导航结构

```
RootNavigator (Stack)
├── Auth (Stack)        # 认证流程
│   ├── LoginScreen
│   └── RegisterScreen
├── Main (Tab)          # 主页面
│   ├── HomeScreen      # 首页（推荐/最新/热门）
│   ├── CategoryScreen  # 分区列表
│   ├── PublishScreen   # 发布帖子
│   ├── MessageScreen   # 消息列表
│   └── ProfileScreen   # 个人中心
├── PostDetail          # 帖子详情
├── ChatDetail          # 聊天详情
├── CategoryDetail      # 分区详情（帖子流/公告/规则/负责人）
├── ModeratorPanel      # 负责人管理面板
└── Election            # 选举列表/详情
```

### 4.2 页面状态

| 页面 | 路径 | 状态 | 说明 |
|---|---|---|---|
| 登录页 | `Auth/LoginScreen` | ✅ | 账号密码登录 |
| 注册页 | `Auth/RegisterScreen` | ✅ | 含协议勾选 |
| 首页 | `Home/HomeScreen` | ✅ | 信息流、Tab切换、分页 |
| 分区列表 | `Category/CategoryScreen` | ✅ | 网格卡片、搜索框 |
| 分区详情 | `Category/CategoryDetailScreen` | ✅ | 帖子流/公告/规则/负责人/管理入口 |
| 管理面板 | `Category/ModeratorPanelScreen` | ✅ | 举报处理/编辑公告/编辑规则 |
| 选举页 | `Category/ElectionScreen` | ✅ | 选举列表/详情/报名/投票 |
| 发布页 | `Publish/PublishScreen` | ✅ | 文字发布（图片为占位UI） |
| 帖子详情 | `Post/PostDetailScreen` | ✅ | 内容/图片/点赞/举报弹窗 |
| 聊天详情 | `Chat/ChatDetailScreen` | ⚠️ | 页面存在但未接入完整API |
| 消息列表 | `Message/MessageScreen` | ⚠️ | 页面存在但未接入完整API |
| 个人中心 | `Profile/ProfileScreen` | ✅ | 信息展示/选举入口/退出登录 |

### 4.3 App 端 API 封装

| API 文件 | 状态 | 说明 |
|---|---|---|
| `api/auth.ts` | ✅ | 登录/注册/刷新/用户信息/修改密码 |
| `api/post.ts` | ✅ | 信息流/帖子详情/创建/删除/点赞 |
| `api/category.ts` | ✅ | 分区列表/详情/帖子/负责人 |
| `api/comment.ts` | ✅ | 评论列表/创建/删除 |
| `api/chat.ts` | ✅ | 会话列表/创建/消息列表 |
| `api/moderation.ts` | ✅ | 删帖/删评论/举报列表/处理/公告/规则/日志 |
| `api/election.ts` | ✅ | 选举列表/详情/报名/候选人/投票/结果 |
| `api/report.ts` | ✅ | 创建举报/我的举报记录 |

---

## 五、数据库模型

| 模型 | 状态 | 说明 |
|---|---|---|
| User | ✅ | 用户表 |
| Category | ✅ | 分区表 |
| Post | ✅ | 帖子表 |
| PostImage | ✅ | 帖子图片表 |
| Comment | ✅ | 评论表 |
| Like | ✅ | 点赞表（含唯一索引） |
| Conversation | ✅ | 会话表 |
| Message | ✅ | 消息表 |
| CategoryModerator | ✅ | 分区负责人表 |
| Election | ✅ | 选举表 |
| ElectionCandidate | ✅ | 候选人表 |
| ElectionVote | ✅ | 投票表（含唯一索引防重复） |
| Report | ✅ | 举报表 |
| ModerationLog | ✅ | 管理操作日志表 |

---

## 六、实现状态矩阵

| 功能 | 后端 | App | 后台Web | 状态 |
|---|---|---|---|---|
| 账号注册/登录 | ✅ | ✅ | — | 可用 |
| 匿名身份修改 | ✅ | ⚠️ | — | 后端可用，App编辑资料按钮未接入 |
| 分区浏览 | ✅ | ✅ | — | 可用 |
| 发文字帖 | ✅ | ✅ | — | 可用 |
| 发图片帖 | ✅ | ⚠️ | — | 后端支持，App端图片选择为占位UI |
| 图片压缩 | ❌ | ❌ | — | 未实现 |
| 会员高清上传 | ❌ | ❌ | — | 未实现 |
| 首页信息流 | ✅ | ✅ | — | 可用 |
| 点赞 | ✅ | ⚠️ | — | 详情页可用，信息流卡片未绑定 |
| 评论 | ✅ | ⚠️ | — | 后端完整，App端UI未接入评论列表和发送 |
| 私聊 | ✅ | ⚠️ | — | 后端完整，App端无"从帖子发起私聊"入口 |
| 举报帖子 | ✅ | ✅ | — | 可用 |
| 举报评论 | ✅ | ❌ | — | 后端支持，App端无评论举报入口 |
| 负责人删帖 | ✅ | ✅ | ✅ | 可用 |
| 负责人删评论 | ✅ | ✅ | ✅ | 可用 |
| 处理举报 | ✅ | ✅ | ✅ | 可用 |
| 编辑公告/规则 | ✅ | ✅ | ✅ | 可用 |
| 选举 | ✅ | ✅ | ✅ | 可用 |
| 通知系统 | ❌ | ❌ | — | 完全未实现 |
| 申诉 | ❌ | ❌ | — | 完全未实现 |
| 会员系统 | ❌ | ❌ | — | 完全未实现 |
| 后台用户管理 | ✅ | — | ⚠️ | 后端API完整，前端页面待开发 |
| 后台分区管理 | ✅ | — | ⚠️ | 同上 |
| 后台帖子管理 | ✅ | — | ⚠️ | 同上 |
| 后台选举管理 | ✅ | — | ⚠️ | 同上 |

---

## 七、待开发清单（优先级排序）

### P1 — 影响核心体验

1. **App 端图片上传**
   - 文件：PublishScreen.tsx
   - 需求：接入 react-native-image-picker，选择图片后上传至对象存储

2. **App 端评论列表展示和发送**
   - 文件：PostDetailScreen.tsx
   - 需求：加载评论列表、渲染评论、绑定发送按钮到 commentAPI.create

3. **App 端信息流点赞绑定**
   - 文件：PostCard.tsx
   - 需求：绑定 onPress 到 postAPI.likePost / unlikePost

4. **从帖子发起私聊入口**
   - 文件：PostDetailScreen.tsx, PostCard.tsx
   - 需求：添加"私聊作者"按钮，调用 chatAPI.createConversation

### P2 — 功能完善

5. **管理后台前端页面**
   - 需求：admin 目录下开发登录页、分区管理、帖子管理、用户管理、选举管理页面

6. **通知系统**
   - 后端：创建 Notification 模型和 API
   - App：添加消息通知列表页面
   - 触发点：删帖通知、评论通知、点赞通知

7. **申诉功能**
   - 后端：创建 Appeal 模型和 API
   - App：在帖子详情或个人中心添加申诉入口

### P3 — 增值功能

8. **会员系统**
   - 后端：VIP 字段、会员权益校验、高清上传限制
   - App：会员标识、高清上传开关、会员引导弹窗

9. **图片压缩**
   - App端：选择图片后压缩再上传
   - 后端：缩略图生成、高清图存储

---

## 八、已知问题

| 问题 | 影响 | 状态 |
|---|---|---|
| generateAvatarURL 返回空字符串 | 新注册用户头像为空 | 依赖前端 Avatar 组件兜底 |
| 后台管理端仅有 API，无前端页面 | 管理员需直接调 API | 待开发 admin 前端 |
| 后台角色只有 0/1 区分，无细分权限 | 无法区分只读/内容/运营管理员 | 已知限制 |

---

## 九、环境变量

复制 `.env.example` 并填写实际值：

```bash
cp .env.example .env
```

关键配置项：

| 变量 | 说明 | 默认值 |
|---|---|---|
| `SERVER_ADDR` | 服务监听地址 | `:8080` |
| `DB_HOST` | 数据库主机 | `localhost` |
| `DB_PORT` | 数据库端口 | `5432` |
| `DB_USER` | 数据库用户 | `postgres` |
| `DB_PASSWORD` | 数据库密码 | `postgres` |
| `DB_NAME` | 数据库名 | `anonymous_community` |
| `REDIS_ADDR` | Redis 地址 | `localhost:6379` |
| `JWT_SECRET` | JWT 密钥 | `your-secret-key-change-in-production` |
| `STORAGE_ENDPOINT` | 对象存储 endpoint | 空 |
| `STORAGE_KEY` | 对象存储 key | 空 |
| `STORAGE_SECRET` | 对象存储 secret | 空 |
```

---

## 十、启动方式

### 后端

```bash
cd server
cp .env.example .env
# 编辑 .env 填入数据库和 Redis 配置
go mod tidy
go run cmd/api/main.go
```

### App

```bash
cd app
npm install
npx react-native run-android  # 或 run-ios
```

### 后台管理（前端页面待开发）

```bash
cd admin
npm install
npm run dev
```

---

## 十一、技术债务

1. WebSocket Token 验证已从硬编码改为 JWT 解析 ✅
2. Vote 票数更新已放入事务 ✅
3. Like 操作已改为事务 ✅
4. 缺少 comment.ts / chat.ts 已补齐 ✅
5. report `/reports/my` 接口已补齐 ✅
6. PostDetailScreen Avatar 导入已补齐 ✅
