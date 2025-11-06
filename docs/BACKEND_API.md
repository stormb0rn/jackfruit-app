# 后端技术栈和API端点配置

## 一、核心后端技术栈

### 1. 数据库和后端服务
- **Supabase** (PostgreSQL 数据库 + Edge Functions)
- PostgreSQL 17
- 本地端口：54321 (API), 54322 (数据库), 54323 (Studio)

### 2. 外部AI服务
- **FAL.AI** - nano-banana/edit 模型
- 端点：`https://fal.run/fal-ai/nano-banana/edit`
- 用途：AI图像转换和编辑

### 3. 前端技术栈
- React 19.1.1
- Vite 7.1.7 (构建工具)
- React Native Web 0.21.2 (跨平台)
- React Router DOM 7.9.5 (路由)
- Zustand 5.0.8 (状态管理)

### 4. 运行时环境
- Deno 2 (Edge Functions)
- Node.js (前端构建)

---

## 二、环境变量配置

### 前端环境变量 (.env)
```bash
VITE_FAL_API_KEY=<你的FAL API密钥>
VITE_SUPABASE_URL=<Supabase项目URL>
VITE_SUPABASE_ANON_KEY=<Supabase匿名密钥>
```

### Supabase Edge Functions环境变量 (supabase/.env)
```bash
FAL_API_KEY=<FAL API密钥>
SUPABASE_URL=<Supabase URL>
SUPABASE_SERVICE_ROLE_KEY=<服务角色密钥>
```

---

## 三、主要API端点

### 1. transform-image (单张图片转换)

**端点**: `<supabase-url>/functions/v1/transform-image`
**方法**: POST
**认证**: 需要JWT

**请求体**:
```json
{
  "identityPhotoUrl": "https://...",  // 原始照片URL (必需)
  "lookingType": "better_looking",    // 转换类型 (必需)
  "visualStyle": "realistic",         // 视觉风格 (必需)
  "userId": "user-123",               // 用户ID (可选)
  "identityPhotoId": "photo-456"      // 照片ID (可选)
}
```

**支持的转换类型 (lookingType)**:
- `better_looking` - 更好看
- `japanese_looking` - 日本外观
- `more_male` - 更男性化
- `more_female` - 更女性化
- `white_skinned` - 白皮肤
- `dark_skinned` - 深色皮肤

**支持的视觉风格 (visualStyle)**:
- `realistic` - 写实风格
- `game_render_realistic` - 游戏渲染
- `2d_cartoon` - 2D卡通
- `3d_cartoon` - 3D卡通

**响应**:
```json
{
  "success": true,
  "transformationId": "trans-789",
  "imageUrl": "https://...",
  "description": "转换描述",
  "lookingType": "better_looking",
  "visualStyle": "realistic",
  "prompt": "使用的AI提示词"
}
```

### 2. batch-transform (批量转换)

**端点**: `<supabase-url>/functions/v1/batch-transform`
**方法**: POST
**认证**: 需要JWT

**请求体**:
```json
{
  "identityPhotoUrl": "https://...",    // 原始照片URL (必需)
  "visualStyle": "realistic",           // 视觉风格 (可选，默认realistic)
  "userId": "user-123",                 // 用户ID (可选)
  "identityPhotoId": "photo-456",       // 照片ID (可选)
  "lookingTypes": ["better_looking"]    // 转换类型数组 (可选，默认全部)
}
```

**响应**:
```json
{
  "success": true,
  "summary": {
    "total": 6,
    "completed": 5,
    "failed": 1
  },
  "results": [
    {
      "lookingType": "better_looking",
      "status": "completed",
      "imageUrl": "https://...",
      "transformationId": "trans-123"
    },
    {
      "lookingType": "japanese_looking",
      "status": "failed",
      "error": "错误信息"
    }
  ]
}
```

---

## 四、前端API服务层

### supabaseApi.js
位置: `src/services/supabaseApi.js`

#### 图片转换
```javascript
// 单个转换
const result = await supabaseApi.transformImage(
  photoUrl,      // 照片URL
  lookingType,   // 转换类型
  visualStyle    // 视觉风格
);

// 批量转换
const results = await supabaseApi.batchTransform(
  photoUrl,      // 照片URL
  visualStyle,   // 视觉风格
  lookingTypes   // 转换类型数组 (可选)
);
```

#### 存储管理
```javascript
// 上传身份照片
const result = await supabaseApi.uploadIdentityPhoto(
  file,    // File对象
  userId   // 用户ID (可选，null为匿名)
);
// 返回: { url, filePath, fileName }
```

