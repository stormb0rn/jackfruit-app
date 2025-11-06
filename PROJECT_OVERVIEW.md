# 项目概览

这是一个名为"LookGen"（也叫"Jackfruit"）的社交媒体应用，主要功能是让用户上传照片，通过AI进行形象转换，然后分享转换后的结果。

## 核心技术栈

**前端框架**：React 19 + React Native Web 0.21

这个项目的特殊之处在于使用了 React Native Web，意味着同一套代码可以同时在网页、iOS和Android上运行。代码里用的是 View、Text、TouchableOpacity 这些 React Native 组件，而不是传统的 HTML DOM 元素。

- **状态管理**：Zustand 5.0（轻量级状态管理库）
- **后端服务**：Supabase（提供数据库、存储、认证）
- **AI服务**：FAL API（用于图像AI转换）
- **构建工具**：Vite 7.1
- **部署平台**：Vercel

## 主要目录结构

```
/Users/jiajun/social-look-app/
├── src/
│   ├── pages/              # 主要页面（7个）
│   │   ├── IdentityUpload.jsx    - 欢迎页和照片上传
│   │   ├── EditLook.jsx          - 选择转换类型（5种）
│   │   ├── Templates.jsx         - 风格模板选择器
│   │   ├── CreatePost.jsx        - 创建多图轮播帖子
│   │   ├── Feed.jsx              - 社交动态流
│   │   ├── Profile.jsx           - 用户资料和统计
│   │   └── ConfigAdmin.jsx       - 管理员配置页
│   │
│   ├── services/           # API和外部服务集成
│   │   ├── supabaseClient.js     - Supabase客户端初始化
│   │   ├── supabaseApi.js        - Supabase API调用（10KB）
│   │   ├── falApi.js             - FAL AI API服务
│   │   └── api.js                - 传统API层（占位）
│   │
│   ├── stores/             # 状态管理
│   │   └── appStore.js           - 全局应用状态
│   │
│   ├── utils/              # 工具函数
│   │   ├── configLoader.js       - 配置加载工具
│   │   └── mobileStyles.js       - 移动端样式辅助
│   │
│   ├── assets/             # 静态资源
│   │   └── style-templates/      - 风格模板图片和配置
│   │
│   ├── config/             # 配置文件
│   │   ├── style_templates.json  - 模板定义和提示词
│   │   └── transformation_prompts.json - 转换提示词
│   │
│   ├── App.jsx             - 根组件（路由）
│   ├── main.jsx            - React Native应用注册
│   ├── App.css             - 应用级样式
│   └── index.css           - 全局样式和iOS优化
│
├── supabase/               # Supabase后端配置
│   ├── config.toml         - Supabase CLI配置
│   ├── migrations/         - 数据库迁移文件（3个）
│   └── functions/          - 边缘函数
│       ├── batch-transform/
│       └── transform-image/
│
├── public/                 # 静态资源
│   ├── admin.html          - 管理员仪表板
│   ├── manifest.json       - PWA清单
│   └── fonts/              - 自定义字体
│
└── dist/                   - 构建输出目录
```

## 页面说明

### 1. IdentityUpload.jsx
欢迎页面，用户上传身份照片

### 2. EditLook.jsx
选择转换类型，提供5个选项：
- 更好看（better-looking）
- 日系风格（japanese）
- 变男性（male）
- 变女性（female）
- 美白（white-skin）

### 3. Templates.jsx
风格模板选择器，网格展示5-10个模板供选择

### 4. CreatePost.jsx
创建帖子页面，支持多图轮播选择和添加文字说明

### 5. Feed.jsx
社交动态流，可滚动浏览、点赞、评论

### 6. Profile.jsx
用户个人资料页，显示统计数据和帖子网格

### 7. ConfigAdmin.jsx
管理员配置界面

## 用户使用流程

```
上传身份照片
    ↓
选择转换类型（5个选项）
    ↓
选择风格模板
    ↓
AI生成转换后的图像（通过FAL API）
    ↓
创建帖子（可选择多张照片）
    ↓
浏览动态流（滚动、点赞、评论）
    ↓
查看个人资料（查看自己的帖子）
```

## 核心状态管理（appStore.js）

使用 Zustand 管理以下全局状态：
- 身份照片和元数据
- 选择的转换类型
- 选择的模板
- 生成的照片数组
- 帖子数组
- 当前用户资料数据
- UI导航状态（currentStep）

