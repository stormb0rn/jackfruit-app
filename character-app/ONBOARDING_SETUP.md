# Onboarding System - DEMO 快速设置指南

## ✅ 已完成的实现

### 1. 数据库迁移
- 文件：`/supabase/migrations/20251118000000_create_onboarding_system.sql`
- 包含：
  - `onboarding_configs` 表
  - `onboarding_sessions` 表
  - RLS 策略
  - 存储桶配置

### 2. 核心代码
- ✅ `onboardingService.js` - API 服务层
- ✅ `useOnboardingConfig.js` - 配置加载 Hook
- ✅ `useStepNavigation.js` - 步骤导航 Hook
- ✅ `useUserData.js` - 用户数据管理 Hook
- ✅ `OnboardingEngine.jsx` - 状态机核心
- ✅ `Step1Splash.jsx` - 启动与世界观
- ✅ `Step7Entry.jsx` - 进入世界
- ✅ `onboarding.css` - 样式文件
- ✅ App.jsx 路由更新

### 3. 流程逻辑
```
用户访问 /
  → Step 1 (Splash): 显示欢迎信息 + 按钮
  → 用户点击 [ INITIATE ]
  → Step 7 (Entry): 显示进入提示
  → 用户点击任意位置
  → 跳转到 /character/{target_character_id}
```

---

## 🚀 后续设置步骤

### 步骤 1: 推送数据库迁移

**方法A: 在 Supabase Dashboard 中手动执行**

1. 打开 Supabase Dashboard: https://fwytawawmtenhbnwhunc.supabase.co
2. 进入 SQL Editor
3. 复制 `supabase/migrations/20251118000000_create_onboarding_system.sql` 的内容
4. 粘贴并执行

**方法B: 使用 CLI（如果能解决版本冲突）**

```bash
supabase db push
```

### 步骤 2: 创建默认 Onboarding 配置

在 Supabase Dashboard 的 SQL Editor 中执行以下 SQL：

```sql
-- 1. 首先获取一个现有角色的 ID
SELECT character_id, name FROM ai_characters LIMIT 5;

-- 2. 创建默认 Onboarding 配置（替换 'YOUR_CHARACTER_ID'）
INSERT INTO onboarding_configs (
  config_name,
  is_active,
  flow_type,
  target_character_id,
  global_styles,
  step_1_splash,
  step_7_entry
) VALUES (
  'DEMO - Default Onboarding',
  true,  -- 激活此配置
  'fixed_character',
  'YOUR_CHARACTER_ID',  -- 🔴 替换为实际的角色 ID

  -- 全局样式
  '{
    "font_family": "''VT323'', monospace",
    "primary_color": "#00FF41",
    "background_overlay": "rgba(0, 0, 0, 0.7)",
    "animation_speed": "medium"
  }'::jsonb,

  -- Step 1: Splash
  '{
    "step_id": "splash",
    "visual": {
      "background_type": "video",
      "background_url": "https://your-video-url.com/welcome.mp4"
    },
    "content": {
      "title": "START YOUR SECOND LIFE",
      "lines": [
        "> BOOTING SYSTEM...",
        "> REFLECTION PROTOCOL v2.1",
        "> WELCOME.",
        "> IF YOU COULD HAVE A SECOND LIFE, WHO WOULD YOU BE?"
      ]
    },
    "interaction": {
      "type": "button",
      "button_text": "[ INITIATE ]"
    }
  }'::jsonb,

  -- Step 7: Entry
  '{
    "step_id": "entry",
    "visual": {
      "background_type": "video",
      "background_url": "https://your-video-url.com/entry.mp4"
    },
    "content": {
      "title": "WELCOME TO YOUR SECOND LIFE",
      "subtitle": "CLICK ANYWHERE TO ENTER"
    },
    "interaction": {
      "type": "any_click",
      "redirect_delay": 500
    }
  }'::jsonb
);
```

