<div align="center">

<a href="https://github.com/tree-people-Z/Sycamore#readme">
  <svg width="80" height="80" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#c4956a"/>
        <stop offset="100%" stop-color="#7a9e6b"/>
      </linearGradient>
    </defs>
    <rect width="256" height="256" rx="56" fill="url(#logoGrad)"/>
    <g transform="translate(128,128) scale(6.5) translate(-11.5,-11.5)" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </g>
  </svg>
</a>

# **Sycamore**

**桌面富文本 & Markdown 编辑器** · Electron + React + Tiptap

[![Version](https://img.shields.io/github/v/release/tree-people-Z/Sycamore?style=flat-square&label=版本&color=c4956a)](https://github.com/tree-people-Z/Sycamore/releases)
[![License](https://img.shields.io/badge/许可证-MIT-7a9e6b?style=flat-square)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-33-47848f?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Platform](https://img.shields.io/badge/平台-Windows-0078D6?style=flat-square&logo=windows&logoColor=white)](https://github.com/tree-people-Z/Sycamore/releases)
[![Stars](https://img.shields.io/github/stars/tree-people-Z/Sycamore?style=flat-square&label=Stars&color=ffd700)](https://github.com/tree-people-Z/Sycamore)

</div>

---

<details open>
<summary><strong>📑 目录</strong></summary>

- [✨ 功能介绍](#-功能介绍)
- [📸 截图](#-截图)
- [📦 安装指南](#-安装指南)
- [🚀 快速上手](#-快速上手)
- [🔧 配置](#-配置)
- [⌨️ 快捷键](#-快捷键)
- [🏗️ 项目结构](#️-项目结构)
- [🤝 贡献指南](#-贡献指南)
- [📄 许可证](#-许可证)

</details>

---

## ✨ 功能介绍

<table>
<tr>
<td width="50%">

### 📝 富文本编辑
基于 **Tiptap** (ProseMirror) 的所见即所得编辑体验
- Markdown 快捷输入
- 斜杠菜单 `/` 快速插入
- 浮动工具栏选中即现
- Wiki 链接 `[[]]`
- 实时编辑高亮

</td>
<td width="50%">

### 🤖 AI 助手
多提供商 AI 聊天面板，辅助写作
- **OpenAI · DeepSeek · OpenRouter** 等
- 自定义 API 端点
- 128K 上下文管理
- 自动摘要压缩
- 润色 / 续写 / 总结 / 翻译

</td>
</tr>
<tr>
<td>

### 📊 Mermaid 图表
编辑器内直接插入 9 种图表类型
- 流程图、时序图、类图、状态图
- ER 图、甘特图、饼图、旅程图
- 实时预览与编辑
- ChartDialog 模板插入

</td>
<td>

### 📐 LaTeX 公式
基于 **KaTeX** 的高质量数学公式渲染
- 行内公式 `$...$`
- 块级公式 `$$...$$`
- 图表对话框实时预览

</td>
</tr>
<tr>
<td>

### 🎨 三主题切换
- **亮色** — 清爽浅白
- **暗色** — 护眼深色
- **Sycamore** — 暖棕复古（默认）

</td>
<td>

### 📁 文件管理
- 侧边栏树形/列表浏览
- 关联本地文件夹
- 搜索笔记内容
- 重命名 / 删除（回收站）/ 恢复
- 批量导入 Markdown

</td>
</tr>
<tr>
<td>

### 🔌 导出与导入
- **HTML** 导出（含样式）
- **Markdown** 导出
- **PDF** 导出
- Markdown 文件导入
- 批量导入

</td>
<td>

### 🧩 强大编辑器
- **代码高亮** — 190+ 语言
- **表格** — 可调整列宽
- **任务列表** — 可勾选
- **图片 & 链接**
- **专注模式**
- **自动保存**

</td>
</tr>
</table>

---

## 📸 截图

<img width="1920" height="1050" alt="Sycamore 截图" src="https://github.com/user-attachments/assets/c4a65289-88fa-46ea-a70e-9ed5a5954db6" />
<img width="1920" height="1050" alt="Sycamore 截图" src="https://github.com/user-attachments/assets/2fd075d5-3f4a-4119-bba1-4f755c7dc29d" />
<img width="1920" height="1050" alt="Sycamore 截图" src="https://github.com/user-attachments/assets/426ff2b8-8f89-44bc-a858-e31eb6742451" />

---

## 📦 安装指南

<details>
<summary><strong>前置要求</strong></summary>

- **Node.js** >= 18
- **npm** >= 9

</details>

<table>
<tr>
<th>命令</th>
<th>说明</th>
</tr>
<tr>
<td>

```bash
npm install
```

</td>
<td>安装依赖</td>
</tr>
<tr>
<td>

```bash
npm run dev
```

</td>
<td>启动 Vite 开发服务器（浏览器预览）</td>
</tr>
<tr>
<td>

```bash
npm run electron:dev
```

</td>
<td>启动 Electron 应用</td>
</tr>
<tr>
<td>

```bash
npm start
```

</td>
<td>同时启动 Vite + Electron（热重载）</td>
</tr>
<tr>
<td>

```bash
npm run build
```

</td>
<td>构建生产版本</td>
</tr>
<tr>
<td>

```bash
npm run pack
```

</td>
<td>打包为 Windows 安装包（`release/` 目录）</td>
</tr>
</table>

---

## 🚀 快速上手

1. **📄 新建笔记** — 点击「新建笔记」或按 <kbd>⌘N</kbd>
2. **✍️ 写作** — 直接在编辑区输入，支持 Markdown 语法
3. **🎨 格式化** — 工具栏按钮或选中文本弹出浮动工具栏
4. **⚡ 插入内容** — 输入 <kbd>/</kbd> 唤出斜杠菜单
5. **🤖 AI 对话** — 选中文字 → 浮动工具栏 AI 图标 → 右侧面板
6. **📁 文件管理** — 侧边栏浏览，可关联本地文件夹
7. **🎭 主题切换** — 工具栏主题按钮（亮色 → 暗色 → Sycamore）
8. **🔍 专注模式** — 状态栏切换，隐藏干扰元素

### AI 配置

1. 打开 **设置**（工具栏 ⚙️ 图标）→ **AI** 选项卡
2. 选择 **AI 提供商**（OpenAI、DeepSeek、OpenRouter 等）
3. 输入 **API Key**
4. 输入 **模型名称**
5. 点 **检测** 验证连接
6. 可选调整 **Max Tokens** / **Temperature**

---

## 🔧 配置

| 提供商 | 基础 URL | 推荐模型 |
|--------|----------|----------|
| **OpenAI** | `https://api.openai.com/v1` | `gpt-4o`, `gpt-4o-mini` |
| **DeepSeek** | `https://api.deepseek.com` | `deepseek-chat`, `deepseek-reasoner` |
| **OpenRouter** | `https://openrouter.ai/api/v1` | `openai/gpt-4o`, `anthropic/claude-sonnet-4` |
| **Groq** | `https://api.groq.com/openai/v1` | `llama-4-scout`, `mixtral-8x7b` |
| **智谱 GLM** | `https://open.bigmodel.cn/api/paas/v4` | `glm-4`, `glm-4v` |
| **阿里百炼** | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus`, `qwen-turbo` |
| **硅基流动** | `https://api.siliconflow.cn/v1` | `deepseek-ai/DeepSeek-V3` |
| **月之暗面** | `https://api.moonshot.cn/v1` | `moonshot-v1` |
| **Ollama** | `http://localhost:11434/v1` | `qwen2.5`, `deepseek-r1` |

> 支持任何兼容 OpenAI 格式的自定义 API 端点。

---

## ⌨️ 快捷键

| 操作 | 快捷键 | 操作 | 快捷键 |
|------|--------|------|--------|
| **新建** | <kbd>⌘N</kbd> | **打开** | <kbd>⌘O</kbd> |
| **保存** | <kbd>⌘S</kbd> | **另存为** | <kbd>⌘⇧S</kbd> |
| **撤销** | <kbd>⌘Z</kbd> | **重做** | <kbd>⌘⇧Z</kbd> |
| **加粗** | <kbd>⌘B</kbd> | **斜体** | <kbd>⌘I</kbd> |
| **删除线** | <kbd>⌘⇧X</kbd> | **高亮** | <kbd>⌘⇧H</kbd> |
| **代码** | <kbd>⌘E</kbd> | **链接** | <kbd>⌘K</kbd> |
| **导出 HTML** | <kbd>⌘⇧H</kbd> | **导出 MD** | <kbd>⌘⇧M</kbd> |
| **导入 MD** | <kbd>⌘⇧I</kbd> | **导出 PDF** | <kbd>⌘⇧P</kbd> |

> 所有快捷键可在 **设置 → 快捷键** 中自定义。

---

## 🏗️ 项目结构

<details>
<summary>展开查看</summary>

```
Sycamore/
├── build-assets/              # 应用图标
│   ├── icon.svg & icon.ico
├── electron/                  # Electron 主进程
│   ├── main.ts                # 窗口管理、IPC、文件操作
│   ├── preload.ts             # contextBridge API
│   └── export-template.ts     # HTML 导出模板
├── src/
│   ├── components/            # React 组件
│   │   ├── AiChatPanel.tsx    #   AI 聊天面板
│   │   ├── SettingsPanel.tsx  #   设置面板
│   │   ├── Toolbar.tsx        #   主工具栏
│   │   ├── Sidebar.tsx        #   侧边栏
│   │   ├── WelcomePage.tsx    #   欢迎页
│   │   └── ...更多
│   ├── editor/                # 编辑器核心
│   │   ├── Editor.tsx         #   编辑器主组件
│   │   ├── extensions/        #   Tiptap 扩展
│   │   └── MathBlockView.tsx
│   ├── hooks/                 # React Hooks
│   │   ├── useTheme.ts
│   │   ├── useFileSystem.ts
│   │   └── ...11 个 hook
│   ├── utils/                 # 工具函数
│   │   ├── markdown-convert.ts
│   │   ├── openai.ts
│   │   └── ...
│   └── App.tsx                # 应用根组件
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

</details>

---

## 🤝 贡献指南

1. **Fork** 本项目
2. 创建你的特性分支：`git checkout -b feat/my-feature`
3. 提交你的改动：`git commit -m 'feat: add something'`
4. 推送到分支：`git push origin feat/my-feature`
5. 发起 **Pull Request**

### 开发命令

| 命令 | 功能 |
|------|------|
| `npm run dev` | 启动 Vite |
| `npm run electron:dev` | 启动 Electron |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run lint` | ESLint 代码检查 |
| `npm run format` | Prettier 格式化 |

---

## 🧰 技术栈

| 类别 | 技术 |
|------|------|
| **框架** | Electron 33 + React 18 + TypeScript 5 |
| **编辑器** | Tiptap 3 (ProseMirror) |
| **构建** | Vite 5 + vite-plugin-electron |
| **样式** | Tailwind CSS 3 + PostCSS |
| **图标** | Lucide React |
| **AI** | OpenAI 兼容 API（多提供商） |
| **图表** | Mermaid 11 |
| **公式** | KaTeX 0.16 |
| **代码高亮** | lowlight (highlight.js) |
| **Markdown** | marked + TurndownService |
| **打包** | electron-builder (NSIS) |

---

## 📄 许可证

[MIT](LICENSE) © [Tree people](https://github.com/tree-people-Z)

---

<div align="center">
  <sub>用 ❤️ 和 ☕ 打造</sub>
</div>
