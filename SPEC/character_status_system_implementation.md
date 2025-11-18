# Character Status System - 完整实现方案

## 文档版本

- **版本**: v1.0
- **创建日期**: 2025-01-12
- **状态**: 待确认

---

## 1. 项目概述

### 1.1 目标

开发一个 AI 角色多状态展示系统，包含：

- **统一管理后台**：管理 LookGen 和 Character Status 两个 Demo 系统
- **用户端应用**：展示 AI 角色的多个实时状态，支持 Mood 切换

### 1.2 技术栈

#### 后端

- **数据库**: Supabase PostgreSQL
- **存储**: Supabase Storage
- **Edge Functions**: Deno (Supabase Functions)
- **AI 服务**:
  - Gemini API (文本生成)
  - FAL AI SeeDrawm v4 Edit (图片生成) https://fal.ai/models/fal-ai/bytedance/seedream/v4/edit/llms.txt
  - FAL AI SeeDance v1 Pro (视频生成)https://fal.ai/models/fal-ai/bytedance/seedance/v1/pro/image-to-video/llms.txt

#### 前端

- **框架**: React 18 + Vite
- **UI 组件库**: Ant Design 5.x
- **状态管理**: React useState (后续可升级 Zustand)
- **动画库**: Framer Motion
- **路由**: React Router v6

---

## 2. 项目结构

```
social-look-app/
├── src/                           # 现有 LookGen 用户端（保留）
│
├── admin-app/                     # 🆕 统一管理后台
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx              # 统计首页
│   │   │   ├── AdminLayout.jsx            # 布局框架
│   │   │   ├── lookgen/                   # LookGen 管理
│   │   │   │   ├── Transformations.jsx
│   │   │   │   └── StyleTemplates.jsx
│   │   │   └── character-status/          # Character Status 管理
│   │   │       ├── Characters.jsx         # P1: 角色管理
│   │   │       ├── CharactersList.jsx     # 角色列表
│   │   │       ├── Assets.jsx             # P4: 资产库
│   │   │       ├── Prompts.jsx            # P3: 提示词
│   │   │       ├── Statuses.jsx           # P2: 状态编辑器
│   │   │       └── StatusesList.jsx       # 状态列表
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AdminLayout.jsx
│   │   │   │   └── NavMenu.jsx
│   │   │   └── shared/
│   │   │       ├── VideoUploadWithProgress.jsx
│   │   │       ├── VideoList.jsx          # 支持拖拽重排
│   │   │       └── AIGenerateButton.jsx
│   │   ├── services/
│   │   │   ├── supabaseClient.js
│   │   │   ├── characterService.js
│   │   │   ├── statusService.js
│   │   │   └── uploadService.js
│   │   ├── hooks/
│   │   │   ├── useSupabaseUpload.js
│   │   │   └── useVideoValidation.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── .env
│
├── character-app/                  # 🆕 Character Status 用户端
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   │   └── CharacterView.jsx
│   │   ├── components/
│   │   │   ├── VideoPlayer.jsx
│   │   │   ├── MoodSelector.jsx
│   │   │   ├── OverlayPanel.jsx
│   │   │   └── ComingSoon.jsx         # 占位页面
│   │   ├── services/
│   │   │   └── supabaseClient.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   └── 20251112_character_status_system.sql
│   └── functions/
│       ├── generate-text-content/        # Step 1: Gemini
│       ├── generate-starting-image/      # Step 2: FAL SeeDrawm
│       └── generate-single-video/        # Step 3: FAL SeeDance
│
└── package.json
```

---

## 3. 数据库设计

### 3.1 表结构