**注意事项：**
- 🔴 必须替换 `YOUR_CHARACTER_ID` 为实际角色 ID
- 🎥 视频 URL 可以先留空，或使用任意公开视频 URL
- 如果没有视频，可以暂时设置 `background_type: "canvas"` 并移除 `background_url`

### 步骤 3: 上传视频资源（可选）

1. 在 Supabase Dashboard → Storage → onboarding-resources
2. 上传两个视频：
   - `welcome.mp4` (Step 1 背景)
   - `entry.mp4` (Step 7 背景)
3. 获取公开 URL，更新配置中的 `background_url`

### 步骤 4: 测试流程

```bash
cd character-app
npm run dev
```

访问 `http://localhost:5173/`，应该看到：
1. Step 1 启动画面
2. 点击按钮后跳转到 Step 7
3. 点击任意位置跳转到角色主页

---

## 🛠️ 故障排查

### 问题 1: "No active onboarding configuration found"

**解决方案：**
- 确认数据库中有配置且 `is_active = true`
- 检查 SQL：
  ```sql
  SELECT * FROM onboarding_configs WHERE is_active = true;
  ```

### 问题 2: "No target character configured"

**解决方案：**
- 确认配置中的 `target_character_id` 指向有效角色
- 检查 SQL：
  ```sql
  SELECT c.config_name, c.target_character_id, a.name
  FROM onboarding_configs c
  LEFT JOIN ai_characters a ON c.target_character_id = a.character_id
  WHERE c.is_active = true;
  ```

### 问题 3: 样式不正确

**解决方案：**
- 确认 `onboarding.css` 被正确导入
- 检查浏览器控制台是否有 CSS 错误
- 确认 VT323 字体加载成功

### 问题 4: 视频不显示

**解决方案：**
- 检查视频 URL 是否可访问
- 检查浏览器控制台网络请求
- 尝试使用简单的背景色代替视频：
  ```json
  "visual": {
    "background_type": "solid",
    "background_color": "#000"
  }
  ```

---

## 📝 下一步扩展（未来）

1. **实现 Step 2-6**
   - Step 2: 助手引导
   - Step 3: 身份输入（姓名、照片、语音）
   - Step 4: 核心选择（保持自我 vs 成为别人）
   - Step 5: 身份创造（AI 生成）
   - Step 6: 确认与加载

2. **Admin 配置界面**
   - 可视化配置编辑器
   - 视频资源管理器
   - 用户会话数据查看器

3. **高级功能**
   - 文件上传（照片、语音）
   - AI 生成集成（Gemini + FAL）
   - 用户创建角色流程

---

## 🎯 快速测试配置（无视频版本）

如果暂时没有视频资源，可以使用纯色背景：

```sql
INSERT INTO onboarding_configs (
  config_name,
  is_active,
  flow_type,
  target_character_id,
  step_1_splash,
  step_7_entry
) VALUES (
  'DEMO - No Video',
  true,
  'fixed_character',
  'YOUR_CHARACTER_ID',  -- 替换

  '{
    "step_id": "splash",
    "visual": {
      "background_type": "solid"
    },
    "content": {
      "title": "START YOUR SECOND LIFE",
      "lines": ["> WELCOME.", "> PRESS THE BUTTON TO CONTINUE."]
    },
    "interaction": {
      "type": "button",
      "button_text": "[ INITIATE ]"
    }
  }'::jsonb,

  '{
    "step_id": "entry",
    "visual": {
      "background_type": "solid"
    },
    "content": {
      "title": "WELCOME",
      "subtitle": "CLICK ANYWHERE TO ENTER"
    },
    "interaction": {
      "type": "any_click"
    }
  }'::jsonb
);
```

---

## ✅ 验证清单

- [ ] 数据库迁移已执行
- [ ] 创建了至少一个 onboarding_config 且 is_active = true
- [ ] target_character_id 指向有效角色
- [ ] character-app 运行无错误
- [ ] 访问 / 可以看到 Step 1
- [ ] 点击按钮后跳转到 Step 7
- [ ] Step 7 点击后跳转到角色主页

---

**准备好了吗？执行步骤 1-4，然后开始测试！** 🚀
