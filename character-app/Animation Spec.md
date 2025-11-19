这是一个为您整理好的完整项目包结构。由于我无法直接发送 `.zip` 文件，我将文件内容拆分为标准的工程结构。

您可以新建一个文件夹（例如命名为 `nova_ai_core`），并在其中创建以下三个文件，将对应的代码复制进去即可。

### 📁 文件夹结构

```text
nova_ai_core/
├── index.html              # 核心代码（包含 HTML/CSS/JS）
├── README.md               # 项目说明书
└── INTEGRATION_GUIDE.md    # 接入与开发文档（API 说明）
```

---

### 1. 文件名: `index.html`

这是完整的视觉核心，包含了 Lo-Fi 像素渲染引擎和 CRT 滤镜效果。

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NOVA AI - Lo-Fi Visual Core</title>
    <style>
        /* --- 全局样式 & CRT 滤镜层 --- */
        body {
            margin: 0;
            background-color: #080a0c;
            overflow: hidden;
            font-family: 'Courier New', monospace;
            height: 100vh;
            width: 100vw;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #4af;
        }

        /* 核心画布：强制像素化 */
        canvas {
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            z-index: 1;
            image-rendering: pixelated;
            image-rendering: crisp-edges; /* Firefox */
            opacity: 0.9;
        }

        /* CRT 扫描线纹理 */
        .scanlines {
            position: absolute;
            inset: 0;
            z-index: 5;
            background: linear-gradient(to bottom, rgba(18,16,16,0) 50%, rgba(0,0,0,0.4) 50%);
            background-size: 100% 4px;
            pointer-events: none;
        }

        /* RGB 像素网格 */
        .pixel-grid {
            position: absolute;
            inset: 0;
            z-index: 4;
            background-image: radial-gradient(rgba(0,0,0,0.3) 1px, transparent 1px);
            background-size: 4px 4px;
            pointer-events: none;
        }

        /* 屏幕光晕与暗角 */
        .screen-glow {
            position: absolute;
            inset: 0;
            z-index: 6;
            background: radial-gradient(circle, rgba(64,160,255,0.05) 0%, rgba(0,0,0,0.6) 90%);
            pointer-events: none;
            box-shadow: inset 0 0 100px rgba(0,0,0,0.9);
        }

        /* --- UI 控制面板 --- */
        .ui-panel {
            position: absolute;
            bottom: 50px;
            z-index: 10;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
        }

        .status-text {
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 2px;
            background: rgba(0, 20, 40, 0.8);
            padding: 4px 10px;
            border: 1px solid #246;
            box-shadow: 0 0 10px rgba(34, 68, 102, 0.5);
            text-shadow: 0 0 5px #4af;
        }

        .controls {
            display: flex;
            gap: 10px;
            background: #000;
            padding: 5px;
            border: 1px solid #333;
        }

        button {
            background: #111;
            border: 1px solid #333;
            color: #666;
            padding: 8px 16px;
            cursor: pointer;
            font-family: inherit;
            text-transform: uppercase;
            font-size: 12px;
            transition: 0.2s;
        }

        button:hover { background: #222; color: #888; }
      
        button.active {
            background: #4af;
            color: #000;
            box-shadow: 0 0 15px #4af;
            border-color: #4af;
            font-weight: bold;
        }
    </style>
</head>
<body>

    <!-- 滤镜层 -->
    <div class="scanlines"></div>
    <div class="pixel-grid"></div>
    <div class="screen-glow"></div>

    <!-- 渲染核心 -->
    <canvas id="pixelCanvas"></canvas>

    <!-- UI -->
    <div class="ui-panel">
        <div class="status-text" id="status">SYSTEM: STANDBY</div>
        <div class="controls">
            <button class="active" onclick="NovaCore.setMode('IDLE')">Idle</button>
            <button onclick="NovaCore.setMode('LISTEN')">Input</button>
            <button onclick="NovaCore.setMode('SPEAK')">Output</button>
        </div>
    </div>

    <script>
        /**
         * NOVA CORE - Visualization Engine
         * 封装为全局对象以便外部调用
         */
        const NovaCore = (function() {
            const canvas = document.getElementById('pixelCanvas');
            const ctx = canvas.getContext('2d');
            const statusEl = document.getElementById('status');
            const btns = document.querySelectorAll('button');

            // 配置：像素大小 (越大越复古)
            const PIXEL_SIZE = 6; 
            let w, h, cx, cy;

            // 系统状态
            const SYS = {
                mode: 'IDLE',       // IDLE, LISTEN, SPEAK
                energy: 0,          // 当前能量 (0.0 - 1.0)
                targetEnergy: 0,    // 目标能量
                time: 0,
                colors: {
                    idle: '#3d4e5e',   // 灰蓝 (待机)
                    listen: '#2b6cb0', // 深蓝 (输入)
                    speak: '#48dbfb',  // 亮青 (输出)
                    grid: '#101820'    // 背景网格
                }
            };

            // 粒子池
            const particles = [];
            const PARTICLE_COUNT = 150;

            function init() {
                resize();
                window.addEventListener('resize', resize);
              
                // 初始化粒子
                for(let i=0; i<PARTICLE_COUNT; i++) {
                    particles.push({
                        theta: Math.random() * Math.PI * 2,
                        phi: Math.acos((Math.random() * 2) - 1),
                        baseR: 25 + Math.random() * 10,
                        flash: Math.random()
                    });
                }
              
                loop();
            }

            function resize() {
                w = Math.ceil(window.innerWidth / PIXEL_SIZE);
                h = Math.ceil(window.innerHeight / PIXEL_SIZE);
                canvas.width = w;
                canvas.height = h;
                cx = w / 2;
                cy = h / 2;
            }

            function loop() {
                // 1. 拖尾清除
                ctx.fillStyle = 'rgba(8, 10, 12, 0.3)';
                ctx.fillRect(0, 0, w, h);

                // 2. 背景网格
                drawGrid();

                SYS.time += 0.05;
              
                // 3. 能量缓动
                // 注意：如果接入真实音频，请注释掉下面的 simulateAudio()
                simulateAudio(); 
                SYS.energy += (SYS.targetEnergy - SYS.energy) * 0.1;

                // 4. 粒子渲染
                particles.forEach(p => {
                    // 基础旋转
                    p.theta += 0.02 + (SYS.energy * 0.05);
                  
                    // 物理形态逻辑
                    let r = p.baseR;
                    let jitter = Math.sin(SYS.time + p.flash * 10);

                    if (SYS.mode === 'IDLE') {
                        r += jitter * 2; 
                    } else if (SYS.mode === 'LISTEN') {
                        r = r * 0.6 + jitter - (SYS.energy * 10);
                    } else if (SYS.mode === 'SPEAK') {
                        r = r * 1.2 + (SYS.energy * 20);
                    }
                    if (r < 2) r = 2;

                    // 3D 投影
                    const x3d = r * Math.sin(p.phi) * Math.cos(p.theta);
                    const y3d = r * Math.sin(p.phi) * Math.sin(p.theta);
                    const z3d = r * Math.cos(p.phi);
                    const fov = 60;
                    const scale = fov / (fov - z3d);
                    const x2d = cx + x3d * scale;
                    const y2d = cy + y3d * scale;

                    if (scale > 0) {
                        let color = SYS.colors.idle;
                        if (SYS.mode === 'LISTEN') color = SYS.colors.listen;
                        if (SYS.mode === 'SPEAK') color = SYS.colors.speak;

                        const alpha = (z3d + r*1.5) / (3*r);
                        ctx.fillStyle = color;
                        ctx.globalAlpha = Math.max(0.2, Math.min(1, scale * alpha));
                      
                        // 绘制像素块
                        const size = Math.max(1, scale * 1.5);
                        ctx.fillRect(Math.floor(x2d), Math.floor(y2d), size, size);
                      
                        // Glitch 效果 (仅在说话时)
                        if (SYS.mode === 'SPEAK' && Math.random() > 0.98) {
                            ctx.fillStyle = 'rgba(72, 219, 251, 0.5)';
                            ctx.fillRect(Math.floor(x2d), Math.floor(y2d), Math.random()*10, 1);
                        }
                    }
                });
                ctx.globalAlpha = 1.0;
                requestAnimationFrame(loop);
            }

            function drawGrid() {
                ctx.strokeStyle = SYS.colors.grid;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                const floorY = cy + 20;
                for(let x = -100; x <= 100; x+=10) {
                    ctx.moveTo(cx + x, floorY);
                    ctx.lineTo(cx + x * 4, h);
                }
                for(let y = floorY; y < h; y+=5) {
                    ctx.moveTo(0, y);
                    ctx.lineTo(w, y);
                }
                ctx.stroke();
            }

            // --- 模拟音频数据 (仅供演示) ---
            function simulateAudio() {
                if (SYS.mode === 'IDLE') {
                    SYS.targetEnergy = (Math.sin(SYS.time) > 0.9) ? 0.2 : 0;
                } else if (SYS.mode === 'LISTEN') {
                    SYS.targetEnergy = Math.random() * 0.6;
                } else if (SYS.mode === 'SPEAK') {
                    SYS.targetEnergy = (Math.sin(SYS.time * 5) + 1) * 0.5;
                }
            }

            // --- 暴露给外部的 API ---
            return {
                init: init,
                // 设置状态: 'IDLE', 'LISTEN', 'SPEAK'
                setMode: function(mode) {
                    SYS.mode = mode;
                    statusEl.innerText = "SYSTEM: " + mode;
                    // 更新按钮 UI
                    btns.forEach(b => {
                        if(b.innerText.toUpperCase().includes(mode) || 
                           (mode==='LISTEN' && b.innerText==='Input') || 
                           (mode==='SPEAK' && b.innerText==='Output')) {
                            b.classList.add('active');
                        } else {
                            b.classList.remove('active');
                        }
                    });
                },
                // 注入真实音频数据 (0.0 - 1.0)
                setEnergy: function(val) {
                    SYS.targetEnergy = val;
                }
            };
        })();

        // 启动系统
        NovaCore.init();

    </script>
</body>
</html>
```

---

### 2. 文件名: `README.md`

这是一个基础的说明文件，适合作为项目首页。

```markdown
# NOVA AI - Lo-Fi Pixel Core

## 项目简介
NOVA Core 是一个基于 HTML5 Canvas 的复古未来主义（Retro-Futurism）音频可视化组件。它摒弃了高清、刺眼的传统 AI 视觉，转而采用 **Lo-Fi 像素化风格**，模拟 CRT 显示器的物理质感，提供不刺眼、高质感的交互体验。

## 视觉特性
1.  **Lo-Fi 像素渲染**：物理降维渲染，边缘锐利，具有 80 年代终端机的风格。
2.  **CRT 仿真层**：内置扫描线（Scanlines）、RGB 子像素网格和屏幕荧光效果。
3.  **色彩管理**：
    *   **Idle (灰蓝)**: 待机状态，如同休眠的服务器。
    *   **Input (深蓝)**: 监听状态，视觉收缩，不干扰用户。
    *   **Output (亮青)**: 表达状态，高亮但不刺眼，带有数据 Glitch 效果。

## 快速开始
1.  直接使用浏览器打开 `index.html` 即可预览。
2.  点击底部的按钮切换 AI 状态：
    *   **Idle**: 待机呼吸。
    *   **Input**: 模拟听取用户语音（粒子收缩）。
    *   **Output**: 模拟 AI 回复（粒子扩散 + 波动）。

## 文件结构
*   `index.html`: 包含所有样式、逻辑和渲染引擎的独立文件。
*   `INTEGRATION_GUIDE.md`: 向开发人员说明如何将此模块接入真实的 AI 语音系统。
```

---

### 3. 文件名: `INTEGRATION_GUIDE.md`

这个文件是给开发人员看的，解释如何把这个动画接入到你真实的语音助手逻辑中。

```markdown
# 开发接入文档

## 1. 初始化
NOVA Core 被封装在全局对象 `NovaCore` 中。在页面加载时它会自动初始化。

## 2. API 控制接口

### 切换状态
当你的 AI 系统状态发生变化时（例如开始录音、AI 开始思考、AI 开始播放语音），调用此方法：

```javascript
// 切换到待机模式
NovaCore.setMode('IDLE');

// 切换到监听模式（用户正在说话）
NovaCore.setMode('LISTEN');

// 切换到表达模式（AI 正在回复）
NovaCore.setMode('SPEAK');
```

### 接入真实音频数据

默认情况下，代码内部会使用 `simulateAudio()` 产生随机波形用于演示。若要接入真实的麦克风或 TTS 音频数据：

1. 打开 `index.html`，找到 `simulateAudio()` 函数并将其**注释掉**或**删除**。
2. 在你的音频处理逻辑（如 Web Audio API 的 `AnalyserNode`）中，计算出当前的音量值（归一化到 0.0 - 1.0 之间）。
3. 每帧或定时调用以下方法更新视觉核心：

```javascript
// value 范围：0.0 (静音) ~ 1.0 (最大音量)
NovaCore.setEnergy(value); 
```

## 3. 自定义配置

你可以在 `index.html` 的脚本部分顶部找到以下常量进行修改：

* **PIXEL_SIZE**: 控制像素点的大小。默认 `6`。数值越大画面越模糊/复古。
* **SYS.colors**: 修改三种状态下的颜色 Hex 值。

## 4. 性能优化

该引擎使用了 `image-rendering: pixelated`，这意味着 Canvas 的实际分辨率仅为屏幕分辨率的 `1/PIXEL_SIZE`。因此性能开销极低，适合在移动端或低功耗设备上运行。

```

```