```sql
-- 1. AI Characters 表
CREATE TABLE ai_characters (
  character_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  avatar_url TEXT NOT NULL,  -- Avatar 图片（用于生成首帧图）
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Character Assets 表（全局资产库）
CREATE TABLE character_assets (
  asset_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('服饰', '地点', '道具', '其他')),
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. System Prompts 表（独立于 transformation_prompts）
CREATE TABLE system_prompts (
  prompt_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prompt_name TEXT NOT NULL,
  prompt_type TEXT NOT NULL CHECK (prompt_type IN ('video_generation', 'image_generation', 'text_generation')),
  prompt_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Character Statuses 表（核心）
CREATE TABLE character_statuses (
  status_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID NOT NULL REFERENCES ai_characters(character_id) ON DELETE CASCADE,

  -- 基础信息
  title TEXT NOT NULL,
  mood TEXT NOT NULL,
  status_description TEXT,

  -- 生成步骤追踪
  generation_step INTEGER DEFAULT 0 CHECK (generation_step IN (0, 1, 2, 3)),
    -- 0: 仅基础信息
    -- 1: Step 1 完成（文本内容已生成）
    -- 2: Step 2 完成（首帧图已生成）
    -- 3: Step 3 完成（至少生成了一个视频）

  generation_status TEXT DEFAULT 'draft' CHECK (generation_status IN ('draft', 'generating', 'completed', 'failed')),

  -- 关联资产
  selected_asset_ids UUID[] DEFAULT '{}',

  -- Step 1: Gemini 生成的内容
  video_scenes TEXT[] DEFAULT '{}',  -- 视频场景描述列表
  overlays_content JSONB DEFAULT '{}',  -- {"now": "...", "health": "..."}
  suggestions_list TEXT[] DEFAULT '{}',

  -- Step 2: FAL SeeDrawm 生成的内容
  starting_image_url TEXT,

  -- Step 3: FAL SeeDance 生成的内容
  videos_playlist JSONB DEFAULT '[]',
    -- [{"url": "...", "prompt": "...", "duration": 3, "order": 0}]

  -- 元数据
  is_default BOOLEAN DEFAULT FALSE,  -- 是否为默认 Status
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_statuses_character ON character_statuses(character_id);
CREATE INDEX idx_statuses_default ON character_statuses(character_id, is_default);

-- 5. Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('character-avatars', 'character-avatars', true),
  ('character-videos', 'character-videos', true),
  ('character-assets', 'character-assets', true);

-- Storage 权限策略
CREATE POLICY "Allow public upload avatars" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'character-avatars');

CREATE POLICY "Allow public read avatars" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'character-avatars');

CREATE POLICY "Allow public upload videos" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'character-videos');

CREATE POLICY "Allow public read videos" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'character-videos');
```

---

## 4. Edge Functions 设计

### 4.1 环境变量配置

```bash
# supabase/functions/.env
GEMINI_API_KEY=your_gemini_api_key
FAL_API_KEY=your_fal_api_key
```

### 4.2 Function 1: generate-text-content

**功能**: 使用 Gemini API 生成文本内容

**输入**:

```json
{
  "status_description": "Alex 刚做完 1 小时普拉提...",
  "mood": "Tired",
  "num_video_scenes": 3
}
```

**输出**:

```json
{
  "success": true,
  "data": {
    "overlays": {
      "now": "现在是下午 3:45，刚结束训练",
      "health": "心率 145 bpm，消耗 320 卡路里"
    },
    "suggestions": [
      "Get lunch and hydrate",
      "Take a shower and rest",
      "Walk around to cool down"
    ],
    "video_scenes": [
      "Alex wiping sweat after intense workout",
      "Alex drinking water in the gym",
      "Alex stretching tired muscles on yoga mat"
    ]
  }
}
```

**API 调用**:

- Gemini Pro API
- Temperature: 0.8
- 生成时间: ~5 秒

### 4.3 Function 2: generate-starting-image

**功能**: 使用 FAL SeeDrawm v4 Edit 生成首帧图

**输入**:

```json
{
  "character_avatar_url": "https://...",
  "scene_prompt": "Alex wiping sweat after workout",
  "mood": "Tired"
}
```

**输出**:

```json
{
  "success": true,
  "data": {
    "image_url": "https://supabase.storage/.../starting-image.jpg",
    "original_fal_url": "https://fal.ai/..."
  }
}
```

**API 调用**:

- FAL SeeDrawm v4 Edit: `https://fal.run/fal-ai/bytedance/seedream/v4/edit`
- 参数:
  - `image_url`: Character avatar
  - `prompt`: scene_prompt + mood
  - `image_size`: "portrait_9_16"
  - `num_inference_steps`: 28
  - `guidance_scale`: 7.5
- 生成时间: ~10-15 秒
- 成本: ~$0.01/次

**处理流程**:

1. 调用 FAL API 生成图片
2. 下载生成的图片
3. 上传到 Supabase Storage
4. 返回 public URL

### 4.4 Function 3: generate-single-video

**功能**: 使用 FAL SeeDance v1 Pro 生成单个视频

**输入**:

```json
{
  "starting_image_url": "https://...",
  "scene_prompt": "Alex wiping sweat after workout",
  "mood": "Tired",
  "character_id": "uuid",
  "video_duration": 3
}
```

**输出**:

```json
{
  "success": true,
  "data": {
    "video_url": "https://supabase.storage/.../video.mp4",
    "scene_prompt": "Alex wiping sweat...",
    "duration": 3,
    "file_size": 15728640,
    "original_fal_url": "https://fal.ai/..."
  }
}
```

**API 调用**:

- FAL SeeDance v1 Pro: `https://fal.run/fal-ai/bytedance/seedance/v1/pro/image-to-video`
- 参数:
  - `image_url`: 首帧图
  - `prompt`: scene_prompt + mood
  - `video_size`: "portrait_9_16"
  - `num_frames`: duration * 30 (默认 90 帧 = 3 秒)
  - `num_inference_steps`: 20
  - `cfg_scale`: 7.0
