## 💎 前端页面开发技术规范 (SPEC) - v2 (已更新)

### 1. 项目概述与目标

**项目名称：** 移动应用故事创建 (Story Creation) 界面原型

**目标：**

1. 基于提供的 `image_1873c9.jpg` 图像，构建一个高保真、静态的 Web 前端页面。
2. 该页面**必须**在 PC/Mac 桌面浏览器上以一个**固定尺寸、居中的“iPhone”框架**内显示。
3. 页面需要能够**切换**展示图像中的四种不同状态（Creation_1, NOW, HEALTH, MOOD）。

---

### 2. 关键技术要求 (PC/Mac 桌面端)

1. **全局容器 (Desktop Viewport):**
   * 整个浏览器页面 (`<body>`) 应有一个深灰色背景（例如：`#2a2a2a`）。
   * 使用 Flexbox 或 Grid 布局，确保手机框架始终在浏览器窗口中 **水平和垂直居中** 。
2. **手机框架 (iPhone Frame):**
   * 创建一个 `<div>` 作为手机模拟器的主框架（例如：class
     `iphone-frame`）。
   * **固定尺寸：** 推荐 CSS：`width: 390px;` `height: 844px;`
   * **外观：**
     * `border-radius: 40px;`
     * `box-shadow: 0 10px 40px rgba(0,0,0,0.3);`
     * `overflow: hidden;`
     * `background-color: #000;`
     * `position: relative;` (以便内部元素绝对定位)

---

### 3. 页面结构与组件拆解 (HTML/CSS)

#### 3.1. 基础布局 (HTML 结构)

**HTML**

```
<body class="desktop-container">
  
  <div class="iphone-frame">
  
    <div class="background-layer">
      <img src="[背景图占位符]" alt="Woman walking">
    </div>

    <div class="top-controls">
      <button class="post-button">Post</button>
    </div>

    <div class="bottom-bar">
      <div class="prompt-section">
        <span class="prompt-title">What's next?</span>
        <div class="suggestion-buttons">
          <button class="btn-suggestion">
            Get lunch with a friend
          </button>
          <button class="btn-suggestion">
            Walk around the city
          </button>
        </div>
      </div>
      <div class="nav-icons">
        </div>
    </div>

    <div class="overlay-content" id="overlay-now" style="display: none;">
      <div class="ai-label">AI: You NOW</div>
      <p>AI: You just finished pilates and can't decide what to do next. You're scrolling on your phone to see if any of your friends are nearby.</p>
    </div>
  
    <div class="overlay-content" id="overlay-health" style="display: none;">
      <div class="health-label">HEALTH</div>
      <div class="health-bar">
        <div class="health-bar-inner"></div>
      </div>
      <p>AI: You is feeling tired these days. Maybe an early night could help.</p>
    </div>
  
    <div class="overlay-content" id="overlay-mood" style="display: none;">
      <div class="mood-label">MOOD</div>
      <div class="mood-tags">
        <span class="tag">Tired</span>
        <span class="tag">Calm</span>
        <span class="tag">Social</span>
      </div>
    </div>

  </div>
  
  <div class="state-switcher">
      <button data-state="base">1: Base</button>
      <button data-state="now">2: NOW</button>
      <button data-state="health">3: HEALTH</button>
      <button data-state="mood">4: MOOD</button>
  </div>
  
</body>
```

#### 3.2. 核心组件样式 (CSS)

* **`.background-layer`** :
* `position: absolute; top: 0; left: 0; width: 100%; height: 100%;`
* `img` 或 `video` 标签: `object-fit: cover;` 确保填满容器。
* **`.top-controls`** :
* `position: absolute; top: 0; left: 0; right: 0;`
* `padding: 20px; padding-top: 50px;` (为 iPhone "刘海" 预留安全区域)
* `display: flex; justify-content: flex-end;` (仅将 Post 按钮推到右侧)
* `z-index: 10;`
* **`.post-button`** :
  * `background-color: rgba(255, 255, 255, 0.9);`
  * `color: #000;`
  * `border: none; border-radius: 20px;`
  * `padding: 8px 16px; font-weight: bold; cursor: pointer;`
* **`.bottom-bar`** :
* `position: absolute; bottom: 0; left: 0; right: 0;`
* `padding: 20px; padding-bottom: 30px;` (为 iPhone 底部横条预留安全区域)
* **渐变遮罩** : `background: linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0));`
* `z-index: 10;`
* **`.suggestion-buttons`** :
  * `display: flex; gap: 10px;`
  * `button`: `background-color: rgba(255, 255, 255, 0.2);`
  * `border: 1px solid rgba(255, 255, 255, 0.3);`
  * `color: white; border-radius: 25px; padding: 12px 16px;`
* **`.overlay-content` (所有浮层的通用样式)** :
* `position: absolute; top: 120px;` (稍微下移，因为顶部栏更简洁)
* `left: 15px; right: 15px;`
* `background-color: rgba(0, 0, 0, 0.6);` (半透明黑色背景)
* `backdrop-filter: blur(10px);` (毛玻璃效果)
* `border-radius: 12px; padding: 16px;`
* `color: white;`
* `z-index: 5;`
* **`.overlay-health` (特定样式)** :
* **`.health-bar`** :
  * `width: 100%; height: 10px; background-color: rgba(255,255,255,0.3); border-radius: 5px; overflow: hidden;`
* **`.health-bar-inner`** :
  * `width: 70%;` (根据图片估算) `height: 100%;`
  * `background: linear-gradient(to right, #F9C80E, #F86624);` (黄到红的渐变)
* **`.overlay-mood` (特定样式)** :
* **`.mood-tags .tag`** :
  * `display: inline-block;`
  * `background-color: rgba(255, 255, 255, 0.15);`
  * `border: 1px solid rgba(255, 255, 255, 0.3);`
  * `border-radius: 20px; padding: 8px 14px; margin: 5px;`

---

### 4. 交互功能 (JavaScript)

此需求 **不变** ：

1. **获取 DOM 元素：**
   * 获取所有状态切换按钮（例如 `document.querySelectorAll('.state-switcher button')`）。
   * 获取所有浮层 `div`（例如 `document.querySelectorAll('.overlay-content')`）。
2. **创建点击事件监听器：**
   * 为 `.state-switcher` 里的每个按钮添加 `click` 事件。
   * **点击逻辑：**
     1. **隐藏所有浮层：** 遍历所有 `.overlay-content` 元素，设置 `style.display = 'none'`。
     2. **显示目标浮层：**
        * 获取按钮的 `data-state` 属性值（'base', 'now', 'health', 'mood'）。
        * 如果 `data-state` 是 'base'，则不执行任何操作。
        * 否则，获取对应的 ID (例如 `#overlay-now`)，并设置 `style.display = 'block'`。

---

### 5. 所需资源 (Assets)

* **背景图像/视频：** 1个，需要从原图中提取或使用占位符。
* **图标 (SVG 或 Icon Font)：**
  * 底部导航栏：5个图标（例如：Home, Search, Create, Bell, Profile）
  * 建议按钮：聊天气泡图标、地图图钉图标。
