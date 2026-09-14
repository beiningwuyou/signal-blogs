import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../state.jsx';
import { articles, downloadText } from '../data/catalog.js';
import { getLiveEvents, displayTime } from '../live/api.js';

export function ReadingPage() {
  const [, setParams] = useSearchParams();
  const { entries, toggleBookmark, notify } = useWorkspace();

  const [activeStatus, setActiveStatus] = useState('all');
  const [activeTopic, setActiveTopic] = useState('all');
  const [sortBy, setSortBy] = useState('time');
  const [searchQuery, setSearchQuery] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // 真实书签事件（来自 SQLite event_records WHERE bookmarked=1）
  const [liveBookmarks, setLiveBookmarks] = useState([]);
  const [loadingLive, setLoadingLive] = useState(true);

  const loadBookmarks = useCallback(async () => {
    try {
      setLoadingLive(true);
      const data = await getLiveEvents({ scope: 'bookmarks' });
      setLiveBookmarks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('加载书签事件失败:', err);
    } finally {
      setLoadingLive(false);
    }
  }, []);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const openDrawer = (articleId) => {
    setParams({ article: articleId });
  };

  // 演示数据集（静态兜底，在没有真实数据时展示原型效果）
  const readingList = useMemo(() => {
    const demoData = [
      {
        id: 'demo-anthropic-energy',
        topic: '算力与基础设施',
        topicTag: '#算力基建',
        status: 'annotated',
        progress: 65,
        source: 'SEC 监管报告 & 彭博终端',
        timeAgo: '2 小时前加入',
        readEst: '7 分钟',
        title: 'Anthropic 签署大额多方算力供电协议，锁定至少 14.8 GW 跨区域清洁能源储备',
        summary:
          '覆盖内华达与怀俄明 4 个清洁能源园区，由主权资本与能源 REITs 联合承销长协保底承购 (PPA)，厂区直接匹配液冷直冷模块设计。',
        tags: ['NVDA', '能源REITs', 'PPA长协'],
        notesCount: 2,
        starred: true,
        excerpt:
          '"Cartridge 抽拉式公差严控在 0.15mm 内，水冷接头微渗漏检测方案通过 UL 认证，Q4 整机柜出货预测上修至 3,400 柜。"',
        isDemo: true,
      },
      {
        id: 'demo-speculative-decoding',
        topic: '核心模型与架构',
        topicTag: '#推理架构',
        status: 'unread',
        progress: 0,
        source: 'arXiv:2502.18432',
        timeAgo: '昨天加入',
        readEst: '12 分钟',
        title: 'Recursive Speculative Decoding: 在消费级单卡实现 70B 模型 3.2x 推理吞吐突破',
        summary:
          '通过分层草稿验证树与投机多分支动态对齐算法，在不损失困惑度（Perplexity）前提下，大幅削减大显存自回归访存带宽瓶颈。',
        tags: ['投机解码', 'vLLM', '低显存'],
        notesCount: 0,
        starred: false,
        isDemo: true,
      },
      {
        id: 'demo-claude-agentic',
        topic: 'Agent与代码工程',
        topicTag: '#系统架构',
        status: 'annotated',
        progress: 85,
        source: 'Anthropic Research',
        timeAgo: '2 天前加入',
        readEst: '15 分钟',
        title: 'Building Effective Agents: A Year of Production Multi-Agent Systems 实战工程全景',
        summary:
          '深度剖析从单 Agent 提示词转向 Orchestrator-Workers 架构的最佳实践，动态状态隔离使长程任务崩溃率降低 67%。',
        tags: ['多智能体', '沙盒隔离', '架构模式'],
        notesCount: 4,
        starred: true,
        excerpt:
          '"将负责全局状态调度的 Orchestrator 与执行无状态子任务的 Worker 解耦，是规避长程逻辑崩溃的唯一可靠范式。"',
        isDemo: true,
      },
      {
        id: 'demo-cowos-supply',
        topic: '半导体与供应链',
        topicTag: '#先进制程',
        status: 'archived',
        progress: 100,
        source: 'TrendForce 产业速递',
        timeAgo: '3 天前加入',
        readEst: '6 分钟',
        title: '台积电 CoWoS-L 先进封装良率突破 92%，玻璃基板量产节点前瞻测算',
        summary:
          'AP6 新建工程爬坡顺利，引入双面微凸块键合缺陷自愈检测，英伟达与 AMD 第四季度供应短缺缺口收窄 28 个基点。',
        tags: ['台积电', 'CoWoS-L', '玻璃基板'],
        notesCount: 1,
        starred: true,
        isDemo: true,
      },
      {
        id: 'demo-sqlite-wasm',
        topic: '商业与认知复盘',
        topicTag: '#本地工作台',
        status: 'archived',
        progress: 100,
        source: "Simon Willison's Weblog",
        timeAgo: '4 天前加入',
        readEst: '9 分钟',
        title: '从单文件 SQLite WASM 到个人专属严肃情报库：极简本地优先架构之道',
        summary:
          '放弃沉重的分布式微服务，利用 OPFS 与纯静态前端构建零延迟个人情报站，兼顾完全离线可用与极致数据主权。',
        tags: ['LocalFirst', 'SQLite', '知识资产'],
        notesCount: 3,
        starred: true,
        isDemo: true,
      },
    ];

    // 将真实书签事件（evt-*）映射为页面所需格式
    const liveItems = liveBookmarks.map((evt) => ({
      id: evt.id,
      topic: evt.category || '研判情报',
      topicTag: `#${(evt.category || '情报').slice(0, 6)}`,
      status: evt.record?.note ? 'annotated' : 'unread',
      progress: evt.record?.note ? 50 : 0,
      source: (evt.sources || []).slice(0, 2).join(' & ') || '多源情报',
      timeAgo: evt.record?.visitedAt
        ? `${displayTime(evt.record.visitedAt)} 访问`
        : `${displayTime(evt.updatedAt || evt.discoveredAt)} 收录`,
      readEst: `${Math.max(2, Math.round((evt.articleCount || 1) * 3))} 分钟`,
      title: evt.title,
      summary: evt.summary || '',
      tags: (evt.sources || []).slice(0, 3),
      notesCount: evt.record?.note ? 1 : 0,
      starred: true,
      excerpt: evt.record?.note ? `"${evt.record.note}"` : null,
      articleCount: evt.articleCount || 0,
      isLive: true,
    }));

    // 与已加入书签的静态 catalog 条目融合
    const bookmarkedCatalog = articles
      .filter((a) => entries[a.id]?.bookmarked)
      .map((a) => ({
        id: a.id,
        topic: a.kind === 'daily' ? '算力与基础设施' : 'Agent与代码工程',
        topicTag: `#${a.kind || '研判'}`,
        status: entries[a.id]?.note ? 'annotated' : 'unread',
        progress: entries[a.id]?.note ? 50 : 0,
        source: a.author || 'Signal Desk 智库',
        timeAgo: '本地书签',
        readEst: `${a.readingTime || 8} 分钟`,
        title: a.title,
        summary: a.summary || (a.body || '').slice(0, 140) + '...',
        tags: [a.kind || '情报', '本地同步'],
        notesCount: entries[a.id]?.note ? 1 : 0,
        starred: true,
        excerpt: entries[a.id]?.note ? `"${entries[a.id].note}"` : null,
      }));

    // 真实数据优先，通过 Map 去重；若有真实书签则隐藏演示数据
    const map = new Map();
    // 优先级：真实书签(liveItems) > catalog书签(bookmarkedCatalog) > 演示数据(demoData，仅无真实书签时显示)
    if (liveItems.length === 0 && bookmarkedCatalog.length === 0) {
      demoData.forEach((it) => map.set(it.id, it));
    }
    bookmarkedCatalog.forEach((it) => map.set(it.id, it));
    liveItems.forEach((it) => map.set(it.id, it));
    return Array.from(map.values());
  }, [entries, liveBookmarks]);

  // 过滤与排序
  const filteredList = useMemo(() => {
    return readingList
      .filter((item) => {
        if (activeStatus === 'unread' && item.status !== 'unread') return false;
        if (activeStatus === 'annotated' && item.status !== 'annotated') return false;
        if (activeStatus === 'archived' && item.status !== 'archived') return false;

        if (activeTopic !== 'all' && item.topic !== activeTopic) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            item.title.toLowerCase().includes(q) ||
            item.summary.toLowerCase().includes(q) ||
            item.source.toLowerCase().includes(q) ||
            (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)));
          if (!match) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'progress') return b.progress - a.progress;
        if (sortBy === 'duration') return parseInt(a.readEst) - parseInt(b.readEst);
        return 0; // 默认最新
      });
  }, [readingList, activeStatus, activeTopic, sortBy, searchQuery]);

  // 状态计数统计
  const counts = useMemo(() => {
    return {
      all: readingList.length,
      unread: readingList.filter((i) => i.status === 'unread').length,
      annotated: readingList.filter((i) => i.status === 'annotated').length,
      archived: readingList.filter((i) => i.status === 'archived').length,
    };
  }, [readingList]);

  // 导出 Markdown
  const handleExportMarkdown = () => {
    const targetItems =
      selectedIds.size > 0 ? filteredList.filter((i) => selectedIds.has(i.id)) : filteredList;

    if (!targetItems.length) {
      notify('当前没有可导出的知识文献');
      return;
    }

    const mdContent =
      `# Signal Blogs — 我的阅读文献导出\n\n导出时间: ${new Date().toLocaleString('zh-CN')}\n共收录: ${targetItems.length} 篇知识文献\n\n---\n\n` +
      targetItems
        .map((item, idx) => {
          return (
            `### ${idx + 1}. ${item.title}\n\n` +
            `- **信源**: ${item.source} (${item.readEst})\n` +
            `- **研读进度**: ${item.progress}%\n` +
            `- **主题标签**: ${item.tags.join(', ')}\n` +
            (item.excerpt ? `- **核心高光/批注**: ${item.excerpt}\n` : '') +
            `\n> ${item.summary}\n\n---\n`
          );
        })
        .join('\n');

    downloadText(
      `Signal_Desk_Reading_Export_${new Date().toISOString().slice(0, 10)}.md`,
      mdContent,
    );
    notify(`已导出 ${targetItems.length} 篇文献 Markdown 文档`);
  };

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <article className="w-full max-w-5xl mx-auto space-y-4 pb-16 select-none">
      {/* 顶部标题与快捷工具条 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-hairline">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-serif text-ink font-medium tracking-tight flex items-center gap-2">
            <span>我的阅读</span>
            <span className="text-xs font-sans font-normal text-muted bg-[#f2ebe0] border border-hairline px-2 py-0.5 rounded-full">
              共 {readingList.length} 篇知识文献
            </span>
            {liveBookmarks.length > 0 && (
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {liveBookmarks.length} 条已从 SQLite 加载
              </span>
            )}
            {loadingLive && (
              <span className="text-[10px] font-mono text-muted animate-pulse">同步中…</span>
            )}
          </h1>
          <span className="text-hairline">|</span>
          <p className="text-xs text-muted hidden sm:inline">离线全文缓存 · 批注索引已同步</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setBatchMode(!batchMode)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors shadow-2xs ${
              batchMode
                ? 'bg-primary text-white border-primary'
                : 'bg-surface hover:bg-[#f6f3ee] text-ink border-hairline'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[15px]">checklist</span>
            <span>{batchMode ? '退出批量' : '批量管理'}</span>
          </button>

          <button
            onClick={handleExportMarkdown}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface hover:bg-[#f6f3ee] border border-hairline rounded-md text-xs font-medium text-ink transition-colors shadow-2xs"
            type="button"
          >
            <span className="material-symbols-outlined text-[15px] text-muted">ios_share</span>
            <span>导出 Markdown</span>
          </button>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs py-1 pl-2.5 pr-6 bg-surface border border-hairline rounded-md text-ink focus:outline-none focus:border-primary cursor-pointer shadow-2xs appearance-none"
            >
              <option value="time">按加入时间 (最新)</option>
              <option value="progress">按研读进度 (进行中优先)</option>
              <option value="duration">按预计时长 (短到长)</option>
            </select>
            <span className="material-symbols-outlined text-[13px] text-muted absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none">
              expand_more
            </span>
          </div>
        </div>
      </div>

      {/* 紧凑双层筛选栏 */}
      <div className="pt-1 pb-3 space-y-2 border-b border-hairline">
        {/* 一级状态 Tab */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveStatus('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all shadow-2xs flex items-center gap-1.5 ${
                activeStatus === 'all'
                  ? 'bg-ink text-white'
                  : 'bg-surface hover:bg-[#f6f3ee] text-muted border border-hairline'
              }`}
            >
              <span>全部书签</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${activeStatus === 'all' ? 'bg-white/20 text-white' : 'bg-[#f4efe6] text-muted'}`}
              >
                {counts.all}
              </span>
            </button>

            <button
              onClick={() => setActiveStatus('unread')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all shadow-2xs flex items-center gap-1.5 ${
                activeStatus === 'unread'
                  ? 'bg-ink text-white'
                  : 'bg-surface hover:bg-[#f6f3ee] text-muted border border-hairline'
              }`}
            >
              <span>未读精读</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${activeStatus === 'unread' ? 'bg-white/20 text-white' : 'bg-[#f4efe6] text-muted'}`}
              >
                {counts.unread}
              </span>
            </button>

            <button
              onClick={() => setActiveStatus('annotated')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all shadow-2xs flex items-center gap-1.5 ${
                activeStatus === 'annotated'
                  ? 'bg-ink text-white'
                  : 'bg-surface hover:bg-[#f6f3ee] text-muted border border-hairline'
              }`}
            >
              <span className="inline-flex w-1.5 h-1.5 rounded-full bg-primary"></span>
              <span>研读中·有批注</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${activeStatus === 'annotated' ? 'bg-white/20 text-white' : 'bg-[#f4efe6] text-muted'}`}
              >
                {counts.annotated}
              </span>
            </button>

            <button
              onClick={() => setActiveStatus('archived')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all shadow-2xs flex items-center gap-1.5 ${
                activeStatus === 'archived'
                  ? 'bg-ink text-white'
                  : 'bg-surface hover:bg-[#f6f3ee] text-muted border border-hairline'
              }`}
            >
              <span className="material-symbols-outlined text-[13px] text-emerald-600">
                task_alt
              </span>
              <span>核心归档</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${activeStatus === 'archived' ? 'bg-white/20 text-white' : 'bg-[#f4efe6] text-muted'}`}
              >
                {counts.archived}
              </span>
            </button>
          </div>

          <span className="text-[11px] text-muted font-mono hidden md:inline">
            当前匹配 {filteredList.length} / {readingList.length} 篇
          </span>
        </div>

        {/* 二级技术领域主题胶囊分类 */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {[
            { id: 'all', label: `全部主题 (${readingList.length})` },
            { id: '算力与基础设施', label: '算力与基础设施 (7)' },
            { id: '核心模型与架构', label: '核心模型与架构 (6)' },
            { id: 'Agent与代码工程', label: 'Agent与代码工程 (5)' },
            { id: '半导体与供应链', label: '半导体与供应链 (4)' },
            { id: '商业与认知复盘', label: '商业与认知复盘 (4)' },
          ].map((topic) => (
            <button
              key={topic.id}
              onClick={() => setActiveTopic(topic.id)}
              className={`text-xs px-2.5 py-0.5 rounded transition-colors border ${
                activeTopic === topic.id
                  ? 'bg-[#f2ebe0] text-ink font-semibold border-hairline'
                  : 'bg-surface hover:bg-[#f6f3ee] text-muted border-hairline'
              }`}
            >
              {topic.label}
            </button>
          ))}
        </div>
      </div>

      {/* 搜索过滤条 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-muted pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="在已存入文献中搜索标题、信源、标签或研判批注..."
            className="w-full pl-8 pr-4 py-1.5 bg-surface border border-hairline rounded-md text-xs text-ink placeholder:text-muted focus:outline-none focus:border-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs"
            >
              清空
            </button>
          )}
        </div>
      </div>

      {/* 文献卡片信息流 */}
      <div className="space-y-3 pt-1">
        {filteredList.map((item) => {
          const isSelected = selectedIds.has(item.id);
          const isBookmarked = entries[item.id]?.bookmarked ?? item.starred;

          return (
            <article
              key={item.id}
              onClick={() => openDrawer(item.id)}
              className={`group bg-surface border rounded-lg p-4 shadow-2xs hover:shadow-sm transition-all cursor-pointer ${
                isSelected
                  ? 'ring-2 ring-primary border-primary'
                  : 'border-hairline hover:border-[#d4cdc0]'
              }`}
            >
              <div className="space-y-2">
                {/* 顶层微标签与信源 */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    {batchMode && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelect(item.id);
                        }}
                        className="rounded border-hairline text-primary focus:ring-0 cursor-pointer h-3.5 w-3.5"
                      />
                    )}
                    <span className="inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/80">
                      <span className="material-symbols-outlined text-[13px]">bolt</span>
                      <span>{item.topicTag}</span>
                    </span>
                    <span className="text-muted">
                      信源: <strong className="text-ink font-medium">{item.source}</strong>
                    </span>
                    <span className="text-hairline">·</span>
                    <span className="text-muted">{item.timeAgo}</span>
                    <span className="text-hairline">·</span>
                    <span className="text-muted flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[13px]">schedule</span>
                      预计 {item.readEst}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.progress > 0 && item.progress < 100 && (
                      <span className="inline-flex items-center gap-1 text-primary font-medium bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[11px]">
                        <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                        研读中 · {item.progress}%
                      </span>
                    )}
                    {item.progress === 100 && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px]">
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        已归档
                      </span>
                    )}
                    {item.progress === 0 && (
                      <span className="inline-flex items-center gap-1 text-muted font-medium bg-[#f4efe6] border border-hairline px-2 py-0.5 rounded-full text-[11px]">
                        待研读
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark({ id: item.id, title: item.title });
                      }}
                      className={`p-1 rounded hover:bg-[#f2ebe0] transition-colors ${
                        isBookmarked ? 'text-primary' : 'text-muted hover:text-ink'
                      }`}
                      title={isBookmarked ? '取消书签' : '加入书签'}
                    >
                      <span
                        className="material-symbols-outlined text-[17px]"
                        style={{ fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        bookmark
                      </span>
                    </button>
                  </div>
                </div>

                {/* 标题 */}
                <h2 className="text-[16px] font-serif text-ink font-semibold group-hover:text-primary transition-colors leading-snug">
                  {item.title}
                </h2>

                {/* 摘要与高光 */}
                <p className="text-xs text-[#57534e] leading-relaxed line-clamp-2">
                  {item.summary}
                </p>

                {item.excerpt && (
                  <div className="bg-[#faf6f0] border-l-2 border-primary px-3 py-1.5 rounded-r text-xs font-serif italic text-ink/90 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-primary shrink-0 not-italic">
                      format_quote
                    </span>
                    <span className="line-clamp-1">{item.excerpt}</span>
                  </div>
                )}

                {/* 底部微信息与操作栏 */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-hairline/60 text-[11px] text-muted">
                  <div className="flex items-center gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded bg-[#f4efe6] text-muted border border-hairline/50 font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                    {item.notesCount > 0 && (
                      <span className="flex items-center gap-0.5 text-primary font-mono ml-1">
                        <span className="material-symbols-outlined text-[13px]">edit_note</span>
                        {item.notesCount} 处批注
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(
                          `[${item.title}](${item.source}) · 核心结论：${item.summary}`,
                        );
                        notify('已复制文献引用信息');
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f4efe6] hover:bg-[#e8e3d8] text-ink transition-colors"
                    >
                      <span className="material-symbols-outlined text-[13px]">content_copy</span>
                      <span>引用</span>
                    </button>
                    <span className="inline-flex items-center gap-0.5 text-primary font-medium group-hover:translate-x-0.5 transition-transform">
                      <span>研读抽屉</span>
                      <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        {!filteredList.length && (
          <div className="py-16 text-center space-y-2 bg-surface rounded-lg border border-hairline">
            <span className="material-symbols-outlined text-3xl text-muted">folder_open</span>
            <h3 className="text-sm font-semibold text-ink">未找到匹配的知识文献</h3>
            <p className="text-xs text-muted">尝试更换筛选状态，或在上方搜索框清空关键词。</p>
          </div>
        )}
      </div>
    </article>
  );
}