- 生成时间: ~30-60 秒
- 成本: ~$0.08/3秒

**处理流程**:

1. 调用 FAL API 生成视频
2. 下载生成的视频（可能 10-20 MB）
3. 上传到 Supabase Storage (带进度监控)
4. 返回 public URL

---

## 5. 管理后台设计

### 5.1 导航结构

```
📊 Dashboard (统计首页)
   ├── LookGen 统计
   ├── Character Status 统计
   └── 系统资源使用

📷 LookGen 管理
   ├── 🎭 Transformations (变换配置)
   └── 🎨 Style Templates (模板配置)

🤖 Character Status 管理
   ├── 👤 AI Characters (角色 CRUD)
   ├── 📦 Assets Library (资产库)
   ├── 📝 System Prompts (提示词)
   └── 💫 Character Statuses (状态管理)
```

### 5.2 P1: Characters 管理

**列表页**:

```
+------------------------------------------------------------------+
| AI Characters 管理                          [+ 创建新 Character]  |
+------------------------------------------------------------------+
| Avatar | 名称  | 描述          | Statuses 数 | 操作              |
|--------|-------|---------------|------------|-------------------|
| [img]  | Alex  | 健身爱好者...  | 3          | [查看Statuses]    |
| [img]  | Emma  | 艺术家...      | 2          | [查看Statuses]    |
+------------------------------------------------------------------+
```

**创建/编辑表单**:

- 角色名称 (必填)
- 角色描述 (可选)
- Avatar 图片上传 (必填，用于生成首帧图)
  - 支持格式: JPG, PNG
  - 建议尺寸: 512x512 或更大
  - 自动上传到 `character-avatars` bucket

### 5.3 P4: Assets 管理

**功能**:

- 全局资产库（服饰、地点、道具等）
- 图片上传 + 元数据管理
- 在创建 Status 时可选择关联

**列表页**:

```
+------------------------------------------------------------------+
| Assets Library                                  [+ 上传新 Asset]  |
+------------------------------------------------------------------+
| 预览   | 名称      | 类型 | 使用次数 | 操作                      |
|--------|-----------|------|----------|---------------------------|
| [img]  | 黑色运动服 | 服饰 | 5        | [编辑] [查看使用情况]     |
| [img]  | 健身房    | 地点 | 8        | [编辑] [查看使用情况]     |
+------------------------------------------------------------------+
```

### 5.4 P3: System Prompts 管理

**功能**:

- 管理 Gemini/FAL 的提示词模板
- 支持变量替换（如 `{mood}`, `{description}`）

**表单**:

- Prompt 名称
- Prompt 类型 (video_generation / image_generation / text_generation)
- Prompt 内容 (文本编辑器)

### 5.5 P2: Statuses 管理（核心）

#### 5.5.1 列表页

**路由**: `/admin/character-status/statuses`

