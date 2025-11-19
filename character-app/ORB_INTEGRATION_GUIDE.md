# 光球交互系统集成指南

## 🎯 项目概述

本项目为 Character App 实现了完整的光球交互系统，整合了 **ElevenLabs TTS**、**实时音频分析**、**语音活动检测（VAD）** 和 **5状态机**。

---

## ✅ 已完成功能

### 核心基础设施

1. **ElevenLabs TTS 集成**
   - 文件：`src/services/elevenlabsService.js`
   - 功能：调用 ElevenLabs API 生成高质量语音
   - 支持语音 ID 自定义
   - 音频 Blob 管理

2. **音频缓存系统**
   - 文件：`src/services/audioCacheService.js`
   - 功能：使用 IndexedDB 缓存 TTS 音频
   - 自动过期管理（7天）
   - 容量限制（50MB）
   - 缓存统计功能

3. **Supabase Edge Function**
   - 文件：`supabase/functions/generate-tts-audio/index.ts`
   - 功能：服务器端 TTS 生成并上传到 Supabase Storage
   - 自动检查缓存避免重复生成
   - 返回音频公开 URL

4. **增强的音频服务**
   - 文件：`src/services/audioService.js`
   - 新增功能：
     - `playWithAnalysis(audioUrl, onEnergy)` - 播放外部音频并实时分析
     - `enableVAD()` / `disableVAD()` - 语音活动检测
     - `analyzeVideoAudio(videoElement, onEnergy)` - 视频音频分析
     - `normalizeEnergy(rawEnergy, source)` - 多源能量归一化

5. **扩展的光球组件**
   - 文件：`src/components/NovaOrbCanvas.jsx`
   - 支持 5 种状态：
     - **IDLE**: 待机（白色，轻微呼吸）
     - **LISTENING**: 监听（深蓝，轻度收缩）
     - **HEARING**: 听到声音（亮蓝，强烈收缩 + 脉冲）
     - **THINKING**: 思考（紫色，旋转加速 + 螺旋效果）⭐ 新增
     - **SPEAKING**: 说话（青色，扩散 + 连线）

6. **光球状态机 Hook**
   - 文件：`src/hooks/useOrbStateMachine.js`
   - 功能：
     - 自动状态转换逻辑
     - VAD 集成
     - 完整对话循环支持
     - 错误处理和降级

7. **统一 TTS 服务**
   - 文件：`src/services/ttsService.js`
   - 功能：
     - 智能选择最佳 TTS 方案（ElevenLabs 或浏览器）
     - 自动缓存管理
     - 批量预加载
     - 降级方案

### 场景集成

8. **Onboarding 步骤优化**
   - 已集成光球：
     - `Step1Splash.jsx` - Phase 2 使用 LISTENING 状态
     - `Step3AIDialogue.jsx` - 使用 SPEAKING 状态
   - 更新为新的状态名称

9. **VoiceChat 语音聊天页面**
   - 文件：`src/pages/VoiceChat.jsx`
   - 功能：
     - 完整的5状态机演示
     - 实时语音识别
     - VAD 自动停止录音
     - 真实 TTS 播放
     - 对话历史记录
   - 路由：`/voice-chat` 或 `/voice-chat/:characterId`

---

## 📁 文件结构

```
character-app/
├── src/
│   ├── services/
│   │   ├── elevenlabsService.js      # ElevenLabs API 集成
│   │   ├── audioCacheService.js      # IndexedDB 音频缓存
│   │   ├── audioService.js           # 增强的音频分析（+VAD）
│   │   └── ttsService.js             # 统一 TTS 服务
│   ├── hooks/
│   │   └── useOrbStateMachine.js     # 光球状态机 Hook
│   ├── components/
│   │   └── NovaOrbCanvas.jsx         # 光球组件（5状态）
│   ├── pages/
│   │   ├── VoiceChat.jsx             # 语音聊天页面
│   │   ├── VoiceChat.css             # 样式
│   │   └── Onboarding/steps/         # 已更新的 Onboarding 步骤
│   └── App.jsx                        # 添加了 VoiceChat 路由
├── package.json                       # 新增依赖：idb
└── ORB_INTEGRATION_GUIDE.md          # 本文档

supabase/functions/
└── generate-tts-audio/
    └── index.ts                       # TTS Edge Function
```

---

## 🔧 环境配置

### 1. 安装依赖

```bash
cd character-app
npm install
```

新增依赖：
- `idb` (v8.0.0) - IndexedDB 包装库

### 2. 配置环境变量

#### 前端（character-app/.env）

```bash
# ElevenLabs API Key（可选，不配置则使用浏览器 TTS）
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Supabase 配置（已有）
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 后端（Supabase Dashboard 或 supabase/functions/.env）

```bash
ELEVENLABS_API_KEY=your_elevenlabs_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. 部署 Supabase Edge Function

```bash
# 部署 TTS 函数
supabase functions deploy generate-tts-audio

# 验证部署
supabase functions list
```

---

## 🚀 使用指南

### 方案 1：访问 VoiceChat 页面（完整演示）

```bash
# 启动开发服务器
cd character-app
npm run dev

# 访问
http://localhost:5178/voice-chat
```

