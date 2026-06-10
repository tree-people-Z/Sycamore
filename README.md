<img width="1920" height="1050" alt="屏幕截图 2026-05-23 004611" src="https://github.com/user-attachments/assets/c4a65289-88fa-46ea-a70e-9ed5a5954db6" />
<img width="1920" height="1050" alt="屏幕截图 2026-05-23 004628" src="https://github.com/user-attachments/assets/2fd075d5-3f4a-4119-bba1-4f755c7dc29d" />
<img width="1920" height="1050" alt="屏幕截图 2026-05-23 005544" src="https://github.com/user-attachments/assets/426ff2b8-8f89-44bc-a858-e31eb6742451" />

# Sycamore

一个基于 Electron + React + Tiptap 的现代化桌面富文本编辑器，提供流畅的所见即所得编辑体验，集成 AI 对话、图表绘制等功能。

---

## 功能特性

### 富文本编辑
- 基于 Tiptap (ProseMirror) 的完整所见即所得编辑体验
- 支持 Markdown 快捷输入（`#` 标题、`-` 列表、`>` 引用、`[]` 任务列表等）
- 选中文本时弹出浮动工具栏，快速进行格式化
- 输入 `/` 唤出斜杠菜单，快速插入标题、代码块、表格、公式等
- Wiki 链接语法 `[[页面名称]]`
- 编辑区域实时高亮当前编辑位置

### AI 助手
- 集成 OpenAI 兼容 API 的内联 AI 聊天面板
- 支持多种 AI 提供商：
  - **OpenAI** — GPT-4o、GPT-4o-mini 等
  - **DeepSeek** — DeepSeek Chat / Reasoner
  - **OpenRouter** — 聚合多模型（Claude、Gemini、Llama 等）
  - **Groq** — Llama、Mixtral 等高速推理
  - **智谱 GLM**、**阿里百炼**、**硅基流动**、**月之暗面**
  - **Ollama** — 本地部署模型
  - 自定义 API 端点，兼容任何 OpenAI 格式的 API
- 基于 Token 计数器的上下文窗口管理（128K 上下文限制）
- 对话历史自动摘要压缩，节省上下文空间
- 快速操作：润色、续写、总结、翻译、简化
- 选中文字后直接发送给 AI 处理

### 图表与公式
- **Mermaid 图表** — 在编辑器中直接插入和编辑 Mermaid 流程图、时序图、类图、状态图、ER 图、甘特图、饼图、旅程图
- **图表对话框** — 通过 ChartDialog 插入预设模板的 Mermaid 图表，实时预览
- **LaTeX 公式** — 内联 `$...$` 和块级 `$$...$$` 数学公式渲染（基于 KaTeX）

### 表格
- 插入和编辑富文本表格
- 支持合并单元格、调整列宽
- 表格内文本格式化

### 代码
- 基于 lowlight 的语法高亮，支持 190+ 种编程语言
- 代码块显示语言标签
- 行内代码格式化

### 文件管理
- 侧边栏文件浏览器，支持树形和列表两种视图
- 关联本地文件夹，快速浏览 `.json` 和 `.md` 文件
- 新建、打开、保存、另存为笔记
- 文件重命名、删除（移到回收站）、恢复
- 在文件管理器中打开文件所在位置
- 批量导入 Markdown 文件
- 搜索文件和笔记内容

### 导出与导入
- **导出 HTML** — 导出为完整 HTML 文档
- **导出 Markdown** — 导出为 `.md` 文件
- **导出 PDF** — 通过 Electron 打印为 PDF
- **导入 Markdown** — 导入 `.md` 文件并转换到编辑器格式
- **批量导入 Markdown** — 批量导入文件夹中的 Markdown 文件

### 文本格式化
- **内联样式** — 加粗、斜体、下划线、删除线、高亮、行内代码、链接
- **颜色** — 自定义文字颜色（12 种预设颜色）
- **对齐** — 左对齐、居中、右对齐
- **块级样式** — 标题（H1-H6）、引用、有序/无序列表、任务列表、分割线

### 主题
- **亮色** — 浅色干净界面
- **暗色** — 深色护眼界面
- **Sycamore（默认）** — 暖色调复古风格界面

### 写作体验
- **专注模式** — 隐藏工具栏和状态栏，当前段落高亮，其他内容淡化
- **编辑器宽度** — 窄/宽两种编辑宽度切换
- **自动保存** — 可配置的自动保存间隔（5s / 15s / 30s / 60s）
- **词数统计** — 状态栏显示文档字数
- **未保存提示** — 关闭前检测未保存更改，提供保存/放弃/取消选项
- **自定义字体大小** — 12px 到 28px 可调
- **自动换行** — 可开关