```
+------------------------------------------------------------------+
| Character Statuses 管理                                          |
+------------------------------------------------------------------+
| 选择角色: [Alex ▼]                              [+ 创建新 Status] |
+------------------------------------------------------------------+
|
| Alex 的 Statuses (3 个):                                         |
| +--------------------------------------------------------------+ |
| | Title      | Mood   | 步骤    | 视频数 | 默认 | 操作        | |
| |------------|--------|---------|--------|------|-------------| |
| | 刚健完身    | Tired  | ✅ 完成 | 3      | ⭐   | [编辑]      | |
| | 清晨冥想    | Calm   | Step 2  | 0      | -    | [继续] [设为默认] | |
| | 准备派对    | Social | ✅ 完成 | 5      | -    | [编辑] [设为默认] | |
| +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

**功能**:

- 显示所有 Statuses 及其完成状态
- "设为默认" 按钮（一个 Character 只能有一个默认）
- 点击 [编辑] 或 [继续] 进入编辑器

#### 5.5.2 编辑器页面

**路由**: `/admin/character-status/statuses/edit/:statusId`

**页面结构**:

```
+------------------------------------------------------------------+
| 编辑 Status: "刚健完身" (Character: Alex)          [返回列表]    |
+------------------------------------------------------------------+
|
| 📋 基础信息
| +--------------------------------------------------------------+
| | Internal Title:  [刚健完身____________________________]       |
| | Mood:            [Tired________________________________]       |
| | Description:     [________________________________]            |
| |                  [Alex 刚做完 1 小时普拉提，感觉疲惫...]       |
| | (自动保存为 draft，generation_step = 0)                       |
| +--------------------------------------------------------------+
|
| ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
|
| 🤖 Step 1: 生成文本内容                    [✅ 已完成]
| +--------------------------------------------------------------+
| | [🤖 用 Gemini 生成文本内容] (按钮)                            |
| |                                                              |
| | ✅ 生成成功后显示：                                           |
| |                                                              |
| | 📝 图层内容:                                                 |
| |   NOW:    [现在是下午 3:45，刚结束训练] [✏️ 编辑]            |
| |   HEALTH: [心率 145 bpm，消耗 320 卡路里] [✏️ 编辑]          |
| |                                                              |
| | 💡 建议列表:                                                 |
| |   1. [Get lunch and hydrate] [✏️]                            |
| |   2. [Take a shower] [✏️]                                    |
| |   3. [Walk around] [✏️]                                      |
| |   [+ 手动添加建议]                                           |
| |                                                              |
| | 🎬 视频场景描述:                                             |
| |   1. [Alex wiping sweat after workout] [✏️]                  |
| |   2. [Alex drinking water in gym] [✏️]                       |
| |   3. [Alex stretching tired muscles] [✏️]                    |
| |   [+ 手动添加场景]                                           |
| |                                                              |
| | (保存到数据库，generation_step = 1)                           |
| +--------------------------------------------------------------+
|
| ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
|
| 🖼️ Step 2: 生成首帧图                     [✅ 已完成]
| +--------------------------------------------------------------+
| | ⚠️ 需要先完成 Step 1                                         |
| |                                                              |
| | 使用场景: [Alex wiping sweat after workout ▼]                |
| | [🤖 用 FAL SeeDrawm 生成首帧图] (按钮)                        |
| |                                                              |
| | 生成中显示:                                                   |
| | [Spinner] 调用 FAL SeeDrawm API 生成中（约 10-15 秒）...     |
| |                                                              |
| | ✅ 生成成功后显示：                                           |
| | [图片预览 300x450px]                                         |
| | [🔄 重新生成] [📤 手动上传替换]                              |
| |                                                              |
| | (保存到数据库，generation_step = 2)                           |
| +--------------------------------------------------------------+
|
| ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
|
| 🎬 Step 3: 生成视频                        [已生成 3 个视频]
| +--------------------------------------------------------------+
| | ⚠️ 需要先完成 Step 2                                         |
| |                                                              |
| | 已生成的视频列表 (支持拖拽重排):                               |
| | +----------------------------------------------------------+ |
| | | [拖拽] 视频 1: ✅ (3.2s, 15MB)          [预览] [重新生成]  | |
| | |        场景: Alex wiping sweat after workout              | |
| | |        [video player 300px]                               | |
| | +----------------------------------------------------------+ |
| | | [拖拽] 视频 2: ✅ (3.5s, 18MB)          [预览] [重新生成]  | |
| | |        场景: Alex drinking water in gym                   | |
| | +----------------------------------------------------------+ |
| | | [拖拽] 视频 3: ✅ (3.0s, 14MB)          [预览] [重新生成]  | |
| | |        场景: Alex stretching tired muscles                | |
| | +----------------------------------------------------------+ |
| |                                                              |
| | 生成新视频:                                                   |
| | +----------------------------------------------------------+ |
| | | 选择场景 (可多选):                                         | |
| | | [ ] 场景 1: Alex wiping sweat (已生成)                     | |
| | | [x] 场景 2: Alex drinking water (未生成)                   | |
| | | [x] 场景 3: Alex stretching (未生成)                       | |
| | |                                                            | |
| | | 视频时长: [3] 秒 (可调整 2-5 秒)                            | |
| | |                                                            | |
| | | [🤖 批量生成选中的视频 (2个)]                               | |
| | | [📤 或手动上传视频]                                        | |
| | +----------------------------------------------------------+ |
| |                                                              |
| | 批量生成中显示:                                               |
| | +----------------------------------------------------------+ |
| | | 场景 2: Alex drinking water...                            | |
| | | [████████████░░░░░░░░░░] 60% 生成中... (约 30 秒)         | |
| | |                                                            | |
| | | 场景 3: Alex stretching...                                | |
| | | [████████░░░░░░░░░░░░░░] 40% 生成中... (约 30 秒)         | |
| | +----------------------------------------------------------+ |
| |                                                              |
| | 生成失败显示:                                                 |
| | +----------------------------------------------------------+ |
| | | 场景 2: ❌ 生成失败: API timeout                           | |
| | | [🔄 重试]                                                  | |
| | +----------------------------------------------------------+ |
| |                                                              |
| | (每生成一个视频就保存到数据库，generation_step = 3)            |
| +--------------------------------------------------------------+
|
| ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
|
| [💾 标记为完成] (设置 generation_status = 'completed')
+------------------------------------------------------------------+
```

### 5.6 关键功能实现

#### 5.6.1 数据持久化策略

**原则**: 每完成一个 Step，立即保存到数据库

**实现**:

```javascript
// Step 0: 创建初始记录
const handleCreateDraft = async () => {
  const { data, error } = await supabase
    .from('character_statuses')
    .insert({
      character_id: selectedCharacter,
      title: values.title,
      mood: values.mood,
      status_description: values.status_description,
      generation_step: 0,
      generation_status: 'draft'
    })
    .select()
    .single();

  setCurrentStatusId(data.status_id);
};

