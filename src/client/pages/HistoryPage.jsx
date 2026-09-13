import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../state.jsx';
import { articles, downloadText } from '../data/catalog.js';
import { getVisitedEvents, saveEventRecord, displayTime } from '../live/api.js';

export function HistoryPage() {
  const [, setParams] = useSearchParams();
  const { entries, update, notify } = useWorkspace();
  const [activeDateTab, setActiveDateTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 真实浏览足迹（来自 SQLite event_records WHERE visited_at IS NOT NULL）
  const [liveHistory, setLiveHistory] = useState([]);
  const [loadingLive, setLoadingLive] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      setLoadingLive(true);
      const data = await getVisitedEvents();
      setLiveHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('加载浏览足迹失败:', err);
    } finally {
      setLoadingLive(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const openDrawer = (articleId) => {
    setParams({ article: articleId });
  };

  // 基础历史足迹集合（融合真实足迹与静态演示流）
  const historyList = useMemo(() => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    const yesterdayMs = now.getTime() - 86400000;
    const weekMs = now.getTime() - 7 * 86400000;

    // 将真实访问过的 evt-* 事件映射为页面格式
    const liveItems = liveHistory.map((evt) => {
      const visitedAt = evt.record?.visitedAt ? new Date(evt.record.visitedAt) : null;
      const msSince = visitedAt ? now.getTime() - visitedAt.getTime() : Infinity;
      const dateGroup = !visitedAt
        ? 'earlier'
        : msSince < 86400000
          ? 'today'
          : msSince < 2 * 86400000
            ? 'yesterday'
            : msSince < 8 * 86400000
              ? 'week'
              : 'earlier';
      const dateLabel = !visitedAt
        ? '更早记录'
        : dateGroup === 'today'
          ? `今天 · ${todayStr}`
          : dateGroup === 'yesterday'
            ? `昨天 · ${new Date(yesterdayMs).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}`
            : dateGroup === 'week'
              ? `近 7 天`
              : '更早记录';
      return {
        id: evt.id,
        time: visitedAt ? displayTime(evt.record.visitedAt) : '未知',
        dateGroup,
        dateLabel,
        source: (evt.sources || []).slice(0, 2).join(' & ') || '多源情报',
        category: evt.category || '研判情报',
        title: evt.title,
        readingSpot: evt.record?.note || `已打开研读抽屉 · 涉及 ${evt.articleCount || 1} 篇原始材料`,
        dwellTime: `${evt.articleCount || 1} 篇来源`,
        highlightCount: evt.record?.note ? 1 : 0,
        isLive: true,
      };
    });

    // 本地通过 Drawer 访问过的静态 catalog 条目
    const dynamicHistory = articles
      .filter((a) => entries[a.id]?.visitedAt)
      .map((a) => ({
        id: a.id,
        time: new Date(entries[a.id].visitedAt).toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        dateGroup: 'today',
        dateLabel: `今天 · ${todayStr}`,
        source: a.author || 'Signal Desk 智库',
        category: a.kind === 'daily' ? '早报日报' : '研判情报',
        title: a.title,
        readingSpot: entries[a.id]?.note || '已打开研读抽屉进行多维事实交叉验证',
        dwellTime: '研读中',
        highlightCount: entries[a.id]?.note ? 1 : 0,
      }));

    const staticHistory = [
      {
        id: 'demo-claude-thinking',
        time: '09:42',
        dateGroup: 'today',
        dateLabel: '今天 · 演示数据',
        source: 'Anthropic Engineering Log',
        category: '技术研报',
        title: 'Claude Code AST 语法树剪枝与多文件依赖上下文调度机制',
        readingSpot: '停于 3.2 节「Orchestrator-Workers 工作模式」，关注长任务状态同步机制与幻觉抑制',
        dwellTime: '研读 14 分钟',
        highlightCount: 4,
        isDemo: true,
      },
      {
        id: 'demo-spinoff-policy',
        time: '08:50',
        dateGroup: 'today',
        dateLabel: '今天 · 演示数据',
        source: 'The Spinoff',
        category: '深度报道',
        title: '社会发展部告知数千人食物“并非基本需求”：内部指引与福利紧缩风波',
        readingSpot: '已通读全文 100%，批注聚焦在行政诉讼与弱势群体援助救济裁量细则',
        dwellTime: '研读 8 分 40 秒',
        highlightCount: 2,
        isDemo: true,
      },
      {
        id: 'demo-hbm',
        time: '昨天 21:30',
        dateGroup: 'yesterday',
        dateLabel: '昨天 · 演示数据',
        source: 'IEEE Micro 刊载',
        category: '硬件实测',
        title: 'HBM3e 3D 堆叠垂直热阻与热膨胀失配 (CTE) 测量新基准',
        readingSpot: '停于插拔疲劳应力曲线图，对比安费诺与信维公差',
        dwellTime: '深读 19 分钟',
        highlightCount: 3,
        isDemo: true,
      },
      {
        id: 'demo-deepseek-r1',
        time: '09-04 14:20',
        dateGroup: 'week',
        dateLabel: '近 7 天 · 演示数据',
        source: 'arXiv · 推理架构工程',
        category: '推理模型',
        title: 'Recursive Speculative Decoding: 在单卡 RTX 4090 实现 70B 模型 3.2x 推理吞吐',
        readingSpot: '通读冷启动与轻量级递归草稿分支 (Recursive Draft Head) 验证阶段日志',
        dwellTime: '深读 25 分钟',
        highlightCount: 5,
        isDemo: true,
      },
    ];

    const preferences = entries.preferences || {};
    const hiddenHistory = preferences.hiddenHistory || [];

    // 真实足迹优先：有真实记录时隐藏演示数据
    const hasRealData = liveItems.length > 0 || dynamicHistory.length > 0;
    const map = new Map();
    if (!hasRealData) {
      staticHistory.forEach((it) => {
        if (!hiddenHistory.includes(it.id)) map.set(it.id, it);
      });
    }
    dynamicHistory.forEach((it) => {
      if (!hiddenHistory.includes(it.id)) map.set(it.id, it);
    });
    liveItems.forEach((it) => {
      if (!hiddenHistory.includes(it.id)) map.set(it.id, it);
    });
    return Array.from(map.values());
  }, [entries, liveHistory]);


  // 过滤
  const filteredHistory = useMemo(() => {
    return historyList.filter((item) => {
      if (activeDateTab !== 'all' && item.dateGroup !== activeDateTab) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.source.toLowerCase().includes(q) ||
          item.readingSpot.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [historyList, activeDateTab, searchQuery]);

  // 计数统计
  const counts = useMemo(() => {
    return {
      all: historyList.length,
      today: historyList.filter((i) => i.dateGroup === 'today').length,
      yesterday: historyList.filter((i) => i.dateGroup === 'yesterday').length,
      week: historyList.filter((i) => i.dateGroup === 'week').length,
      earlier: historyList.filter((i) => i.dateGroup === 'earlier').length,
    };
  }, [historyList]);

  // 清空浏览足迹（含真实 evt-* 事件）
  const handleClearHistory = async () => {
    if (window.confirm('确定要清空全部浏览足迹吗？此操作不会影响已加书签的文献。')) {
      const preferences = entries.preferences || {};
      const hiddenHistory = preferences.hiddenHistory || [];
      const allIds = historyList.map((i) => i.id);
      const nextHidden = Array.from(new Set([...hiddenHistory, ...allIds]));
      update('preferences', { hiddenHistory: nextHidden });
      // 清除静态 catalog 的 visitedAt
      Object.keys(entries).forEach((id) => {
        if (entries[id]?.visitedAt) update(id, { visitedAt: null });
      });
      // 清除真实 evt-* 的 visitedAt（通过 live API）
      await Promise.allSettled(
        liveHistory.map((evt) => saveEventRecord(evt.id, { visitedAt: null })),
      );
      setLiveHistory([]);
      notify('已清空浏览足迹');
    }
  };

  // 单条移除
  const handleRemoveItem = async (id) => {
    const preferences = entries.preferences || {};
    const hiddenHistory = preferences.hiddenHistory || [];
    const nextHidden = Array.from(new Set([...hiddenHistory, id]));
    update('preferences', { hiddenHistory: nextHidden });
    if (id.startsWith('evt-')) {
      // 真实事件：通过 live API 清除 visitedAt
      try {
        await saveEventRecord(id, { visitedAt: null });
        setLiveHistory((prev) => prev.filter((e) => e.id !== id));
      } catch (err) {
        console.warn('清除真实足迹失败:', err);
      }
    } else {
      update(id, { visitedAt: null });
    }
    notify('已从浏览足迹中移除该条目');
  };

  // 导出足迹
  const handleExportHistory = () => {
    if (!filteredHistory.length) {
      notify('当前暂无浏览足迹可导出');
      return;
    }
    const md =
      `# Signal Desk — 研读浏览足迹\n\n导出时间: ${new Date().toLocaleString('zh-CN')}\n共计: ${filteredHistory.length} 条足迹\n\n---\n\n` +
      filteredHistory
        .map((item, idx) => {
          return `${idx + 1}. [${item.time}] **${item.title}** (${item.source})\n   - 停留断点: ${item.readingSpot}\n   - 时长: ${item.dwellTime}\n`;
        })
        .join('\n');

    downloadText(`Signal_Desk_History_${new Date().toISOString().slice(0, 10)}.md`, md);
    notify('已导出足迹记录');
  };

  return (
    <article className="w-full max-w-5xl mx-auto space-y-4 pb-16 select-none">
      {/* 顶部标题与控制 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-hairline">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-serif text-ink font-medium tracking-tight flex items-center gap-2">
            <span>浏览足迹</span>
            <span className="text-xs font-sans font-normal text-muted bg-[#f2ebe0] border border-hairline px-2 py-0.5 rounded-full">
              共 {historyList.length} 条研读历史
            </span>
            {liveHistory.length > 0 && (
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {liveHistory.length} 条真实足迹
              </span>
            )}
            {loadingLive && (
              <span className="text-[10px] font-mono text-muted animate-pulse">同步中…</span>
            )}
          </h1>
          <span className="text-hairline">|</span>
          <p className="text-xs text-muted hidden sm:inline">
            时序防丢列表 · 支持断点记忆与单条抹除
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportHistory}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface hover:bg-[#f6f3ee] border border-hairline rounded-md text-xs font-medium text-ink transition-colors shadow-2xs"
            type="button"
          >
            <span className="material-symbols-outlined text-[15px] text-muted">download</span>
            <span>导出足迹</span>
          </button>
          <button
            onClick={handleClearHistory}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface hover:bg-rose-50 border border-hairline hover:border-rose-200 text-rose-700 rounded-md text-xs font-medium transition-colors shadow-2xs"
            type="button"
          >
            <span className="material-symbols-outlined text-[15px]">delete_sweep</span>
            <span>清空足迹</span>
          </button>
        </div>
      </div>

      {/* 快捷时间筛选与搜索 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 pb-3 border-b border-hairline">
        {/* 时间跨度 Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: '全部足迹', count: counts.all },
            { id: 'today', label: '今天', count: counts.today },
            { id: 'yesterday', label: '昨天', count: counts.yesterday },
            { id: 'week', label: '近 7 天', count: counts.week },
            { id: 'earlier', label: '更早', count: counts.earlier },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveDateTab(tab.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all shadow-2xs flex items-center gap-1.5 ${
                activeDateTab === tab.id
                  ? 'bg-ink text-white'
                  : 'bg-surface hover:bg-[#f6f3ee] text-muted border border-hairline'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${activeDateTab === tab.id ? 'bg-white/20 text-white' : 'bg-[#f4efe6] text-muted'}`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* 快速搜索 */}
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-muted pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索足迹、标题、信源..."
            className="w-full pl-8 pr-3 py-1.5 bg-surface border border-hairline rounded-lg text-xs text-ink placeholder:text-muted focus:outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* 历史足迹时序时间轴列表 */}
      <div className="space-y-4 pt-1">
        {filteredHistory.map((item) => (
          <article
            key={item.id}
            onClick={() => openDrawer(item.id)}
            className="group bg-surface/90 hover:bg-[#faf7f2]/90 border border-hairline hover:border-amber-400/60 rounded-2xl p-5 shadow-2xs hover:shadow-sm transition-all duration-150 cursor-pointer relative"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2 flex-1 min-w-0">
                {/* 顶栏微元 */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted font-mono">
                  <span className="font-bold text-primary bg-amber-500/10 px-2 py-0.5 rounded text-[11px]">
                    {item.time}
                  </span>
                  <span className="text-hairline">·</span>
                  <span className="font-semibold text-ink font-sans">{item.source}</span>
                  <span className="text-hairline">·</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#f4efe6] text-stone-600 text-[10.5px]">
                    {item.category}
                  </span>
                  <span className="text-hairline">·</span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <span className="material-symbols-outlined text-[13px] text-muted">timer</span>
                    {item.dwellTime}
                  </span>
                  {item.highlightCount > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-900 border border-amber-300/60 text-[10.5px] font-sans flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[12px] text-amber-700">edit_note</span>
                      {item.highlightCount} 处研判痕迹
                    </span>
                  )}
                </div>

                {/* 标题 */}
                <h2 className="text-[17px] font-serif text-ink font-semibold group-hover:text-primary transition-colors leading-snug">
                  {item.title}
                </h2>

                {/* 停留断点记忆条 */}
                <div className="mt-2.5 p-3 rounded-xl bg-[#faf6ee] border border-amber-900/10 flex items-start gap-2.5 text-xs text-stone-700 leading-relaxed">
                  <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">
                    bookmark_flag
                  </span>
                  <div className="flex-1">
                    <span className="font-semibold text-ink mr-1.5 font-sans">停留断点:</span>
                    <span className="font-sans text-[#44403c]">{item.readingSpot}</span>
                  </div>
                </div>
              </div>

              {/* 右侧操作栏 */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-start pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDrawer(item.id);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-surface-card hover:bg-primary hover:text-white text-ink text-xs font-medium border border-hairline hover:border-primary transition-all shadow-2xs flex items-center gap-1"
                >
                  <span>继续研读</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(
                      `[${item.title}](${item.source}) · 研读断点：${item.readingSpot}`,
                    );
                    notify('已复制历史断点引用');
                  }}
                  className="p-1.5 rounded-lg bg-[#f4efe6] hover:bg-[#e8e3d8] text-stone-600 hover:text-ink text-xs transition-colors"
                  title="复制引用"
                >
                  <span className="material-symbols-outlined text-[15px]">content_copy</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveItem(item.id);
                  }}
                  className="p-1.5 rounded-lg text-muted hover:text-rose-700 hover:bg-rose-50 transition-colors"
                  title="从足迹删除"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            </div>
          </article>
        ))}

        {!filteredHistory.length && (
          <div className="py-16 text-center space-y-2 bg-surface rounded-lg border border-hairline">
            <span className="material-symbols-outlined text-3xl text-muted">
              history_toggle_off
            </span>
            <h3 className="text-sm font-semibold text-ink">没有匹配的浏览足迹</h3>
            <p className="text-xs text-muted">
              点击任意文章的研读抽屉后，系统将自动记录研读断点与足迹。
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