#### 转换记录
```javascript
// 获取用户转换记录
const transformations = await supabaseApi.getUserTransformations(
  userId,  // 用户ID
  limit    // 限制数量
);

// 获取特定转换
const transformation = await supabaseApi.getTransformation(
  transformationId  // 转换ID
);
```

#### 社交功能
```javascript
// 创建帖子
const post = await supabaseApi.createPost(
  userId,            // 用户ID
  transformationId,  // 转换ID
  caption           // 标题
);

// 获取动态
const posts = await supabaseApi.getFeedPosts(
  limit,   // 限制数量
  offset   // 偏移量
);
```

#### 用户认证
```javascript
// 注册
await supabaseApi.signUp(email, password);

// 登录
await supabaseApi.signIn(email, password);

// 登出
await supabaseApi.signOut();

// 获取当前用户
const user = await supabaseApi.getCurrentUser();
```

### cacheService.js
位置: `src/services/cacheService.js`

```javascript
// 批量生成缓存
const results = await cacheService.batchGenerateCache(
  testImageUrl,   // 测试图片URL
  testImageId,    // 测试图片ID
  config,         // 配置对象
  onProgress      // 进度回调函数
);

// 获取缓存结果
const cachedResults = await cacheService.getCachedResults(
  testImageId  // 测试图片ID
);
// 返回: { looking: {...}, templates: {...} }

// 重新生成单个提示
await cacheService.regeneratePrompt(
  testImageUrl,  // 测试图片URL
  testImageId,   // 测试图片ID
  promptType,    // 'looking' 或 'templates'
  promptId,      // 提示ID
  promptText     // 提示文本
);

// 删除缓存
await cacheService.deleteCacheForTestImage(
  testImageId  // 测试图片ID
);

// 检查是否有缓存
const hasCache = await cacheService.hasCachedResults(
  testImageId  // 测试图片ID
);
```

### falApi.js
位置: `src/services/falApi.js`

```javascript
// 直接编辑图片
const result = await falApi.editImage(
  imageUrl,  // 图片URL
  prompt,    // AI提示词
  options    // 可选配置
);

// 转换角色
const result = await falApi.transformCharacter(
  imageUrl,           // 图片URL
  lookingConfig,      // 外观配置
  visualStyleConfig,  // 视觉风格配置
  options            // 可选配置
);

// 批量转换
const results = await falApi.batchTransform(
  imageUrl,  // 图片URL
  configs,   // 配置数组
  options    // 可选配置
);
```

---

## 五、数据库表结构

### cached_generations (缓存生成表)

```sql
CREATE TABLE cached_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_image_id TEXT NOT NULL,              -- 测试图片ID
  test_image_url TEXT NOT NULL,             -- 测试图片URL
  prompt_type TEXT NOT NULL,                -- 'looking' 或 'templates'
  prompt_id TEXT NOT NULL,                  -- 提示ID
  prompt_text TEXT NOT NULL,                -- 提示文本
  generated_image_url TEXT NOT NULL,        -- 生成的图片URL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 唯一约束：同一测试图片的同一提示只能有一个缓存
  CONSTRAINT unique_test_prompt UNIQUE (test_image_id, prompt_type, prompt_id)
);

-- 索引
CREATE INDEX idx_cached_generations_test_image ON cached_generations(test_image_id);
CREATE INDEX idx_cached_generations_prompt ON cached_generations(prompt_type, prompt_id);
```

**RLS策略**:
- 允许匿名用户读取、插入、更新、删除（因为是测试功能）

### Storage Buckets

#### identity-photos (身份照片存储桶)
- **公开访问**: 是
- **文件大小限制**: 50MB
- **允许的MIME类型**: image/jpeg, image/png, image/webp
- **文件夹结构**:
  - `{userId}/` - 用户个人照片
  - `anonymous/` - 匿名用户照片
  - `anonymous/test-images/` - 测试图片

**RLS策略**:
- 用户可以上传、查看、删除自己的照片
- 任何人可以上传、查看、删除 `anonymous/` 文件夹中的文件

#### transformations (转换结果存储桶)
- **公开访问**: 否
- **文件大小限制**: 50MB
- **允许的MIME类型**: image/jpeg, image/png, image/webp
- **文件夹结构**:
  - `{userId}/` - 用户转换结果
  - `public/` - 公开转换结果