// Step 1: 保存文本内容
const handleSaveStep1 = async (textContent) => {
  await supabase
    .from('character_statuses')
    .update({
      video_scenes: textContent.video_scenes,
      overlays_content: textContent.overlays,
      suggestions_list: textContent.suggestions,
      generation_step: 1
    })
    .eq('status_id', currentStatusId);
};

// Step 2: 保存首帧图
const handleSaveStep2 = async (imageUrl) => {
  await supabase
    .from('character_statuses')
    .update({
      starting_image_url: imageUrl,
      generation_step: 2
    })
    .eq('status_id', currentStatusId);
};

// Step 3: 追加视频
const handleAppendVideo = async (newVideo) => {
  const { data: current } = await supabase
    .from('character_statuses')
    .select('videos_playlist')
    .eq('status_id', currentStatusId)
    .single();

  const updatedVideos = [
    ...(current.videos_playlist || []),
    newVideo
  ];

  await supabase
    .from('character_statuses')
    .update({
      videos_playlist: updatedVideos,
      generation_step: 3
    })
    .eq('status_id', currentStatusId);
};
```

#### 5.6.2 并行生成视频

**UI 逻辑**:

```javascript
const [generatingVideos, setGeneratingVideos] = useState([]);

const handleBatchGenerate = async (selectedScenes) => {
  // 初始化状态
  const states = selectedScenes.map(scene => ({
    scene,
    status: 'loading',
    progress: 0
  }));
  setGeneratingVideos(states);

  // 并行调用
  const promises = selectedScenes.map((scene, idx) =>
    generateVideo(scene, idx)
  );

  await Promise.allSettled(promises);
};

const generateVideo = async (scene, index) => {
  try {
    const { data, error } = await supabase.functions.invoke(
      'generate-single-video',
      { body: { scene_prompt: scene, ... } }
    );

    if (error) throw error;

    // 更新为成功
    setGeneratingVideos(prev =>
      prev.map((v, i) => i === index
        ? { ...v, status: 'success', data: data.data }
        : v
      )
    );

    // 保存到数据库
    await handleAppendVideo(data.data);

  } catch (error) {
    // 更新为失败
    setGeneratingVideos(prev =>
      prev.map((v, i) => i === index
        ? { ...v, status: 'error', error: error.message }
        : v
      )
    );
  }
};
```

#### 5.6.3 视频拖拽重排

**使用库**: `react-beautiful-dnd` 或 `@dnd-kit/sortable`

```javascript
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const handleDragEnd = async (event) => {
  const { active, over } = event;

  if (active.id !== over.id) {
    const oldIndex = videos.findIndex(v => v.id === active.id);
    const newIndex = videos.findIndex(v => v.id === over.id);

    const reordered = arrayMove(videos, oldIndex, newIndex);
    setVideos(reordered);

    // 保存到数据库
    await supabase
      .from('character_statuses')
      .update({ videos_playlist: reordered })
      .eq('status_id', currentStatusId);
  }
};
```

#### 5.6.4 视频上传校验

**校验规则**:

- 格式: MP4, MOV, WebM
- 文件大小: 最大 50MB
- 比例: 建议 9:16（不强制，但会警告）

```javascript
const validateVideo = async (file) => {
  // 1. 检查文件大小
  if (file.size > 50 * 1024 * 1024) {
    throw new Error('视频文件不能超过 50MB');
  }

  // 2. 检查格式
  const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('仅支持 MP4, MOV, WebM 格式');
  }

  // 3. 检查视频元数据（可选）
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      const { videoWidth, videoHeight, duration } = video;
      const ratio = videoWidth / videoHeight;

      // 9:16 = 0.5625
      if (Math.abs(ratio - 0.5625) > 0.1) {
        message.warning(
          `视频比例为 ${ratio.toFixed(2)}，建议使用 9:16 竖屏视频以获得最佳效果`
        );
      }

      resolve({ videoWidth, videoHeight, duration });
    };

    video.onerror = () => reject(new Error('无法读取视频文件'));
    video.src = URL.createObjectURL(file);
  });
};
```

#### 5.6.5 设置默认 Status

**逻辑**: 一个 Character 只能有一个默认 Status

```javascript
const handleSetDefault = async (statusId, characterId) => {
  try {
    // 1. 清除该 Character 的所有默认标记
    await supabase
      .from('character_statuses')
      .update({ is_default: false })
      .eq('character_id', characterId);

    // 2. 设置新的默认
    await supabase
      .from('character_statuses')
      .update({ is_default: true })
      .eq('status_id', statusId);

    message.success('默认 Status 设置成功！');
    loadStatuses();
  } catch (error) {
    message.error(`设置失败: ${error.message}`);
  }
};
```

---

## 6. 用户端设计

### 6.1 页面路由

- `/character/:characterId` - 展示某个 Character 的默认 Status
- `/character/:characterId?status=:statusId` - 直接展示某个 Status（用于分享）

### 6.2 核心交互流程

```
用户访问 /character/alex
  ↓
