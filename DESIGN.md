# 匿名社交平台 - UI 设计文档 V3（浅色主题）

> 配色法则：65% 浅蓝灰 + 20% 白色 + 10% 品牌蓝 + 5% 状态色
> 项目: 匿名社交平台 - 分区自治社区
> 版本: V3 (浅色主题)

---

## 一、设计系统 V3

### 1.1 设计理念
- **匿名、自由、社区自治** — 平台核心精神
- **浅色通透主题** — 浅蓝灰底色 + 白色卡片，干净清爽
- **65/20/10/5 配色法则** — 科学的视觉层次分配
- **内容优先** — 充足的留白，不抢夺内容注意力

### 1.2 配色法则

```
┌─────────────────────────────────────────────────────────────┐
│  ████████████████████████████████████████████  65% 浅蓝灰   │  页面底色、背景、留白
│  ██                                          ██             │
│  ██  ┌────────────────────────────────┐    ██  20% 白色     │  卡片、弹窗、输入框
│  ██  │                                │    ██               │
│  ██  │    [蓝色按钮]  [选中态]        │    ██  10% 品牌蓝   │  按钮、选中态、链接
│  ██  │                                │    ██               │
│  ██  │    绿●  黄●  红●  紫●          │    ██  5% 状态色    │  状态标签
│  ██  └────────────────────────────────┘    ██               │
│  ████████████████████████████████████████████               │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 色彩体系

#### 基础色（65% + 20%）

| Token | 色值 | 占比 | 用途 |
|---|---|---|---|
| `pageBg` | `#F1F5F9` | 65% | 页面主背景、底色、留白 |
| `cardBg` | `#FFFFFF` | 20% | 卡片、弹窗、列表项、输入框 |
| `hoverBg` | `#F8FAFC` | — | hover态背景 |
| `pressedBg` | `#E2E8F0` | — | 按压态背景 |

#### 品牌色（10%）

| Token | 色值 | 用途 |
|---|---|---|
| `brand` | `#3B82F6` | 主按钮、选中态、链接、强调 |
| `brandLight` | `#60A5FA` | hover态 |
| `brandDark` | `#2563EB` | pressed态 |
| `brandBg` | `#EFF6FF` | 品牌浅色背景（标签、徽章） |

#### 文字色

| Token | 色值 | 用途 |
|---|---|---|
| `textPrimary` | `#1E293B` | 标题、正文（slate-800） |
| `textSecondary` | `#64748B` | 辅助文字、描述（slate-500） |
| `textTertiary` | `#94A3B8` | 时间戳、placeholder（slate-400） |
| `textInverse` | `#FFFFFF` | 按钮上的白字 |
| `textLink` | `#3B82F6` | 链接文字 |

#### 边框与分割线

| Token | 色值 | 用途 |
|---|---|---|
| `border` | `#E2E8F0` | 卡片边框、分隔线（slate-200） |
| `borderFocus` | `#3B82F6` | 输入框聚焦边框 |

#### 状态色（5%）

| Token | 色值 | 用途 |
|---|---|---|
| `success` | `#22C55E` | 成功、正常 |
| `warning` | `#F59E0B` | 警告、禁言 |
| `error` | `#EF4444` | 错误、删除、封禁 |
| `info` | `#8B5CF6` | 信息、进行中 |

#### 分区色彩

| 分区 | 色值 | 浅色背景 |
|---|---|---|
| 游戏 | `#8B5CF6` | `rgba(139,92,246,0.1)` |
| 情感 | `#EC4899` | `rgba(236,72,153,0.1)` |
| 校园 | `#14B8A6` | `rgba(20,184,166,0.1)` |
| 职场 | `#F59E0B` | `rgba(245,158,11,0.1)` |
| 兴趣 | `#10B981` | `rgba(16,185,129,0.1)` |
| 生活 | `#3B82F6` | `rgba(59,130,246,0.1)` |

### 1.4 字体系统

| 层级 | 字体 | 大小 | 字重 | 行高 | 颜色 | 用途 |
|---|---|---|---|---|---|---|
| Display | Inter | 28px | 700 | 1.2 | textPrimary | 平台名称 |
| Headline | Inter | 22px | 600 | 1.3 | textPrimary | 页面标题 |
| Title | Inter | 17px | 600 | 1.4 | textPrimary | 昵称、卡片标题 |
| Body | Inter | 16px | 400 | 1.6 | textPrimary | 帖子正文 |
| Body Small | Inter | 14px | 400 | 1.5 | textPrimary | 评论、描述 |
| Caption | Inter | 13px | 400 | 1.4 | textSecondary | 辅助信息 |
| Overline | Inter | 11px | 500 | 1.2 | textSecondary | 标签、徽章 |

### 1.5 圆角系统

| Token | 值 | 用途 |
|---|---|---|
| `radiusSm` | 6px | 小标签、徽章 |
| `radiusMd` | 12px | 按钮、输入框 |
| `radiusLg` | 16px | 卡片、列表项 |
| `radiusXl` | 20px | 弹窗、大容器 |
| `radiusFull` | 9999px | Pill、头像 |

### 1.6 阴影系统

```
shadow-card: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)
shadow-float: 0 4px 12px rgba(0,0,0,0.08)
shadow-modal: 0 8px 24px rgba(0,0,0,0.12)
```

---

## 二、全局组件规范

### 2.1 匿名头像

- **形状**: 圆形
- **样式**: 
  - 白底圆形 + 彩色首字母（font-weight 700）
  - 或彩色圆点背景 + 白色字母
- **尺寸**: 36px(列表) / 44px(帖子) / 88px(个人中心)
- **颜色池**: 使用分区色系

### 2.2 帖子卡片