## 数据流

```
用户输入图片
  → Zustand Store（存储状态）
  → Supabase Storage（上传存储）
  → FAL API（AI转换处理）
  → 结果存回Zustand并显示
  → 创建帖子
  → Supabase数据库
  → 动态流展示
```

## 移动端优化特性

- **动态视口高度**：使用100dvh适配移动浏览器
- **iOS安全区域支持**：适配刘海屏/Home指示器
- **Webkit优化**：针对iOS的专用优化
- **触摸反馈优化**：禁用点击高亮
- **惯性滚动**：-webkit-overflow-scrolling
- **平台检测**：自适应样式调整
- **触摸目标**：最小44x44px按钮尺寸

## 数据库结构

- **Users表**：用户信息
- **Posts表**：帖子（支持图片轮播）
- **Comments**：评论
- **Likes**：点赞
- **Storage buckets**：图片存储
- **匿名上传支持**：允许未登录用户上传

## 配置文件说明

### package.json
项目依赖和脚本：
- 依赖：React、Zustand、Supabase、React Router
- 脚本：dev、build、lint、preview
- 模块类型：ES modules

### vite.config.js
Vite构建配置：
- React插件启用
- React Native Web别名配置
- 优化的依赖项

### index.html
iOS优化的入口页面：
- iOS视口设置
- PWA清单和图标
- Apple Web App配置
- 自定义字体（Space Mono、Archivo Black、Bebas Neue、Anton）
- iOS安全区域支持

### supabase/config.toml
Supabase本地开发配置：
- 项目ID：social-look-app
- API端口：54321
- 数据库端口：54322
- 公开的Schema：public、graphql_public

### .env / .env.example
环境变量：
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

## 核心服务

### supabaseClient.js
创建Supabase客户端：
- 自动刷新token
- 会话持久化
- 会话检测

### supabaseApi.js
Supabase API操作：
- 照片上传到Storage
- 获取帖子和用户数据
- 认证和会话管理

### falApi.js
FAL AI API集成：
- 图像转换服务
- 批量处理支持
- 多模板支持

## 项目特色

1. **跨平台**：React Native Web，一套代码多端运行（Web/iOS/Android）
2. **AI驱动**：集成FAL API进行智能图像转换
3. **社交功能**：完整的动态流、点赞、评论系统
4. **PWA支持**：可添加到手机主屏幕，离线可用
5. **移动优先**：针对移动端深度优化的UI/UX

## 当前开发状态

根据最近的提交记录：
- ✅ 前端MVP完成（React Native Web）
- ✅ 轮播设计更新
- ✅ Supabase集成改进
- ✅ 模板系统添加
- ✅ 图片选择器修复
- 🔄 后端集成进行中
- 🔄 数据库Schema初始化完成
- 🔄 存储桶配置完成
- 🔄 认证基础设置就绪
- ⏳ 管理员界面待完善
- ✅ AI转换集成（FAL API）
- ✅ 社交功能页面就绪

## 最近修改的文件

- `src/pages/EditLook.jsx` - 最近修改
- `src/pages/Templates.jsx` - 最近修改

## 技术亮点

### React Native Web架构
使用React Native组件而非HTML DOM：
- `View` 代替 `div`
- `Text` 代替 `span`/`p`
- `TouchableOpacity` 代替 `button`
- `StyleSheet.create()` 代替CSS类

### 样式方法
- React Native StyleSheet API
- 全局CSS（index.css）用于iOS优化
- 移动优先响应式设计
- 安全区域支持
- 触摸优化（44x44px最小触摸目标）

### AI/ML集成
- FAL API字符转换
- 可配置的提示词系统
- 批量转换支持
- 多模板支持（camera_lens、cinematic、classy、creative、daily等）

## 文件统计

- 总页面数：7
- 总服务数：4
- 总状态存储：1
- 工具函数：2
- 配置文件：2（风格模板 + 转换提示词）
- Supabase迁移：3
- Supabase函数：2

## 总结

这是一个功能完整的社交图片转换应用，结合了：
- 现代前端技术（React Native Web）
- 云后端服务（Supabase）
- AI能力（FAL API）
- 专为移动端设计
- 支持跨平台部署

应用定位于社交娱乐场景，让用户能够轻松地使用AI技术转换自己的照片，并与朋友分享创意成果。