加载 Alex 的所有已完成 Statuses (generation_step = 3, status = 'completed')
  ↓
如果有 Statuses:
  - 显示默认 Status (is_default = true)
  - 或显示第一个 Status
  - 播放视频列表（自动循环）
否则:
  - 显示 "Character is coming" 占位页面
```

### 6.3 UI 布局

```
+------------------------------------------------------------------+
| [MOOD: Tired]  <-- 点击展开菜单                                   |
|                                                                  |
|                                                                  |
|                     [ 视频全屏播放 ]                              |
|                     (9:16 竖屏，无控制条)                         |
|                                                                  |
|                                                                  |
| [NOW]      <-- 点击展开/折叠 (默认折叠)                           |
| [HEALTH]   <-- 点击展开/折叠 (默认折叠)                           |
|                                                                  |
| [ Get lunch... ]  [ Take a shower... ]  [ Walk around... ]       |
|                                                                  |
+------------------------------------------------------------------+
```

### 6.4 核心组件

#### 6.4.1 VideoPlayer（视频播放器）

**功能**:

- 自动播放视频列表
- 循环播放（无缝切换）
- 无控制条
- 不静音（保留音频）
- 不支持暂停

**实现**:

```javascript
import { useRef, useState, useEffect } from 'react';

export const VideoPlayer = ({ playlist }) => {
  const videoRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    };

    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [playlist]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && playlist[currentIndex]) {
      video.src = playlist[currentIndex].url;
      video.play().catch(err => {
        console.log('Autoplay blocked:', err);
        // 可以显示一个 "点击播放" 的提示
      });
    }
  }, [currentIndex, playlist]);

  return (
    <video
      ref={videoRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }}
      playsInline
      preload="auto"
    />
  );
};
```

#### 6.4.2 MoodSelector（Mood 切换菜单）

**功能**:

- 点击 [MOOD] 按钮展开浮层
- 显示所有可用 Statuses
- 点击某个 Status 切换
- 使用动画（Framer Motion）

**实现**:

```javascript
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export const MoodSelector = ({ statuses, currentStatus, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 100 }}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.95 }}
        style={{
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(10px)',
          border: 'none',
          borderRadius: 20,
          padding: '10px 20px',
          color: '#fff',
          fontSize: 16,
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        [MOOD: {currentStatus.mood}]
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 10,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(10px)',
              borderRadius: 12,
              padding: 16,
              minWidth: 200
            }}
          >
            {statuses.map(status => (
              <motion.div
                key={status.status_id}
                onClick={() => {
                  onSelect(status);
                  setIsOpen(false);
                }}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderRadius: 8,
                  color: status.status_id === currentStatus.status_id ? '#fff' : '#999',
                  marginBottom: 4
                }}
              >
                {status.status_id === currentStatus.status_id ? '(o) ' : '( ) '}
                <strong>{status.mood}</strong> - {status.title}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

#### 6.4.3 OverlayPanel（图层面板）

**功能**:

- 显示 NOW 和 HEALTH 图层
- 默认折叠，点击展开
- 使用动画

**实现**:

```javascript
import { motion } from 'framer-motion';
import { useState } from 'react';

export const OverlayPanel = ({ overlays }) => {
  const [nowExpanded, setNowExpanded] = useState(false);
  const [healthExpanded, setHealthExpanded] = useState(false);

  const panelStyle = {
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    cursor: 'pointer',
    color: '#fff'
  };

  return (
    <div style={{ position: 'absolute', bottom: 120, left: 20, right: 20, zIndex: 50 }}>
      {/* NOW 图层 */}
      <motion.div
        style={panelStyle}
        onClick={() => setNowExpanded(!nowExpanded)}
        whileTap={{ scale: 0.98 }}
      >
        <div style={{ fontWeight: 'bold', fontSize: 16 }}>[NOW]</div>
        <AnimatePresence>
          {nowExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}
            >
              {overlays.now}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* HEALTH 图层 */}
      <motion.div
        style={panelStyle}
        onClick={() => setHealthExpanded(!healthExpanded)}
        whileTap={{ scale: 0.98 }}
      >
        <div style={{ fontWeight: 'bold', fontSize: 16 }}>[HEALTH]</div>
        <AnimatePresence>
          {healthExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}
            >
              {overlays.health}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
```

#### 6.4.4 ComingSoon（占位页面）

**功能**:

- 当 Character 没有已完成的 Statuses 时显示
- 简洁的提示页面

**实现**:

```javascript
export const ComingSoon = ({ characterName }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      padding: 20,
      textAlign: 'center'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 style={{ fontSize: 48, marginBottom: 20 }}>
          {characterName || 'Character'}
        </h1>
        <p style={{ fontSize: 24, opacity: 0.9 }}>
          is coming soon...
        </p>
      </motion.div>
    </div>
  );
};
```

### 6.5 数据加载逻辑

```javascript
// pages/CharacterView.jsx

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

export const CharacterView = () => {
  const { characterId } = useParams();
  const [searchParams] = useSearchParams();
  const statusIdFromUrl = searchParams.get('status');

  const [character, setCharacter] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCharacterData();
  }, [characterId]);

  const loadCharacterData = async () => {
    try {
      // 1. 加载 Character 基础信息
      const { data: characterData, error: charError } = await supabase
        .from('ai_characters')
        .select('*')
        .eq('character_id', characterId)
        .single();

      if (charError) throw charError;
      setCharacter(characterData);

      // 2. 加载所有已完成的 Statuses
      const { data: statusesData, error: statusError } = await supabase
        .from('character_statuses')
        .select('*')
        .eq('character_id', characterId)
        .eq('generation_step', 3)
        .eq('generation_status', 'completed')
        .order('is_default', { ascending: false });

      if (statusError) throw statusError;
      setStatuses(statusesData);

      // 3. 设置当前显示的 Status
      if (statusesData.length > 0) {
        const initialStatus = statusIdFromUrl
          ? statusesData.find(s => s.status_id === statusIdFromUrl)
          : statusesData.find(s => s.is_default) || statusesData[0];

        setCurrentStatus(initialStatus);
      }

    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!statuses || statuses.length === 0) {
    return <ComingSoon characterName={character?.name} />;
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* 视频背景 */}
      <VideoPlayer playlist={currentStatus.videos_playlist} />

      {/* Mood 选择器 */}
      <MoodSelector
        statuses={statuses}
        currentStatus={currentStatus}
        onSelect={setCurrentStatus}
      />

      {/* 图层面板 */}
      <OverlayPanel overlays={currentStatus.overlays_content} />

      {/* 建议按钮 */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        display: 'flex',
        gap: 10,
        zIndex: 50
      }}>
        {currentStatus.suggestions_list.map((suggestion, idx) => (
          <motion.button
            key={idx}
            whileTap={{ scale: 0.95 }}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.3)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              borderRadius: 20,
              padding: '12px 16px',
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            {suggestion}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
```

---

## 7. 开发计划

### Phase 1: 基础架构搭建（1 天）

- [ ] 创建分支 `feature/character-status-system`
- [ ] 创建 `admin-app/` 项目
  - [ ] 配置 Vite + React
  - [ ] 安装 Ant Design
  - [ ] 配置路由
  - [ ] 搭建 AdminLayout
- [ ] 创建 `character-app/` 项目
  - [ ] 配置 Vite + React
  - [ ] 安装 Framer Motion
  - [ ] 配置路由
- [ ] 编写数据库 migration
- [ ] 创建 Storage buckets

### Phase 2: Edge Functions 开发（2 天）

- [ ] `generate-text-content` (Gemini)
  - [ ] 实现 API 调用
  - [ ] 错误处理
  - [ ] 本地测试
- [ ] `generate-starting-image` (FAL SeeDrawm)
  - [ ] 实现 API 调用
  - [ ] 下载并上传到 Supabase
  - [ ] 错误处理
- [ ] `generate-single-video` (FAL SeeDance)
  - [ ] 实现 API 调用
  - [ ] 下载并上传到 Supabase
  - [ ] 错误处理
- [ ] 部署 Edge Functions
- [ ] 配置环境变量

### Phase 3: 管理后台 - 基础 CRUD（1-2 天）

- [ ] P1: Characters 管理
  - [ ] 列表页
  - [ ] 创建/编辑表单
  - [ ] Avatar 上传
- [ ] P4: Assets 管理
  - [ ] 列表页
  - [ ] 上传组件
  - [ ] 分类管理
- [ ] P3: System Prompts 管理
  - [ ] 列表页
  - [ ] 编辑器

### Phase 4: 管理后台 - Statuses 核心功能（3-4 天）

- [ ] Statuses 列表页
  - [ ] 显示所有 Statuses
  - [ ] 步骤状态显示
  - [ ] "设为默认" 功能
- [ ] Statuses 编辑器 - Step 1
  - [ ] 基础信息表单
  - [ ] 调用 generate-text-content
  - [ ] 显示生成结果
  - [ ] 手动编辑功能
  - [ ] 保存到数据库
- [ ] Statuses 编辑器 - Step 2
  - [ ] 场景选择
  - [ ] 调用 generate-starting-image
  - [ ] 图片预览
  - [ ] 重新生成/手动上传
  - [ ] 保存到数据库
- [ ] Statuses 编辑器 - Step 3
  - [ ] 批量选择场景
  - [ ] 并行生成视频
  - [ ] 进度显示
  - [ ] 视频列表（支持拖拽重排）
  - [ ] 手动上传视频
  - [ ] 视频校验
  - [ ] 保存到数据库
- [ ] 数据持久化测试
- [ ] 继续编辑功能测试

### Phase 5: 用户端开发（2 天）

- [ ] CharacterView 页面
  - [ ] 数据加载逻辑
  - [ ] 路由参数处理
- [ ] VideoPlayer 组件
  - [ ] 自动播放
  - [ ] 循环逻辑
- [ ] MoodSelector 组件
  - [ ] 浮层展开/收起
  - [ ] 动画效果
  - [ ] Status 切换
- [ ] OverlayPanel 组件
  - [ ] 默认折叠
  - [ ] 展开动画
- [ ] ComingSoon 组件
- [ ] 响应式适配（mobile + desktop）

### Phase 6: LookGen 功能迁移（1 天）

- [ ] 重构 Transformations 管理
  - [ ] 从 React Native Web 迁移到 React
  - [ ] 使用 Ant Design 组件
- [ ] 重构 Style Templates 管理
  - [ ] 从 React Native Web 迁移到 React
  - [ ] 使用 Ant Design 组件

### Phase 7: Dashboard 和优化（1 天）

- [ ] Dashboard 统计页面
  - [ ] LookGen 统计
  - [ ] Character Status 统计
  - [ ] 系统资源使用
- [ ] 性能优化
- [ ] 错误处理完善
- [ ] Loading 状态优化

### Phase 8: 测试和部署（1 天）

- [ ] 完整流程测试
- [ ] 边界情况测试
- [ ] 部署配置
- [ ] 域名和路由配置

---

## 8. 环境配置

### 8.1 admin-app/.env

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 8.2 character-app/.env

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 8.3 supabase/functions/.env

```bash
GEMINI_API_KEY=your_gemini_api_key
FAL_API_KEY=your_fal_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 9. 成本估算

### 单个 Status 生成成本（假设 3 个 3 秒视频）

```
Step 1 (Gemini):       ~$0.001
Step 2 (SeeDrawm):     ~$0.01
Step 3 (SeeDance x3):  ~$0.24 ($0.08 × 3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
总计: ~$0.25/Status
```

### 生成时间估算

```
Step 1 (Gemini):       ~5 秒
Step 2 (SeeDrawm):     ~10-15 秒
Step 3 (SeeDance x3):  ~30-60 秒/视频（并行）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
总计: ~50-90 秒
```

---

## 10. 关键决策记录

| 决策项       | 选择                     | 理由               |
| ------------ | ------------------------ | ------------------ |
| 首帧图策略   | 一张首帧图生成多个视频   | 节省成本和时间     |
| 视频时长     | 默认 3 秒，可调整 2-5 秒 | 平衡效果和成本     |
| 视频比例     | portrait_9_16            | 移动端优先         |
| 错误处理     | 失败后提示，用户手动重试 | 简单可靠           |
| 数据持久化   | 每个 Step 完成后保存     | 支持断点续传       |
| 视频生成     | 支持并行生成             | 提升效率           |
| 视频排序     | 支持拖拽重排             | 用户自定义播放顺序 |
| 删除功能     | 暂不提供                 | 避免误操作         |
| 视频校验     | 格式 + 50MB 限制         | 保证质量           |
| 用户端视频   | 不静音，不可暂停         | 沉浸式体验         |
| UI 动画      | 使用 Framer Motion       | 提升用户体验       |
| 图层默认状态 | 折叠                     | 保持界面简洁       |

---

## 11. 待确认事项

- [ ] 最终确认所有需求
- [ ] 获取 API Keys (Gemini + FAL)
- [ ] 确认部署域名和路由
- [ ] 确认开发时间表
- [ ] 确认测试账号和数据

---

## 12. 附录

### 12.1 API 文档链接

- [Gemini API](https://ai.google.dev/docs)
- [FAL SeeDrawm v4](https://fal.ai/models/fal-ai/bytedance/seedream/v4/edit/llms.txt)
- [FAL SeeDance v1 Pro](https://fal.ai/models/fal-ai/bytedance/seedance/v1/pro/image-to-video/llms.txt)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

### 12.2 设计参考

- 参考原始 spec: `/SPEC/character_status_display_admin_001.md`