- **背景**: cardBg (#FFFFFF)
- **边框**: 1px solid border (#E2E8F0)
- **圆角**: radiusLg (16px)
- **阴影**: shadow-card
- **内边距**: 16px
- **外边距**: 12px (左右) / 12px (上下)
- **结构**:
  1. 头部: 头像 + 昵称(Title) + 时间(Caption)
  2. 内容: 文字(Body)，最多5行
  3. 图片: 单图(全宽, 280px) / 多图(2-3列, gap 6px)
  4. 底部: 分区标签(彩色pill) + 点赞/评论/分享

### 2.3 按钮

**主按钮**
- 背景: brand (#3B82F6)
- 文字: textInverse (#FFFFFF), 15px, font-weight 600
- 圆角: radiusMd (12px)
- 高度: 48px
- Hover: brandLight (#60A5FA)
- Pressed: brandDark (#2563EB), scale(0.97)

**次按钮**
- 背景: cardBg (#FFFFFF)
- 文字: textPrimary
- 边框: 1px solid border
- 圆角: 12px

**文字按钮**
- 背景: transparent
- 文字: textLink (#3B82F6)

### 2.4 输入框

- 背景: cardBg (#FFFFFF)
- 边框: 1px solid border (#E2E8F0)
- 圆角: 12px
- 内边距: 14px 16px
- 文字: textPrimary
- placeholder: textTertiary
- 聚焦: borderColor brand, shadow `0 0 0 3px rgba(59,130,246,0.1)`

### 2.5 分区标签

- 背景: 分区色 10% 透明度
- 文字: 分区主色
- 圆角: radiusSm (6px)
- 内边距: 4px 12px
- 字体: Overline

### 2.6 Tab 导航

- 背景: cardBg (#FFFFFF)
- 顶部边框: 1px solid border
- 高度: 68px
- 发布按钮: brand蓝色圆形 + 白色加号
- 普通Tab: 未选中 textTertiary / 选中 brand

### 2.7 顶部导航栏

- 背景: cardBg (#FFFFFF)
- 底部边框: 1px solid border
- 高度: 56px
- 标题: textPrimary

---

## 三、页面设计

### 3.1 登录页

```
页面背景: pageBg (#F1F5F9)

Logo区域:
  - 蓝色图标 (brand)
  - "匿名社区" Display textPrimary
  - "自由表达，分区自治" Caption textSecondary

登录卡片:
  - 白底(cardBg), 16px圆角, border, shadow-card
  - 账号输入框
  - 密码输入框
  - 登录按钮 (PrimaryButton)

底部:
  - "还没有账号？立即注册" textLink
```

### 3.2 注册页

```
页面背景: pageBg

顶部导航:
  - 返回箭头 textPrimary
  - "创建账号" Headline

注册卡片:
  - 白底, 16px圆角
  - 账号/密码/确认密码/邀请码输入框
  - 协议勾选
  - 注册按钮
```

### 3.3 首页/信息流

```
页面背景: pageBg

顶部导航:
  - "匿名社区" Title
  - 铃铛图标 textSecondary

分区标签栏:
  - 横向滚动
  - 选中: brand背景, 白字
  - 未选中: pageBg背景, textSecondary字

信息流:
  - 白色帖子卡片列表
  - 间距12px

底部Tab:
  - 白底, 选中brand色
```

### 3.4 帖子详情

```
页面背景: pageBg

帖子卡片:
  - 白底, 16px圆角
  - 作者信息
  - 正文
  - 图片
  - 互动栏(点赞/评论/收藏/分享)
  - 分区标签

评论区:
  - "评论(N)" Title
  - 评论列表(白色卡片)

底部输入栏:
  - 白底, 顶部border
  - 输入框 + 蓝色发送按钮
```

### 3.5 个人中心

```
页面背景: pageBg

用户信息卡片:
  - 白底, 16px圆角
  - 头像 + 昵称 + ID
  - "编辑资料" 次按钮

统计卡片:
  - 3个白色卡片并排
  - 数字 + 标签

功能列表:
  - "我的内容" 标题
  - 白色卡片: 我的帖子/评论/收藏
  - "设置" 标题
  - 白色卡片: 账号安全/隐私/关于
  - "退出登录" error色

底部Tab
```

---

## 四、后台管理端

- 页面背景: #F8FAFC
- 侧边栏: 白色背景
- 卡片: 白色, 16px圆角, shadow-card
- 表格: 白色背景, 行hover #F8FAFC
- 主按钮: brand蓝
- 状态标签: success绿 / warning黄 / error红

---

## 五、动画与交互

- 页面转场: 250ms slide
- 按钮按压: scale(0.97), 100ms
- 卡片按压: scale(0.98)
- 点赞动画: scale 1→1.3→1, 颜色变error红
- 下拉刷新: 弹性回弹
- Toast: 顶部滑入, 2.5s消失

---

## 六、代码颜色常量（React Native）

```typescript
export const colors = {
  // 基础色 (65% + 20%)
  pageBg: '#F1F5F9',
  cardBg: '#FFFFFF',
  hoverBg: '#F8FAFC',
  pressedBg: '#E2E8F0',

  // 品牌色 (10%)
  brand: '#3B82F6',
  brandLight: '#60A5FA',
  brandDark: '#2563EB',
  brandBg: '#EFF6FF',

  // 文字色
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  textLink: '#3B82F6',

  // 边框
  border: '#E2E8F0',
  borderFocus: '#3B82F6',

  // 状态色 (5%)
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#8B5CF6',
};

export const categoryColors = {
  game: { main: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  emotion: { main: '#EC4899', bg: 'rgba(236,72,153,0.1)' },
  campus: { main: '#14B8A6', bg: 'rgba(20,184,166,0.1)' },
  work: { main: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  interest: { main: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  life: { main: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
};
```