**RLS策略**:
- 用户可以上传、查看自己的转换结果
- 任何人可以查看 `public/` 文件夹中的文件

### 其他预期表结构

#### identity_photos (身份照片表)
```sql
CREATE TABLE identity_photos (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  photo_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### transformations (转换记录表)
```sql
CREATE TABLE transformations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  identity_photo_id UUID REFERENCES identity_photos(id),
  looking_type TEXT NOT NULL,
  visual_style TEXT NOT NULL,
  prompt TEXT NOT NULL,
  status TEXT NOT NULL, -- 'processing', 'completed', 'failed'
  result_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### posts (帖子表)
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  transformation_id UUID REFERENCES transformations(id),
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 六、配置文件系统

### transformation_prompts.json
位置: `src/config/transformation_prompts.json`

包含两个主要部分：

#### looking (外观转换配置)
6种外观转换选项：
- `better_looking` - 更好看
- `japanese_looking` - 日本外观
- `more_male` - 更男性化
- `more_female` - 更女性化
- `white_skinned` - 白皮肤
- `dark_skinned` - 深色皮肤

#### visual_style (视觉风格配置)
4种视觉风格选项：
- `realistic` - 写实风格
- `game_render_realistic` - 游戏渲染写实
- `2d_cartoon` - 2D卡通
- `3d_cartoon` - 3D卡通

### style_templates.json
位置: `src/config/style_templates.json`

14种风格模板：
- `camera_lens` - 相机镜头
- `cinematic` - 电影感
- `classy` - 优雅
- `creative` - 创意
- `daily` - 日常
- `edgy` - 前卫
- `editorial` - 时尚编辑
- `funny` - 有趣
- `retro_vintage` - 复古
- `cool` - 酷
- `cute` - 可爱
- `hot` - 性感
- `vintage` - 怀旧
- `y2k` - Y2K风格

### configLoader.js
位置: `src/utils/configLoader.js`

提供的工具方法：

```javascript
// 获取所有外观选项
const lookingOptions = configLoader.getLookingOptions();

// 获取所有视觉风格选项
const visualStyles = configLoader.getVisualStyleOptions();

// 根据ID获取外观配置
const looking = configLoader.getLookingById('better_looking');

// 根据ID获取视觉风格配置
const style = configLoader.getVisualStyleById('realistic');

// 获取所有风格模板
const templates = configLoader.getStyleTemplates();

// 根据ID获取风格模板
const template = configLoader.getStyleTemplateById('classy');

// 构建基础提示词
const prompt = configLoader.buildPrompt('better_looking', 'realistic');

// 构建完整提示词（包含风格模板）
const fullPrompt = configLoader.buildCompletePrompt(
  'better_looking',
  'realistic',
  'classy'
);
```

---

## 七、API调用流程

### 典型的图片转换流程

#### 1. 用户上传照片
```
前端
  ↓ supabaseApi.uploadIdentityPhoto(file, userId)
Supabase Storage (identity-photos bucket)
  ↓
返回公开URL
```

#### 2. 单个转换
```
前端
  ↓ supabaseApi.transformImage(url, lookingType, visualStyle)
Supabase Edge Function (transform-image)
  ↓ 构建AI提示词
FAL.AI API (nano-banana/edit)
  ↓ 生成图片
保存转换记录到数据库
  ↓
返回生成的图片URL
```

#### 3. 批量转换
```
前端
  ↓ supabaseApi.batchTransform(url, visualStyle, lookingTypes)
Supabase Edge Function (batch-transform)
  ↓ 遍历所有lookingTypes
FAL.AI API (顺序调用多次)
  ↓ 生成多张图片
保存所有转换记录
  ↓
返回所有结果
```

#### 4. 缓存生成（管理功能）
```
前端
  ↓ cacheService.batchGenerateCache(url, id, config, onProgress)
遍历所有配置（looking + templates）
  ↓ 对每个配置调用FAL.AI API
FAL.AI API
  ↓ 生成图片
保存到 cached_generations 表
  ↓ 提供进度回调
返回所有结果
```

---

## 八、安全和认证

### 1. 认证方式
- **Supabase Auth** (JWT based)
- 支持匿名访问（无需登录即可使用基本功能）
- Edge Functions通过JWT验证用户身份

### 2. API密钥管理
- **FAL_API_KEY**:
  - 存储在环境变量中
  - 前端通过 `VITE_FAL_API_KEY` 访问
  - Edge Functions通过 `FAL_API_KEY` 访问
  - 不应暴露在客户端代码中（仅在服务端使用）