### 设置
- **排版** — 字体大小、编辑器宽度、自动换行
- **保存** — 自动保存开关和间隔
- **快捷键** — 可自定义的键盘快捷键（支持所有常用操作）
- **AI** — API 提供商选择、API Key 管理、模型名称、高级参数（Max Tokens / Temperature）
- **关于** — 版本信息、GitHub 链接

### 键盘快捷键

| 操作 | 快捷键 |
|------|--------|
| 新建文件 | `⌘N` |
| 打开文件 | `⌘O` |
| 保存 | `⌘S` |
| 另存为 | `⌘⇧S` |
| 撤销 | `⌘Z` |
| 重做 | `⌘⇧Z` |
| 加粗 | `⌘B` |
| 斜体 | `⌘I` |
| 删除线 | `⌘⇧X` |
| 高亮 | `⌘⇧H` |
| 行内代码 | `⌘E` |
| 链接 | `⌘K` |
| 导出 HTML | `⌘⇧H` |
| 导出 Markdown | `⌘⇧M` |
| 导入 Markdown | `⌘⇧I` |
| 导出 PDF | `⌘⇧P` |

*快捷键可在设置中自定义。*

---

## 技术栈

- **框架**: Electron 33 + React 18 + TypeScript 5
- **编辑器**: Tiptap 3 (ProseMirror)
- **构建**: Vite 5 + vite-plugin-electron
- **样式**: Tailwind CSS 3 + PostCSS
- **图标**: Lucide React
- **AI**: OpenAI 兼容 API（自定义端点，支持 OpenRouter 等多提供商）
- **图表**: Mermaid 11
- **公式**: KaTeX 0.16
- **代码高亮**: lowlight (highlight.js)
- **Markdown**: marked + Turndown
- **打包**: electron-builder (NSIS)

---

## 项目结构