**功能展示**：
- 点击「开始对话」授权麦克风
- 光球变为蓝色（LISTENING）时开始说话
- 检测到声音光球变为亮蓝（HEARING）并脉冲
- 停止说话 1.5 秒后自动结束录音（VAD）
- 光球变为紫色（THINKING）并旋转
- AI 回复时光球变为青色（SPEAKING）并扩散
- 播放完毕回到白色（IDLE）

### 方案 2：在现有页面集成光球

#### 简单集成（仅展示）

```jsx
import NovaOrbCanvas from '../components/NovaOrbCanvas'

function MyComponent() {
  return (
    <div style={{ width: 300, height: 300 }}>
      <NovaOrbCanvas
        mode="IDLE"  // 状态：IDLE/LISTENING/HEARING/THINKING/SPEAKING
        energy={0}   // 音频能量（0-1）
        particleCount={260}
      />
    </div>
  )
}
```

#### 完整集成（带状态机）

```jsx
import NovaOrbCanvas from '../components/NovaOrbCanvas'
import useOrbStateMachine from '../hooks/useOrbStateMachine'
import ttsService from '../services/ttsService'

function MyComponent() {
  const {
    orbMode,
    audioEnergy,
    startListening,
    startThinking,
    startSpeaking
  } = useOrbStateMachine()

  const handleVoiceChat = async () => {
    // 1. 开始监听（带 VAD）
    await startListening({
      enableVAD: true,
      onSilence: async () => {
        // 2. 用户说完 → 思考
        startThinking()

        // 3. 生成 TTS 音频
        const audioUrl = await ttsService.textToSpeech('你好，我是 AI 助手')

        // 4. 播放音频
        await startSpeaking(audioUrl)
      }
    })
  }

  return (
    <div>
      <NovaOrbCanvas mode={orbMode} energy={audioEnergy} />
      <button onClick={handleVoiceChat}>开始对话</button>
    </div>
  )
}
```

---

## 📊 API 参考

### NovaOrbCanvas Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `mode` | string | 'IDLE' | 状态：'IDLE' \| 'LISTENING' \| 'HEARING' \| 'THINKING' \| 'SPEAKING' |
| `energy` | number | 0 | 音频能量（0.0-1.0） |
| `particleCount` | number | 260 | 粒子数量 |
| `colors` | object | null | 自定义颜色主题 |
| `size` | object | { width: '100%', height: '100%' } | 容器尺寸 |

### useOrbStateMachine Hook

**返回值**：

```typescript
{
  // 状态
  orbMode: string          // 当前模式
  audioEnergy: number      // 音频能量
  isProcessing: boolean    // 是否处理中
  isIdle: boolean          // 是否待机
  isListening: boolean     // 是否监听中
  isThinking: boolean      // 是否思考中
  isSpeaking: boolean      // 是否说话中

  // 控制方法
  startListening(options): Promise<boolean>
  stopListening(): void
  startThinking(): void
  stopThinking(): void
  startSpeaking(audioUrl): Promise<void>
  stopSpeaking(): void
  reset(): void
  setState(mode): void
  startConversation(options): Promise<void>

  // 常量
  OrbStates: object
}
```

### ttsService API

```typescript
// 文本转语音（智能选择方案）
await ttsService.textToSpeech(text, options)
// 返回：Promise<string | null>  音频 URL

// 预加载多个文本
await ttsService.preloadMultiple([text1, text2, text3])
// 返回：Promise<Array<string | null>>

// 清空缓存
await ttsService.clearCache()

// 获取缓存统计
const stats = await ttsService.getCacheStats()
```

---

## 🎨 状态机流程图

```
用户点击麦克风
    ↓
IDLE → LISTENING（开始录音，audioService.startMicrophone）
    ↓
检测到音频能量 > 0.1
    ↓
LISTENING → HEARING（粒子收缩幅度加大，脉冲效果）
    ↓
用户停止说话（静默 1.5 秒，VAD 触发）
    ↓
HEARING → THINKING（旋转动画，调用 AI API）
    ↓
AI 返回回复文本
    ↓
THINKING → SPEAKING（生成 TTS，播放音频，粒子扩散）
    ↓
TTS 播放完毕
    ↓
SPEAKING → IDLE（恢复待机）
```

---

## 🔍 调试技巧

### 1. 查看缓存统计

```javascript
import audioCacheService from './services/audioCacheService'

const stats = await audioCacheService.getStats()
console.log('缓存统计:', stats)
// 输出：{ initialized: true, totalEntries: 5, oldestEntry: Date, ... }
```

### 2. 手动清空缓存

```javascript
import ttsService from './services/ttsService'

await ttsService.clearCache()
console.log('缓存已清空')
```

### 3. 检查 ElevenLabs API 状态

```javascript
import elevenlabsService from './services/elevenlabsService'

console.log('ElevenLabs 可用:', elevenlabsService.isAvailable())
// 输出：true 或 false
```

### 4. 查看浏览器 IndexedDB

1. 打开 DevTools
2. Application → Storage → IndexedDB
3. 展开 `audio-cache` → `tts-audio`
4. 查看缓存的音频条目

