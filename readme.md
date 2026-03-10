<div align="center">

<img src="https://img.shields.io/badge/DeepSeek-V3.2-ff6b35?style=for-the-badge" />
&nbsp;
<img src="https://img.shields.io/badge/零依赖-✓-22c55e?style=for-the-badge" />
&nbsp;
<img src="https://img.shields.io/badge/单文件-157.8_KB-3b82f6?style=for-the-badge" />
&nbsp;
<img src="https://img.shields.io/badge/许可证-MIT-a855f7?style=for-the-badge" />

# DeepSeek Chat UI

**一个完全自包含的单文件 DeepSeek API 网页客户端。**  
无需构建步骤，无需 Node.js，无需任何框架。打开 `index.html` 即可使用。

[功能特性](#-功能特性) · [快速开始](#-快速开始) · [架构](#-架构) · [配置参考](#%EF%B8%8F-配置参考) · [键盘快捷键](#-键盘快捷键)

</div>

---

## 概述

DeepSeek Chat UI 是一个经过精心工程化的生产级聊天界面，以单个 `index.html` 文件的形式交付。它完整实现了 DeepSeek Chat API 的全部能力——包括流式输出、推理思维链、LaTeX 数学公式渲染、语法高亮代码块——全部基于原生 HTML、CSS 和 JavaScript 实现，无需编译，无需包管理器，无需服务器。

所有外部依赖均在运行时从 CDN 加载。所有应用状态存储在浏览器的 `localStorage` 中。将文件放到任何地方——静态服务器、本地文件系统、U 盘——直接运行。

---

## ✨ 功能特性

### 核心对话

- **基于 Fetch API 的 Server-Sent Events (SSE) 流式输出**，通过 `ReadableStream` + `TextDecoder` 管道将 token 以亚帧延迟写入 DOM
- **`AbortController` 驱动的流取消机制**——停止按钮会彻底关闭 HTTP 连接，防止资源泄漏
- **双模型支持**：`deepseek-chat`（DeepSeek V3.2 通用对话）和 `deepseek-reasoner`（V3.2 深度思考模式），可随时切换，模型选择按会话独立记忆
- **增量 DOM 渲染**：助手消息 token 通过 `createTextNode()` 逐字追加，杜绝 `innerHTML` 反复解析、杜绝布局抖动、杜绝已渲染节点被销毁
- **`requestAnimationFrame` 调度滚动**——流式输出期间的自动滚动与 token 写入循环解耦，消除强制回流（forced reflow）
- **动态打字指示器**（三点弹跳动画，`typingBounce` 关键帧）——从请求发出到第一个 token 到达之间全程显示，给予即时视觉反馈
- **未读消息徽章**——当用户滚动到历史消息区域时，"回到底部"按钮实时显示新增 chunk 数量
- **跨会话模型持久化**——切换模型的操作被记录在会话维度，历史回放时使用对应会话的正确模型

### 推理思维链（深度思考模式）

- 完整解析 `reasoning_content` 流字段，在正文上方渲染可折叠的"思考块"
- **双层错相 shimmer 动画**（`shimmer1`/`shimmer2` 关键帧，0.7 秒相位偏移）在推理进行时展示加载效果
- **音频波形风格思考图标**——五根高度各异的竖条，以 `thinkWave` 关键帧驱动
- **CSS Grid `grid-template-rows: 0fr → 1fr` 展开动画**——GPU 合成，适配任意内容高度，彻底告别 `max-height` hack，零额外布局开销
- **`iconPop` 弹簧动画**在推理完成时触发（scale `0 → 1.1 → 1.0`），配合完成图标
- 推理耗时显示为"已深度思考 Xs"
- 完成后延迟 600 毫秒自动折叠，让用户在折叠前看清最终状态
- 中断（Abort）处理器也能正确收尾思考块——完整渲染 Markdown + KaTeX、移除 streaming 类、触发折叠

### Markdown 与数学公式渲染

- **marked.js 9.1.6**，使用自定义 `Renderer` 覆写全部块级元素：标题、段落、列表、引用块、代码、表格、分隔线
- **highlight.js 11.9.0** 提供 189 种语言语法高亮，通过 marked 的 `highlight` 回调注入
- **KaTeX 0.16.11** 渲染 LaTeX 数学公式，支持行间公式（`$$...$$`）和行内公式（`$...$`）
- **mhchem 扩展**（`katex/contrib/mhchem`）支持化学方程式渲染（`\ce{H2O}`、反应箭头、同位素标注）
- **copy-tex 扩展**（`katex/contrib/copy-tex`）——点击任意已渲染公式即可将其 LaTeX 源码复制到剪贴板
- **266 个自定义 KaTeX 宏**，覆盖：常用数集（ℝ、ℂ、ℕ、ℤ、ℚ）、算子（argmax、argmin、tr、rank、diag、span、prox、sign）、微积分（∂、∇、Laplacian）、线性代数（转置 `\T`、内积、外积、范数 `\norm{}`）、概率论（𝔼、Var、Cov、KL 散度 `\KL{}{}`）、渐进复杂度（`\bigO`、`\bigOmega`、`\bigTheta`）以及 SI 单位
- **延迟排版调度**：`scheduleTypeset()` 将数学渲染批量化，避免阻塞流式 token 写入循环
- **`\pm` 符号冲突修复**——SI 皮米别名已重命名为 `\pm_unit`，防止覆盖 KaTeX 原生 `±` 运算符
- 代码块复制按钮附带 ✓ 确认闪烁反馈，语言标签大写等宽字体展示
- 表格在窄视口下水平滚动溢出

### 会话管理

- **多会话持久化存储**，使用 `localStorage` 键 `ds_sessions_v2` 和 `ds_chat_session`；数据在页面刷新、标签页关闭、浏览器重启后均完整保留
- 会话数量无上限，每条会话存储：`id`、`title`、`model`、`history[]`、`createdAt`、`updatedAt`
- **自动标题生成**：第一条助手回复到来后，截取用户首条消息前 28 个字符作为会话标题
- **按日期分组**：今天 / 昨天 / 本周 / 更早
- **精确相对时间戳**：`刚刚`、`5分钟前`、`3小时前`、`2天前`、`3/15`
- **实时会话搜索**——同时过滤标题和全部消息历史内容，命中词以 `<mark>` 标签高亮
- **消息预览**——hover 或选中时在标题下方显示最后一条助手回复的单行摘要（已剥离 Markdown 标记符）
- **流式输出指示点**（`streamDot` 关键帧驱动的脉冲圆点）在生成过程中附加在活跃会话标题后
- 侧边栏顶部实时显示会话计数徽章
- 导入/导出为结构化 JSON（`DeepSeek-Backup-YYYY-MM-DD.json`），通过 `Blob` + `URL.createObjectURL` + 程序化 `<a>` 点击实现导出；通过 `FileReader` API 实现导入
- 一键清理 30 天前的会话，精确回收字节级存储空间

### 用户消息编辑

- **内联编辑模式**——点击铅笔图标，消息气泡原地替换为预填原文的自动伸缩 `<textarea>`
- **重发并裁剪历史**——保存编辑内容时，自动删除被编辑消息之后的全部 DOM 行和会话历史记录，然后以修订后的内容重新发起请求
- 编辑框最大高度 200 px，超出后内部滚动，与主输入框的 `handleInput()` 逻辑保持一致

### 输入区域

- **自动伸缩文本框**——从 1 行逐步增高至 160 px，超出后内部滚动
- **字符计数器**：超过 200 字时在输入框右下角显示，接近 3 800 字（典型上下文限制）时变红，使用 `font-variant-numeric: tabular-nums` 防止数字宽度抖动
- **动态快捷键提示栏**——输入框下方实时显示当前发送方式（按 Enter 发送 / 按 Ctrl+Enter 发送），随设置变更即时更新
- 组合输入法事件守卫（`isComposing` 检测）防止 CJK 输入法确认时意外发送消息

### 长按操作面板（移动端）

- 消息区域 520 毫秒长按触发，内部维护 `timer`/`target` 状态机
- 底部上滑面板（`slideUp` 关键帧），带拖动把手
- **复制全文**：优先读取 `data-raw` 属性中保留的原始 Markdown，而非 `innerText`
- **系统原生分享**：调用 `navigator.share()` Web Share API；不支持时降级为剪贴板复制
- 通过一次性 `touchstart` 监听器实现点击外部自动关闭

### 设置与配置

- **底部浮层（Bottom Sheet）**：弹簧曲线（`--ease-spring` 自定义三次贝塞尔）驱动的 `transform: translateY(100%) → 0` 入场动画
- `backdrop-filter: blur(8px)` 遮罩层，使用 `visibility`/`opacity` 双重切换，避免 `display: none` 动画中断的无障碍问题
- 五个设置分组：接口连接 / 系统提示词 / 输入与显示 / 上下文管理 / 数据管理
- **滑动上下文窗口**——启用后每次请求仅携带最近 N 条消息（可配置，默认 20），大幅节省长会话的 token 消耗；界面展示历史不受影响
- 系统提示词 textarea，持久化存储，每次请求自动注入
- 字体大小（小 / 中 / 大）与消息间距（紧凑 / 舒适 / 宽松）通过 CSS 自定义属性实时应用
- API Key 显示/隐藏切换按钮；密钥仅存储在本地，除配置的 Base URL 外不向任何服务器传输
- 自定义 Base URL 支持反向代理和区域节点
- 实时存储用量进度条（渐变色填充）+ 字节级用量显示 + 接近上限时的警告横幅
- API Key 填写提示内嵌 `platform.deepseek.com` 跳转链接

### 侧边栏

- **品牌头部**：Logo + 应用名 + 版本徽章（V3.2）
- 橙色渐变"新建对话"按钮，带发光阴影与 `filter: brightness` hover 效果
- 全文实时搜索，`oninput` 无防抖直接响应
- 两种空状态插图：无会话时显示对话气泡 SVG，搜索无结果时显示搜索 SVG，文案各自定制
- 活跃会话左边框指示条（3 px 品牌色竖线，通过 `::before` 伪元素实现）
- 底部区域用分隔线划分为"数据操作（导入/导出）"和"应用配置（设置）"两个功能区
- 移动端支持边缘滑入手势：`touchstart`/`touchmove` 监听，触发区域为左边缘 30 px；遮罩点击或 Escape 键关闭

### 动画（11 个命名关键帧）

| 关键帧 | 用途 |
|---|---|
| `dropIn` | 新消息行入场 |
| `fadeUp` | 欢迎屏元素渐入上移 |
| `shimmer1` / `shimmer2` | 思考块加载闪光（双层错相） |
| `thinkWave` | 推理中的五柱波形图标 |
| `iconPop` | 思考完成对勾弹簧弹出 |
| `thinkFadeIn` | 思考块内容淡入 |
| `cursorFade` | 流式输出光标脉冲 |
| `sessionFlash` | 会话条目创建/切换高亮 |
| `slideUp` | 移动端操作面板上滑 |
| `spin` | 加载旋转 |
| `typingBounce` | 预流式三点打字指示器 |

### 移动端与 PWA

- `<meta name="apple-mobile-web-app-capable">` 和 `<meta name="apple-mobile-web-app-status-bar-style">` 支持 iOS 添加到主屏幕
- `env(safe-area-inset-bottom)` 应用于全部底部固定元素（输入栏、Toast、侧边栏底部）
- 消息列表和会话列表均设置 `overscroll-behavior: contain`，防止触发页面级弹跳干扰
- 全部交互元素设置 `-webkit-tap-highlight-color: transparent`
- `visualViewport` resize 监听，iOS Safari 软键盘弹出时自动将内容上推
- 删除按钮、操作按钮触摸目标在 `max-width: 768px` 时扩展至 28×28 px

### 触觉反馈

`navigator.vibrate()` 使用三种独立振动模式：

| 类型 | 模式 | 触发时机 |
|---|---|---|
| `light` | 10 ms | 消息发送 |
| `medium` | 20 ms | 长按激活 |
| `success` | 10-50-10 ms | 复制成功 |

### 无障碍与交互细节

- 全部纯图标按钮均设置 `aria-label`
- API Key 眼睛按钮设置 `tabindex="-1"`（装饰性，不进入 Tab 顺序）
- Toast 通知弹簧入场、2.5 秒自动消失、`pointer-events: none` 防止阻挡交互
- 滚到底部按钮附带实时未读计数徽章，到达底部自动隐藏
- 代码块复制按钮显示"✓ 已复制"2 秒后复原——使用 `setTimeout` 而非纯 CSS 实现，支持快速多次点击
- `showCopyFallbackModal()` 兜底——同时无法使用 `navigator.clipboard` 和 `execCommand` 时（如非 HTTPS iframe），显示手动复制弹窗

---

## 🚀 快速开始

```bash
# 克隆仓库
git clone https://github.com/your-username/deepseek-chat-ui.git
cd deepseek-chat-ui

# 直接打开（本地文件）
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

建议通过 HTTP 服务启动（可完整使用剪贴板 API）：

```bash
python3 -m http.server 8080
# 浏览器访问 → http://localhost:8080
```

1. 打开应用
2. 点击侧边栏底部的 **偏好设置**
3. 粘贴你的 DeepSeek API Key（`sk-...`）
4. 点击 **保存设置**
5. 开始对话

在 [platform.deepseek.com](https://platform.deepseek.com) 获取 API Key。

---

## 🏗 架构

```
index.html  （157.8 KB，3716 行）
├── <head>
│   ├── CDN: highlight.js 11.9.0
│   ├── CDN: marked.js 9.1.6
│   ├── CDN: KaTeX 0.16.11 + mhchem + copy-tex
│   └── <style>（约 720 行）
│       ├── CSS 自定义属性（43 个设计 token）
│       ├── 基础 / 重置样式
│       ├── 布局（侧边栏 + 主区域 + 顶栏）
│       ├── 消息气泡 + Markdown 内容
│       ├── 思考块（streaming 态 + done 态）
│       ├── 代码块 + 复制按钮
│       ├── 输入区域 + 发送/停止按钮
│       ├── 设置底部浮层
│       ├── 欢迎屏 + 快捷入口芯片
│       ├── Toast + 滚到底部徽章
│       ├── 侧边栏（品牌 + 搜索 + 会话列表 + 底部）
│       ├── 11 个 @keyframes 动画
│       └── 移动端适配（@media ≤ 768px）
├── <body>
│   ├── #sidebar
│   │   ├── .sidebar-brand（Logo + 名称 + 版本）
│   │   ├── .sidebar-search-wrap（实时搜索输入框）
│   │   ├── .sidebar-section-header（标签 + 计数徽章）
│   │   ├── #session-list（动态渲染）
│   │   └── .sidebar-footer（导入 / 导出 / 设置）
│   ├── #app
│   │   ├── #header（菜单切换 + 模型选择下拉）
│   │   ├── #messages-wrap
│   │   │   └── #messages（用户 + 助手消息行）
│   │   └── #input-area
│   │       ├── #input-bar（textarea + 字符计数 + 发送/停止）
│   │       └── #input-hint（动态键盘快捷键提示）
│   ├── #settings-overlay → #settings-sheet
│   ├── #scroll-down（+ #scroll-down-badge 未读徽章）
│   └── #toast
└── <script>（约 2400 行）
    ├── 常量 & localStorage 键名
    ├── 应用状态对象
    ├── KaTeX 宏注册表（266 条）
    ├── Markdown / 数学 / 高亮渲染管线
    ├── 消息 DOM 构建器（用户 + 助手）
    ├── 思考块渲染器 + 流解析器
    ├── 会话增删改查 + 搜索 + 分组
    ├── 流式引擎（SSE / Fetch / AbortController）
    ├── 设置持久化 + 显示偏好应用
    ├── 侧边栏滑动手势 + 搜索过滤
    ├── 长按操作面板（移动端）
    ├── 用户消息内联编辑
    ├── 键盘快捷键（全局 + 文本框）
    ├── 触觉反馈
    ├── 导入 / 导出（Blob + FileReader）
    ├── 存储用量统计 + 清理
    └── 初始化 + visibility/pagehide 持久化
```

---

## ⚙️ 配置参考

所有设置持久化到 `localStorage`，页面刷新后完整恢复。

### 应用状态对象

```javascript
const state = {
  model:            'deepseek-chat',        // 'deepseek-chat' | 'deepseek-reasoner'
  apiKey:           '',                     // sk-...
  baseUrl:          'https://api.deepseek.com',
  systemPrompt:     '',                     // 作为 system 消息注入每次对话
  enableSliding:    true,                   // 是否启用滑动上下文窗口
  maxContextSize:   20,                     // 每次请求携带的最大消息数（2–200）
  sessions:         [],                     // Session[]
  currentSessionId: null,
  isStreaming:      false,
  abortController:  null,
  streamingSessionId: null,
  enterSend:        true,                   // Enter 发送 vs Ctrl+Enter 发送
  fontSize:         'medium',              // 'small' | 'medium' | 'large'
  msgSpacing:       'comfortable',         // 'compact' | 'comfortable' | 'spacious'
}
```

### localStorage 数据结构

```
ds_sessions_v2   →  Session[]         （全部会话数据）
ds_chat_session  →  { ...state }      （UI 偏好 + 当前会话 ID）
```

```typescript
interface Session {
  id:          string;           // genId() 生成，8 位字母数字
  title:       string;           // 自动截取自首条用户消息
  model:       string;           // 'deepseek-chat' | 'deepseek-reasoner'
  history:     Message[];
  createdAt:   number;           // Unix 毫秒时间戳
  updatedAt:   number;           // 每条消息后更新
}

interface Message {
  role:               'user' | 'assistant' | 'system';
  content:            string;
  reasoning_content?: string;    // 仅 deepseek-reasoner 模型返回
}
```

### CSS 设计 Token（43 个自定义属性）

视觉主题完全参数化，所有颜色、间距、圆角、阴影、排版均以 `--custom-properties` 形式声明在 `:root` 上，可通过一段 CSS 覆写整套主题。

| 分类 | 属性 |
|---|---|
| **强调色** | `--accent`、`--accent2`、`--accent-rgb` |
| **背景层** | `--bg`、`--bg2`、`--bg3` |
| **文字层** | `--text`、`--text2`、`--text3` |
| **边框** | `--border`、`--border2` |
| **阴影** | `--shadow-xs`、`--shadow-sm`、`--shadow`、`--shadow-md`、`--shadow-lg` |
| **圆角** | `--radius-sm`、`--radius`、`--radius-lg`、`--radius-xl` |
| **侧边栏** | `--sidebar-bg`、`--sidebar-hover`、`--sidebar-act`、`--sidebar-w` |
| **代码块** | `--code-bg`、`--code-border` |
| **思考块** | `--think-bg`、`--think-bg-done`、`--think-border`、`--think-accent`、`--think-accent-dim`、`--think-text`、`--think-text-dim` |
| **用户气泡** | `--user-bg`、`--user-border` |
| **缓动函数** | `--ease-spring`、`--ease-out`、`--ease-in-out` |
| **排版** | `--font`、`--mono`、`--chat-font-size` |
| **布局** | `--header-h`、`--msg-gap` |

---

## ⌨️ 键盘快捷键

| 快捷键 | 功能 |
|---|---|
| `Enter` | 发送消息（启用 Enter 发送时） |
| `Shift+Enter` | 插入换行 |
| `Ctrl+Enter` / `Cmd+Enter` | 发送消息（禁用 Enter 发送时） |
| `Cmd+K` / `Ctrl+K` | 新建对话 |
| `Cmd+/` / `Ctrl+/` | 聚焦输入框 |
| `Escape` | 关闭设置面板 / 关闭侧边栏 / 关闭模型下拉 |

---

## 🔢 LaTeX / 数学公式支持

数学公式由 KaTeX 0.16.11 渲染，支持行内与行间两种模式：

```
行内公式：$E = mc^2$
行间公式：$$\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$
```

**内置 266 个自定义宏**，按领域分类：

- **数集**：`\R` ℝ、`\C` ℂ、`\N` ℕ、`\Z` ℤ、`\Q` ℚ
- **算子**：`\argmax`、`\argmin`、`\tr`、`\rank`、`\diag`、`\span`、`\prox`、`\sign`、`\relu`、`\softmax`
- **微积分**：`\pd{f}{x}`（偏导数）、`\grad` ∇、`\laplacian` Δ
- **线性代数**：`\T`（转置上标）、`\norm{x}` ‖x‖、`\abs{x}` |x|、`\inner{a}{b}` ⟨a,b⟩
- **概率论**：`\E` 𝔼、`\Var`、`\Cov`、`\KL{P}{Q}`、`\Normal{μ}{σ²}`
- **渐进复杂度**：`\bigO`、`\bigOmega`、`\bigTheta`、`\softO`
- **化学**（mhchem）：`\ce{H2SO4}`、反应方程式、同位素标注

点击任意已渲染公式即可复制其 LaTeX 源码（由 copy-tex 扩展实现）。

---

## 📦 外部依赖（CDN 加载）

运行时从 CDN 加载，本地无需安装任何包。

| 库 | 版本 | 用途 |
|---|---|---|
| highlight.js | 11.9.0 | 语法高亮（189 种语言） |
| marked.js | 9.1.6 | Markdown 解析转 HTML |
| KaTeX | 0.16.11 | LaTeX 数学公式渲染 |
| KaTeX mhchem | 0.16.11 | 化学方程式扩展 |
| KaTeX copy-tex | 0.16.11 | 点击复制 LaTeX 源码 |

CDN 来源：`cdnjs.cloudflare.com` 和 `cdn.jsdelivr.net`。如需离线使用，可将上述资源下载到本地并修改对应的 `<script src>` 和 `<link href>`。

---

## 🔒 隐私说明

- **无遥测，无埋点，无追踪**。除上述渲染库外无任何第三方脚本。
- **无服务端**。应用只会向你配置的 Base URL（即 DeepSeek API 端点）发起 HTTP 请求，除此之外不与任何服务器通信。
- **所有数据留存本地**。会话历史、API Key、全部偏好设置均仅存储在浏览器的 `localStorage` 中。
- API Key 以明文形式存储在 `localStorage`。在共享设备上使用时，建议使用浏览器的隐私/无痕模式。

---

## 🌐 浏览器兼容性

| 浏览器 | 状态 |
|---|---|
| Chrome / Edge 90+ | ✅ 完整支持 |
| Firefox 90+ | ✅ 完整支持 |
| Safari 15.4+（含 iOS） | ✅ 完整支持 |
| Safari < 15.4 | ⚠️ `backdrop-filter` 可能降级 |

运行要求：Fetch API、ReadableStream、TextDecoder、localStorage、CSS 自定义属性、CSS Grid。

---

## 📄 许可证

MIT — 随意使用、修改、分发。

---

<div align="center">
<sub>基于原生 HTML · CSS · JavaScript 构建 &nbsp;·&nbsp; 无构建步骤 &nbsp;·&nbsp; 无本地依赖 &nbsp;·&nbsp; 无框架</sub>
</div>