```
Sycamore/
├── build-assets/           # 应用图标
│   ├── icon.svg
│   └── icon.ico
├── electron/               # Electron 主进程
│   ├── main.ts             # 主进程入口（窗口管理、IPC、文件操作）
│   ├── preload.ts          # 预加载脚本（contextBridge API）
│   └── export-template.ts  # HTML 导出模板
├── scripts/
│   └── generate-icon.cjs   # 图标生成脚本
├── src/
│   ├── components/         # React 组件
│   │   ├── AiChatPanel.tsx      # AI 聊天面板
│   │   ├── AiProviderDropdown   # AI 提供商下拉框
│   │   ├── ChartDialog.tsx      # 图表插入对话框
│   │   ├── ColorPicker.tsx      # 颜色选择器
│   │   ├── ContextMenu.tsx      # 右键菜单
│   │   ├── Dialogs.tsx          # 对话框管理器
│   │   ├── ErrorBoundary.tsx    # 错误边界
│   │   ├── FormulaDialog.tsx    # 公式插入对话框
│   │   ├── ImageInputDialog.tsx # 图片 URL 输入对话框
│   │   ├── SelectionToolbar.tsx # 浮动格式工具栏
│   │   ├── SettingsPanel.tsx    # 设置面板
│   │   ├── Sidebar.tsx          # 侧边栏文件浏览器
│   │   ├── StatusBar.tsx        # 状态栏
│   │   ├── ToastContainer.tsx   # Toast 通知
│   │   ├── Toolbar.tsx          # 主工具栏
│   │   ├── UnsavedDialog.tsx    # 未保存提示对话框
│   │   ├── WelcomePage.tsx      # 欢迎页
│   │   └── WindowControls.tsx   # 窗口控制按钮
│   ├── editor/             # 编辑器相关
│   │   ├── Editor.tsx           # 编辑器主组件
│   │   ├── MathBlockView.tsx    # 公式块级渲染视图
│   │   ├── MathInlineView.tsx   # 公式内联渲染视图
│   │   └── extensions/          # Tiptap 扩展
│   │       ├── edit-highlight.ts     # 编辑高亮插件
│   │       ├── image-extension.ts    # 图片节点扩展
│   │       ├── math-block.ts         # 块级公式扩展
│   │       ├── math-inline.ts        # 内联公式扩展
│   │       ├── mermaid-extension.tsx # Mermaid 图表扩展
│   │       ├── mermaid-shared.ts     # Mermaid 共享模块
│   │       ├── slash-menu.ts         # 斜杠菜单扩展
│   │       └── wiki-link.ts          # Wiki 链接扩展
│   ├── hooks/              # 自定义 React Hooks
│   │   ├── useAppUIState.ts     # UI 状态管理（useReducer）
│   │   ├── useAutoSave.ts       # 自动保存
│   │   ├── useClickOutside.ts   # 点击外部关闭
│   │   ├── useConversations.ts  # AI 对话管理
│   │   ├── useDialogs.ts        # 对话框管理
│   │   ├── useFileActions.ts    # 文件操作（删除/重命名等）
│   │   ├── useFileSystem.ts     # 文件系统
│   │   ├── useFocusTrap.ts      # 焦点陷阱
│   │   ├── useSettings.ts       # 设置管理
│   │   ├── useTheme.ts          # 主题切换
│   │   ├── useToast.ts          # Toast 通知管理
│   │   └── useUnsavedGuard.ts   # 未保存守卫
│   ├── utils/              # 工具函数
│   │   ├── condense.ts          # AI 对话压缩
│   │   ├── editor-styles.ts     # 编辑器样式应用
│   │   ├── emitter.ts           # 事件发射器
│   │   ├── images.ts            # 图片处理
│   │   ├── markdown-convert.ts  # Markdown 转换
│   │   ├── openai.ts            # OpenAI API 流式请求
│   │   ├── path.ts              # 路径工具
│   │   └── token-counter.ts     # Token 计数器
│   ├── App.tsx             # 应用主组件
│   ├── constants.ts        # 常量定义
│   ├── electron-api.ts     # Electron API 类型声明
│   ├── index.css           # 全局样式
│   ├── main.tsx            # 应用入口
│   └── types.ts            # 类型定义
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## 快速开始

### 前置要求

- Node.js >= 18
- npm >= 9

### 安装

```bash
npm install
```

### 开发

启动 Vite 开发服务器（浏览器预览）：

```bash
npm run dev
```

启动 Electron 应用：

```bash
npm run electron:dev
```

或同时启动 Vite + Electron（热重载）：

```bash
npm start
```

### 构建

```bash
npm run build
```

### 打包

打包为 Windows 安装包（NSIS）：

```bash
npm run pack
```

生成的可执行文件在 `release/` 目录下。

---

## 使用指南

1. **新建笔记** — 启动应用后点击「新建笔记」或按 `⌘N`
2. **写作** — 直接在编辑区输入，支持 Markdown 快捷语法
3. **格式化** — 使用工具栏按钮或选中文本后弹出浮动工具栏
4. **插入内容** — 输入 `/` 唤出斜杠菜单，插入标题、表格、代码块、公式、图表等
5. **AI 对话** — 点击工具栏 AI 按钮或选中文字后点击浮动工具栏 AI 图标，在右侧面板使用 AI 助手
6. **文件管理** — 侧边栏浏览文件，可关联本地文件夹
7. **主题切换** — 点击工具栏主题按钮，在亮色/暗色/Sycamore 间切换
8. **专注写作** — 状态栏点击专注模式按钮，隐藏干扰元素

### AI 配置

1. 打开设置（工具栏右侧齿轮图标）→ **AI** 选项卡
2. 选择 AI 提供商（OpenAI、DeepSeek、OpenRouter、Ollama 等）
3. 输入 API Key
4. 选择/输入模型名称
5. 点击「检测」验证连接
6. 可选：调整 Max Tokens 和 Temperature 高级参数

---

## AI 提供商支持

| 提供商 | 基础 URL | 典型模型 |
|--------|----------|----------|
| OpenAI | `https://api.openai.com/v1` | gpt-4o, gpt-4o-mini |
| DeepSeek | `https://api.deepseek.com` | deepseek-chat, deepseek-reasoner |
| OpenRouter | `https://openrouter.ai/api/v1` | openai/gpt-4o, anthropic/claude-sonnet-4, google/gemini-2.5-flash |
| Groq | `https://api.groq.com/openai/v1` | llama-4-scout, mixtral-8x7b |
| 智谱 GLM | `https://open.bigmodel.cn/api/paas/v4` | glm-4, glm-4v |
| 阿里百炼 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | qwen-plus, qwen-turbo |
| 硅基流动 | `https://api.siliconflow.cn/v1` | DeepSeek-V3, Qwen2.5 |
| 月之暗面 | `https://api.moonshot.cn/v1` | moonshot-v1 |
| Ollama (本地) | `http://localhost:11434/v1` | qwen2.5, deepseek-r1 |

也可添加自定义 API 端点（兼容 OpenAI 格式即可）。

---

## 配置

应用配置保存在浏览器本地存储中，包括：

- **主题**: `sycamore-theme`（Light / Dark / Sycamore）
- **设置**: `editor-settings`（字体大小、编辑器宽度、AI 配置等）
- **关联文件夹**: `editor-linked-folder`
- **对话历史**: 按文档 Key 存储在 `conversations/` 命名空间下

---

## 许可证

[MIT](LICENSE)

---

## 致谢

- [Tiptap](https://tiptap.dev/) — 编辑器核心
- [Mermaid](https://mermaid.js.org/) — 图表渲染
- [KaTeX](https://katex.org/) — 公式渲染
- [lowlight](https://github.com/wooorm/lowlight) — 代码高亮
- [Lucide](https://lucide.dev/) — 图标