---

## 🐛 常见问题

### Q1: ElevenLabs API 失败，无法播放音频

**解决方案**：
1. 检查 `.env` 中的 `VITE_ELEVENLABS_API_KEY` 是否正确
2. 查看浏览器控制台错误信息
3. 系统会自动降级到浏览器 TTS（无音频 URL）

### Q2: 麦克风权限被拒绝

**解决方案**：
1. 确保使用 HTTPS 或 localhost
2. 浏览器设置中检查麦克风权限
3. 刷新页面后重新授权

### Q3: 光球没有响应音频能量

**解决方案**：
1. 检查 `audioService.startMicrophone()` 是否成功调用
2. 确保传递了 `onEnergy` 回调
3. 检查 `setAudioEnergy(energy)` 是否正确更新状态

### Q4: TTS 音频播放没有能量可视化

**原因**：浏览器 TTS（`SpeechSynthesis`）无法连接到 Web Audio API

**解决方案**：
- 配置 ElevenLabs API 使用真实音频文件
- 或在播放浏览器 TTS 时使用模拟能量

### Q5: IndexedDB 初始化失败

**解决方案**：
1. 检查浏览器是否支持 IndexedDB
2. 清除浏览器缓存和 Site Data
3. 检查隐私模式（隐私模式下 IndexedDB 会在会话结束时清空）

---

## 📈 性能优化建议

### 1. 音频预加载

```javascript
// 在 Onboarding 第一步预加载所有引导语
useEffect(() => {
  const preload = async () => {
    const texts = [
      "欢迎来到第二生命",
      "准备好开始你的旅程了吗？",
      "让我们一起创造你的新身份"
    ]
    await ttsService.preloadMultiple(texts)
  }
  preload()
}, [])
```

### 2. 缓存管理

```javascript
// 定期清理过期缓存（可选）
useEffect(() => {
  const cleanupInterval = setInterval(async () => {
    const cleaned = await audioCacheService.cleanExpiredCache()
    console.log(`清理了 ${cleaned} 个过期缓存`)
  }, 60 * 60 * 1000) // 每小时清理一次

  return () => clearInterval(cleanupInterval)
}, [])
```

### 3. 降低粒子数量（移动设备）

```jsx
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

<NovaOrbCanvas
  mode={orbMode}
  energy={audioEnergy}
  particleCount={isMobile ? 150 : 260}  // 移动设备减少粒子
/>
```

---

## 🚢 部署清单

### Vercel 部署

1. ✅ 提交所有代码到 Git
2. ✅ 在 Vercel 项目设置中添加环境变量：
   - `VITE_ELEVENLABS_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. ✅ 推送代码，自动部署

### Supabase 部署

1. ✅ 部署 Edge Function：
   ```bash
   supabase functions deploy generate-tts-audio
   ```

2. ✅ 在 Supabase Dashboard 配置环境变量：
   - Settings → Edge Functions → Secrets
   - 添加 `ELEVENLABS_API_KEY`

3. ✅ 验证存储桶权限：
   - 确保 `onboarding-resources` 存储桶允许公开读取

---

## 📝 下一步计划

### 待实现功能

1. **CharacterView 视频页面集成光球**
   - 视频音频实时分析
   - 光球同步视频音轨能量

2. **角色状态切换动画**
   - 点击 MOOD/HEALTH 按钮时光球脉冲
   - 状态切换时 THINKING 动画

3. **真实 AI 对话集成**
   - 在 VoiceChat 中调用 Gemini API
   - 替换示例回声逻辑

4. **音频预加载优化**
   - 智能预测用户可能触发的 TTS
   - 后台静默预加载

5. **错误处理增强**
   - 网络失败重试机制
   - 降级方案更智能（如 API 配额耗尽时自动切换）

---

## 👨‍💻 开发者注意事项

### 代码规范

- 所有服务使用单例模式
- 异步函数统一使用 `async/await`
- 错误统一在 console 打印前缀（如 `[ttsService]`）

### 测试要点

1. 测试麦克风权限请求
2. 测试 VAD 在不同静默阈值下的表现
3. 测试 ElevenLabs API 失败时的降级
4. 测试缓存过期和容量限制

### 性能监控

```javascript
// 监控 TTS 生成时间
console.time('TTS Generation')
const audioUrl = await ttsService.textToSpeech(text)
console.timeEnd('TTS Generation')
```

---

## 📚 相关文档

- [NovaOrbCanvas 组件文档](./src/components/NovaOrbCanvas.jsx)
- [useOrbStateMachine Hook 文档](./src/hooks/useOrbStateMachine.js)
- [ElevenLabs API 文档](https://docs.elevenlabs.io/)
- [Web Audio API 文档](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [IndexedDB API 文档](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

---

## 🙏 致谢

本项目使用了以下开源库和 API：

- **idb** - IndexedDB 包装库
- **ElevenLabs** - 高质量 TTS API
- **Supabase** - 后端和存储
- **Web Audio API** - 音频分析
- **Web Speech API** - 语音识别

---

**最后更新**：2025-11-19
**版本**：1.0.0
**作者**：Claude Code
