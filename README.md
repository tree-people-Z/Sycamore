<img width="1920" height="1050" alt="屏幕截图 2026-05-23 004611" src="https://github.com/user-attachments/assets/9b7e46c9-393f-476a-9135-4722c31002e4" />
<img width="1920" height="1050" alt="屏幕截图 2026-05-23 004640" src="https://github.com/user-attachments/assets/70e75eca-66d7-44c2-be3a-f611f5e4fd14" />
<img width="1920" height="1050" alt="屏幕截图 2026-05-23 005544" src="https://github.com/user-attachments/assets/f91d3b01-b49b-4958-b31d-690b5038d25d" />
# Sycamore

一个基于 Electron + React + Tiptap 的现代化桌面 Markdown 编辑器，提供流畅的富文本编辑体验，支持表格、代码高亮、LaTeX 公式等功能。

## 功能特性

- **富文本编辑** — 基于 Tiptap 的 WYSIWYG 编辑体验，支持 Markdown 快捷输入
- **表格支持** — 插入和编辑表格
- **代码高亮** — 基于 lowlight 的语法高亮，支持多种编程语言
- **LaTeX 公式** — 内联和块级数学公式渲染（基于 KaTeX）
- **图片 & 链接** — 插入图片 URL 和内联链接
- **文本格式化** — 加粗、斜体、下划线、删除线、颜色、高亮、对齐方式
- **斜杠菜单** — 输入 `/` 快速插入各种内容块
- **Wiki 链接** — 支持 `[[内部链接]]` 语法
- **文件管理** — 侧边栏浏览文件，新建、打开、保存笔记，支持文件夹链接
- **导出** — 导出为 HTML 或 PDF
- **多主题** — 亮色 / 暗色 / Sycamore 三种主题切换
- **专注模式** — 隐藏工具栏和状态栏，专注写作
- **自动保存** — 可配置的自动保存间隔
- **未保存提示** — 关闭时检测未保存更改

## 技术栈

- **框架**: Electron + React 18 + TypeScript
- **编辑器**: Tiptap (ProseMirror)
- **构建**: Vite + vite-plugin-electron
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **公式**: KaTeX
- **代码高亮**: lowlight

## 快速开始

### 前置要求

- Node.js >= 18
- npm >= 9

### 安装

```bash
npm install
```

### 开发

```bash
npm run dev
```

启动 Vite 开发服务器：

```bash
npm run dev
```

启动 Electron 应用（先构建再启动）：

```bash
npm run electron:dev
```

或同时启动 Vite + Electron（使用 concurrently）：

```bash
npm start
```

### 构建

```bash
npm run build
```

## 使用

1. 启动应用后，在欢迎页面点击「新建笔记」或「打开文件」
2. 使用顶部工具栏进行格式化操作
3. 在编辑器中输入 `/` 唤出斜杠菜单快速插入内容块
4. 使用侧边栏浏览和管理文件（可链接到本地文件夹）
5. 通过状态栏切换专注模式或调整编辑器宽度

## 许可证

[MIT](LICENSE)
