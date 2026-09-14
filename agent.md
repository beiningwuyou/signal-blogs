# Signal Desk — 核心开发上下文与协作规则 (Agent Context & Collaboration Rules)

**版本**：V1.0  
**基准文档**：`docs/specs/prd-v1.0.md` (PRD V1.0 交付基准)  
**设计规范**：`stitch_signal_desk/amber_ink_editorial/DESIGN.md` (Amber-Ink-Editorial 暖调黄灰纸质风)  
**原型参考**：`stitch_signal_desk/` 目录下的 11 组高保真原型  
**适用对象**：全栈开发 Agent / 人机协同开发团队  

---

## 一、 核心定位与设计原则 (Core Mission & Principles)

**Signal Desk** 是一款专为技术从业者、行业分析师与研究员打造的**个人严肃情报与研判工作台（Local Intelligence & Synthesis Desk）**。

1. **本地优先与断网可用 (Local-First Architecture)**：
   - 默认运行于本地端口 `8080` (`http://localhost:8080`)。
   - 数据存储基于本地 SQLite，严禁引入任何第三方云端遥测与信息泄露代码。
   - 断网或离线时具备完整阅读与本地笔记/草稿保存能力。
2. **出版级纸质人文排版 (Amber-Ink-Editorial)**：
   - 彻底告别传统科技界面的刺眼冷青/冷灰色。
   - 采用温润燕麦纸底（`#faf8f5` / `#fcf9f6`）、纯白微卡片（`#ffffff`）、深炭墨排印（`#171614`）、极细发丝分割线（`#e8e3d8`）以及高辨识度的核心琥珀金（`#d97706`）。
3. **消费与配置彻底解耦**：
   - 日常阅读与研判界面（私人早报、正在关注、每日早报等）保持纯净，无任何配置杂音。
   - 所有信源的增删改查、Switch 轮询启停、健康巡检与 OPML 导入导出彻底下沉至独立的「系统设置」页面。
4. **全景研判与事实/观点分离**：
   - 深度研读卡片通过右侧滑出式抽屉（Slide-over Drawer，520px~580px）展现。
   - 严格区分一手事实（Facts）、来源观点（Takes）、四维解构（算力/工程/商业/供应链）与原文可追溯证据链。

---

## 二、 确认的技术栈规范 (Confirmed Tech Stack)

| 领域 | 核心选型 | 版本 / 标准 | 说明与约束 |
| :--- | :--- | :--- | :--- |
| **运行时 / 宿主** | Node.js + Electron | Node.js >=20 / Electron 44+ | 支持浏览器直接访问与原生 macOS 桌面运行 |
| **前端框架** | React 19 | `^19.2.0` | 函数组件与 Hooks 驱动 |
| **前端路由** | React Router 7 | `^7.18.0` | 单页 History 路由，URL 状态参数同步 |
| **构建工具** | Vite | `^8.0.0` | 中间件模式挂载，秒级 HMR 与高效构建 |
| **样式与系统** | Tailwind CSS 3 | `^3.4.0` | 严格绑定 `Amber-Ink-Editorial` 令牌映射 |
| **排版字系** | Serif / Sans / Mono | Newsreader + Inter + JetBrains Mono | 报头大标题用衬线，正文用 Sans，编号协议用 Mono |
| **图标方案** | Lucide React + Material Symbols | `lucide-react` + SVG | 保持精致一致的界面微标表达 |
| **本地后端** | Node.js 原生 HTTP | 默认端口 `8080` | 轻量、安全，仅监听 localhost / 127.0.0.1 |
| **本地数据存储** | SQLite 3 | Node 原生 / `better-sqlite3` | 驱动本地工作区、配置与笔记持久化 |
| **信源与网络** | `rss-parser` + 原生 Fetch | 支持 OPML 导入导出 | 具备超时熔断与离线容错 |

---

## 三、 工作区目录架构规范 (Project Structure)

