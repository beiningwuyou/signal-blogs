# 📰 Signal Blogs · 私人日报 (暖纸情报研判工作台)

> **专为深度阅读者、行业分析师与独立研究员打造的个人严肃情报与研判工作台。**  
> 告别冷灰刺眼的算法信息流，拥抱温润的出版级纸质排版与 100% 本地隐私安全。

[![React 19](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS 3](https://img.shields.io/badge/Tailwind-Amber--Ink-d97706?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/Storage-Local_SQLite-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Electron](https://img.shields.io/badge/Desktop-Electron_44+-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Local First](https://img.shields.io/badge/Privacy-100%25_Local_First-16a34a)](#-本地优先与隐私安全)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## ✨ 为什么需要 Signal Blogs？

在算法推荐与营销噪音过载的时代，严肃资讯消费面临三大痛点：
1. **界面同质化与视觉疲劳**：千篇一律的暗黑冷灰“黑客风”界面，长时间高密度阅读极易引发眼部疲劳。
2. **云端遥测与隐私外泄**：个人的关注热点、研读笔记和信源画像被商业平台无声采集分析。
3. **事实与观点混淆**：碎片化短讯缺乏上下文证据链，缺少对一手事实（Facts）、来源观点（Takes）与行业底层逻辑的结构化解构。

**Signal Blogs** 重新将“信息主权”交还给读者——运行于你的本地机器，数据永不出门，提供兼具人文出版美感与严肃分析力度的深度研读环境。

---

## 🏛️ 核心设计原则与特性

### 1. 📜 Amber-Ink-Editorial 暖纸人文美学
- **温润燕麦纸质感**：摒弃冰冷科技青灰，采用温润燕麦暖纸底色（`#faf8f5` / `#fcf9f6`）、纯白微卡片、深炭墨排印（`#171614`）与 1px 极细发丝分割线（`#e8e3d8`）。
- **学术出版级字系**：报头大标题选用精装衬线体（EB Garamond / Newsreader），正文搭配高可读性无衬线体（Inter），技术指标与编号采用 JetBrains Mono。

### 2. 🛡️ 本地优先架构 (Local-First & 0% Telemetry)
- **100% 离线与断网可用**：数据完全存储于本机 SQLite 数据库，无任何第三方云端遥测或用户行为跟踪脚本。
- **本地研判闭环**：收藏、500 字研读笔记、阅读足迹、专题关注与自定义信源完全本地持久化。

### 3. 📑 深度研判抽屉 (Slide-over Drawer)
- 针对重点情报一键滑出 560px 沉浸式研读视窗（支持 `Esc` 快速退出与键盘流操作）。
- **结构化研判分离**：严格区隔一手事实（Facts）、来源观点（Takes）、四维解构（算力 / 工程 / 商业 / 供应链）及原文证据链。
- **一键导出**：支持研判卡片与个人笔记一键导出为纯净 Markdown。

### 4. 🗂️ 双维度空间与消费配置解耦
- **个人空间**：私人早报（晨间决策简报）、正在关注（多维标签过滤）、我的阅读（收藏与划线）、浏览足迹、今日回顾。
- **公共广场**：内容广场、每日早报（支持往期树形归档切换）、精选周刊、事件时间轴（分支泳道）。
- **配置与阅读解耦**：信源增删改查、Switch 轮询启停、权重调节与 OPML 导入导出彻底下沉至独立「系统设置」，阅读界面纯粹无噪。

### 5. 💻 Web + 原生桌面双模态
- **本地 Web 模式**：通过极轻量 Node.js 原生 HTTP 服务与 Vite 驱动，监听本地端口。
- **macOS / 跨端桌面应用**：内置 Electron 44+ 入口，支持原生窗口运行与系统快捷键。

---

## 🚀 快速开始

### 环境依赖
- [Node.js](https://nodejs.org/) (推荐 20 LTS 或 24+)
- npm (包版本由 `package-lock.json` 严格锁定)

### 1. 克隆项目与安装依赖
```bash
git clone https://github.com/beiningwuyou/signal-blogs.git
cd signal-blogs
npm ci
```

### 2. 本地 Web 开发模式运行
```bash
# 启动本地服务与 Vite 开发热重载
npm run dev
```
启动成功后，浏览器访问终端输出的本地地址（默认 `http://127.0.0.1:5174` 或 `http://localhost:8080`）。

### 3. 原生桌面客户端运行 (Electron)
```bash
# 构建前端并拉起 Electron 原生桌面窗口
npm run app
```
*提示：按 `Cmd+Q` (macOS) 可完全退出桌面端。*

### 4. 生产环境构建与预览
```bash
npm run build
npm start
```

### 5. 自动化质量验证
```bash
npm run check          # JavaScript 语法与代码规范校验
npm test               # 运行本地存储、筛选排序与数据边界测试
npm run smoke          # 自动化端到端冒烟测试 (SQLite 重启、深链接等)
npm run smoke:desktop  # 启动 Electron 自动化环境探测
```

---

## 📂 项目结构概览

```text
signal-blogs/
├── src/
│   ├── client/                  # 前端核心源码 (React 19 + Tailwind CSS 3)
│   │   ├── components/          # 通用组件 (Sidebar, Drawer, Card, AudioBar 等)
│   │   ├── pages/               # 11 组核心路由页面 (Daily, Following, Review 等)
│   │   ├── data/                # 主题令牌 theme.json、信源预设与演示情报
│   │   ├── state.jsx            # 本地持久化与 SQLite 双向同步状态流
│   │   └── style.css            # 全局纸质排印与 Amber-Ink 发丝线样式
│   ├── server/                  # 本地轻量后端 (Node.js 原生 HTTP)
│   │   ├── index.js             # 服务启动入口 (支持 --dev 中间件模式)
│   │   ├── db.js                # SQLite 初始化、事务控制与 CRUD
│   │   ├── migrations.js        # 数据库版本迁移引擎
│   │   └── ingestion/           # RSS 解析、网络健康探测、OPML 解析
│   └── shared/                  # 跨端通用常量与类型定义
├── electron/                    # 桌面端主进程 (main.js)
├── data/                        # 本地数据目录 (内置 .gitkeep，已排除用户真实数据库)
├── public/                      # 静态资源与离线字体资源
├── scripts/                     # 语法检查、烟测与自动化测试脚本
├── tests/                       # 核心业务逻辑与数据存储自动化测试套件
├── docs/                        # 项目设计方案、前端说明与交付复盘
├── tailwind.config.js           # Amber-Ink-Editorial 官方设计令牌配置
├── vite.config.js               # Vite 8 构建配置
└── package.json                 # 项目依赖、脚本与元数据
```

---

## 🔒 本地优先与隐私安全说明

- **数据库存放位置**：
  - **浏览器模式**：默认存放在本地 `data/local/signal-blogs.sqlite`。
  - **Electron 桌面模式**：存储于系统原生安全用户目录（macOS 位于 `~/Library/Application Support/Signal Blogs Skeleton/data/`）。
- **零数据追踪**：本项目不包含任何用户分析探针、无第三方 Cookie、不上传任何阅读足迹。
- **环境隔离配置**：可参考 `.env.example` 进行自定义端口或数据路径覆写，所有的私人配置与数据库文件均已被 `.gitignore` 严格屏蔽。
- **演示数据**：开源仓库所附条目为原型演示内容，真实个人订阅与笔记完全生成并保存在你的本地机器中。

---

## 🗺️ 路线图 (Roadmap)

- [x] **Amber-Ink-Editorial** 暖调纸质出版级排版规范
- [x] 每日早报、正在关注、研读抽屉与足迹复盘核心工作台
- [x] SQLite 本地状态双向同步、崩溃恢复与 Markdown 导出
- [x] 信源 CRUD、OPML 导入导出与连通性检测
- [ ] 真实 RSS / Atom 定时轮询与去重增量抓取后台调度器
- [ ] 本地模型（Ollama / 深度研究模型）四维解构与观点摘要接入
- [ ] 跨平台客户端构建（Windows / Linux 安装包与自动化签名流水线）

---

## 🤝 参与贡献 (Contributing)

欢迎提交 Issue 和 Pull Request！在贡献代码前，请确保运行以下命令验证代码质量：
```bash
npm run check
npm test
npm run format:check
```

---

## 📄 开源许可证

本项目采用 [MIT License](LICENSE) 授权。