### 3. 存储安全
- **RLS (Row Level Security)** 已启用
- 用户只能访问自己的资源
- 匿名用户可访问 `anonymous/` 文件夹
- 管理员拥有完整权限

### 4. CORS配置
- Edge Functions允许所有来源 (`Access-Control-Allow-Origin: *`)
- 生产环境建议限制为特定域名

### 5. 最佳实践
- 始终在服务端验证用户输入
- 使用参数化查询防止SQL注入
- 限制文件上传大小和类型
- 实施速率限制防止滥用
- 定期轮换API密钥

---

## 九、部署配置

### 1. 本地开发

**前端开发服务器**:
```bash
npm run dev
# 运行在 http://localhost:5173/
```

**本地Supabase实例**:
```bash
supabase start
# API: http://localhost:54321
# Database: postgresql://postgres:postgres@localhost:54322/postgres
# Studio: http://localhost:54323
# Inbucket: http://localhost:54324
# JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
```

### 2. Edge Functions配置

**配置文件**: `supabase/config.toml`

```toml
[functions]
  enabled = true

[functions.transform-image]
  verify_jwt = true

[functions.batch-transform]
  verify_jwt = true
```

**部署Edge Functions**:
```bash
# 部署单个函数
supabase functions deploy transform-image

# 部署所有函数
supabase functions deploy
```

### 3. 环境变量设置

**生产环境Supabase配置**:
```bash
# 在Supabase Dashboard设置Edge Functions密钥
supabase secrets set FAL_API_KEY=your_fal_api_key
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. 数据库迁移

**应用迁移**:
```bash
# 本地应用迁移
supabase migration up

# 生产环境应用迁移
supabase db push
```

**创建新迁移**:
```bash
supabase migration new migration_name
```

---

## 十、性能优化建议

### 1. 缓存策略
- 使用 `cached_generations` 表存储常用转换结果
- 设置CDN缓存图片资源
- 实施客户端缓存减少重复请求

### 2. 批处理优化
- 批量转换时使用并发控制
- 限制同时进行的API调用数量
- 实施队列系统处理大量请求

### 3. 图片优化
- 压缩上传的图片
- 使用WebP格式减小文件大小
- 实施图片CDN加速访问

### 4. 数据库优化
- 为常用查询添加索引
- 使用数据库连接池
- 定期清理过期数据

---

## 十一、关键文件路径总结

### 服务层
- `src/services/supabaseClient.js` - Supabase客户端初始化
- `src/services/supabaseApi.js` - 主要API接口
- `src/services/falApi.js` - FAL.AI直接调用
- `src/services/cacheService.js` - 缓存服务

### Edge Functions
- `supabase/functions/transform-image/index.ts` - 单个转换函数
- `supabase/functions/batch-transform/index.ts` - 批量转换函数

### 配置文件
- `src/config/transformation_prompts.json` - 转换配置
- `src/config/style_templates.json` - 风格模板配置
- `src/utils/configLoader.js` - 配置加载工具

### 数据库迁移
- `supabase/migrations/20251105214352_storage_buckets.sql` - 存储桶设置
- `supabase/migrations/20251105222752_allow_anonymous_uploads.sql` - 匿名上传权限
- `supabase/migrations/20251106004400_cached_generations.sql` - 缓存表创建
- `supabase/migrations/20251106022900_allow_anonymous_delete.sql` - 匿名删除权限

### 配置
- `supabase/config.toml` - Supabase配置
- `vite.config.js` - Vite构建配置
- `.env.example` - 环境变量示例

---

## 十二、常见问题和解决方案

### Q: 如何处理API速率限制？
**A**:
- 实施客户端请求队列
- 使用指数退避重试策略
- 缓存频繁请求的结果
- 考虑升级API计划

### Q: 如何优化大图片上传？
**A**:
- 在客户端压缩图片
- 使用分片上传大文件
- 实施上传进度显示
- 提供图片裁剪功能

### Q: Edge Functions超时怎么办？
**A**:
- 优化函数执行时间
- 使用异步处理长时间任务
- 实施webhook回调机制
- 考虑使用后台作业队列

### Q: 如何监控API使用情况？
**A**:
- 使用Supabase Dashboard查看统计
- 实施自定义日志记录
- 设置使用量警报
- 定期审查API调用模式

---

**文档更新日期**: 2025-01-06
**版本**: 1.0.0