```text
daily-news/ (工作区根目录)
├── docs/                        # 统一文档中心
│   ├── specs/                   # 核心 PRD 交付基准 (prd-v1.0.md)
│   ├── design/                  # 设计系统规范 (MASTER.md)
│   └── history/                 # 历史演进与立项备忘 (project-origin.md)
├── stitch_signal_desk/          # 高保真原型 HTML 与设计规范资产库
│   ├── amber_ink_editorial/     # Amber-Ink-Editorial 官方设计令牌
│   ├── signal_desk_1 ~ 10/      # 各模块参考 HTML 与截图
│   ├── signal_desk_motion/      # 时间轴分支泳道参考
│   └── signal_desk_number_trend/# 今日回顾指标趋势参考
├── src/
│   ├── client/                  # 前端核心源码 (React 19 + Tailwind)
│   │   ├── components/          # 通用组件 (Sidebar, TopNav, Drawer, AudioBar 等)
│   │   ├── pages/               # 11 个核心业务路由页面
│   │   ├── data/                # 主题令牌 theme.json、信源预设与模拟数据
│   │   ├── state.jsx            # 本地持久化与 SQLite 双向同步状态流
│   │   ├── App.jsx              # 路由入口与全局外壳组装
│   │   └── style.css            # 全局纸质排印与发丝线样式
│   ├── server/                  # 本地服务 (Node.js 原生 HTTP 8080)
│   │   ├── index.js             # 服务启动入口 (支持 --dev 中间件模式)
│   │   ├── app.js               # 核心路由分发、CSP 安全策略、/health 探活
│   │   ├── config.js            # 服务配置 (端口默认 8080、数据目录)
│   │   ├── db.js                # SQLite 初始化与 CRUD
│   │   ├── migrations.js        # 数据库版本迁移
│   │   └── ingestion/           # RSS 解析、网络健康探测、OPML 解析
│   └── shared/                  # 跨端通用常量与类型定义
├── electron/                    # 桌面端主进程 (main.js)
├── data/                        # SQLite 数据库与本地持久化文件目录 (.gitkeep 占位)
├── public/                      # 静态资源与本地离线字体资源
├── scripts/                     # 语法检查、烟测与构建脚本
├── tailwind.config.js           # Amber-Ink-Editorial 主题配置
├── vite.config.js               # Vite 构建配置
└── package.json                 # 项目依赖与运行脚本
```

---

## 四、 11 个核心模块与路由映射表

| 空间划分 | 模块名称 | 路由路径 | 原型对应 | 核心交互与职责 |
| :--- | :--- | :--- | :--- | :--- |
| **个人空间** | **私人早报** | `/personal` | `signal_desk_9` | 晨间决策简报、置信度、今日要闻、精选研读、音频联动 |
| **个人空间** | **正在关注** | `/following` | `signal_desk_8` | 宏观态势矩阵、焦点标签即时过滤、高密流、点击开抽屉 |
| **个人空间** | **我的阅读** | `/reading` | `signal_desk_1` | 通栏高密卡片、收藏/划线筛选、Markdown 导出 |
| **个人空间** | **浏览足迹** | `/history` | `signal_desk_7` | 时序防丢列表、单条移除、一键清空足迹 |
| **个人空间** | **今日回顾** | `/review` | `signal_desk_number_trend` | 今日研判洞察、动态指标矩阵、待办跟进、复盘随想草稿纸 |
| **公共广场** | **内容广场** | `/explore` | `signal_desk_2` | 全网科技资讯降噪流、按最新/权重/多媒体形态筛选 |
| **公共广场** | **每日早报** | `/daily`, `/daily/:date` | `signal_desk_4` | 历史早报树形归档切换、纯粹日报流、研判抽屉联动 |
| **公共广场** | **精选周刊** | `/weekly` | `signal_desk_3` | 精装期刊封面、导读视窗、往期周刊网格归档 |
| **公共广场** | **主题解读** | `/topics` | `signal_desk_5`, `10` | 全部/公司模型/技术方向二级标签、四维解构全景大抽屉 |
| **公共广场** | **事件时间轴** | `/timeline` | `signal_desk_motion` | 周期筛选、单轨时序深度流、四维分支泳道切换 |
| **底层系统** | **系统设置** | `/settings` | `signal_desk_6` | RSS 三列数据表 (54%/26%/20%)、Switch启停、登记抽屉、OPML |

---

## 五、 协同开发纪律与铁律 (Rules of Engagement)

在本项目进行协同开发时，**任何 Agent 必须无条件遵守以下铁律**：

1. **绝对禁止一次性全部做完（Strict Phasing）**：
   - 必须按照开发方案分阶段（阶段 1 → 阶段 2 → 阶段 3 → 阶段 4）小步快跑推进。
   - 每完成一个阶段，必须主动暂停，向用户汇报当前验收结果，等待用户确认后方可开启下一阶段。
2. **视觉还原忠实度（Zero Visual Regression）**：
   - 严禁出现冷青、冷灰科技风残留；必须保证全站为 `Amber-Ink-Editorial` 暖调纸质质感。
   - 必须保持 1px 发丝线（`#e8e3d8`）与燕麦纸底（`#faf8f5`）。
   - 侧边栏当前路由项必须精准高亮（琥珀条提示、浅暖底色、字色加重），严禁跨路由假激活。
3. **架构解耦准则（Clean Separation）**：
   - 正在关注等日常阅读界面不得出现任何 RSS 抓取配置或连通性测试按钮；信源调度彻底收纳于「系统设置」。
   - 右侧抽屉统一使用无缝 Slide-over Drawer（520px~580px），支持 ESC 键关闭，不得遮挡破坏左侧主信息流的滚动位置。
4. **服务端口与探活（Local Port & Health）**：
   - 本地服务默认端口统一为 `8080`。
   - 侧边栏左下角服务指示灯必须真实调用 `/api/health` 接口探测连通状态，并呈现绿色脉冲或重连提示。
5. **代码验证准则（Quality Gate）**：
   - 每次改动后必须运行 `npm run check`（语法与配置检查）与构建校验。
   - 在 1440px 桌面端确保三栏黄金比例，禁止页面横向无故溢出滚动。
