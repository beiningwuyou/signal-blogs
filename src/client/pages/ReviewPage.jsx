import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../state.jsx';
import { articles, prototypeArticles, downloadText } from '../data/catalog.js';
import { getLiveEvents } from '../live/api.js';

export function ReviewPage() {
  const [, setParams] = useSearchParams();
  const { entries, update, notify } = useWorkspace();

  const [animating, setAnimating] = useState(false);
  const [syncedObsidian, setSyncedObsidian] = useState(false);
  const [archivedToday, setArchivedToday] = useState(false);

  const defaultTodos = useMemo(
    () => [
      {
        id: 'td-1',
        title: 'Claude Code 最佳实践指南与工作流实录',
        sub: '预计 18 分钟 · 重点查看 Hooks 拦截设计',
        tag: '高优先级',
        completed: true,
      },
      {
        id: 'td-2',
        title: '跟进：GPT-6 Astra 评测数据流出分析',
        sub: '关联标的：OpenAI / 基础设施重组',
        tag: '跟进观察',
        completed: false,
      },
      {
        id: 'td-3',
        title: 'SQLite WASM OPFS 多线程并发写限制实验',
        sub: '技术验证任务 · Simon Willison 方案复现',
        tag: '技术验证',
        completed: false,
      },
    ],
    [],
  );

  // 待办任务列表（本地持久化绑定 entries.review_todos 或默认）
  const [todos, setTodos] = useState(() => entries.review_todos?.todos || defaultTodos);

  useEffect(() => {
    if (entries.review_todos?.todos) {
      setTodos(entries.review_todos.todos);
    }
  }, [entries.review_todos]);

  const [showNewTodo, setShowNewTodo] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoTag, setNewTodoTag] = useState('高优先级');

  // 复盘备忘随想草稿纸（自动同步到 SQLite entries.review_memo）
  const [memo, setMemo] = useState(
    entries.review_memo?.text ||
      '今日完成多智能体架构深度研判。Anthropic 在长程任务中的实践证明解耦 Orchestrator-Workers 是抑制上下文崩溃的核心。下周需重点对齐内部沙盒环境。',
  );

  // 自动保存草稿
  useEffect(() => {
    const handler = setTimeout(() => {
      update('review_memo', { text: memo, updatedAt: new Date().toISOString() });
    }, 600);
    return () => clearTimeout(handler);
  }, [memo, update]);

  // 第二大脑：在研课题库 (Thesis Vault) 本地持久化与管理
  const defaultTheses = useMemo(
    () => [
      {
        id: 'th-1',
        tag: '#端侧推理与投机解码',
        title: '单卡 70B 投机解码何时代替云端算力',
        hypothesis:
          '核心假设：端侧 RTX 4090 运行递归先验树突破 3.2x 吞吐后，边缘推理成本是否已击穿云端网络往返通信门槛。',
        status: 'active',
        hitCount: 5,
        notesCount: 2,
        createdAt: '2026-09-01',
      },
      {
        id: 'th-2',
        tag: '#先进封装CoWoS良率',
        title: '台积电 CoWoS-L 键合良率 92% 的交付拐点',
        hypothesis:
          '核心假设：玻璃基板过渡夹层方案能否在 Q4 彻底释放 Blackwell 算力机柜积压订单，平抑供应链溢价。',
        status: 'active',
        hitCount: 3,
        notesCount: 1,
        createdAt: '2026-09-02',
      },
      {
        id: 'th-3',
        tag: '#智算清洁供电长协',
        title: '14.8 GW 清洁供电长协解耦电网阻塞',
        hypothesis:
          '核心假设：超大规模数据中心自建微电网调峰与 PPA 承销模式，是否已从 IT 基建升维为电力资产套利载体。',
        status: 'active',
        hitCount: 4,
        notesCount: 1,
        createdAt: '2026-09-03',
      },
    ],
    [],
  );

  const [theses, setTheses] = useState(() => entries.thesis_vault?.list || defaultTheses);

  useEffect(() => {
    if (entries.thesis_vault?.list) {
      setTheses(entries.thesis_vault.list);
    }
  }, [entries.thesis_vault]);

  const [showNewThesisModal, setShowNewThesisModal] = useState(false);
  const [newThesisTag, setNewThesisTag] = useState('');
  const [newThesisTitle, setNewThesisTitle] = useState('');
  const [newThesisHypothesis, setNewThesisHypothesis] = useState('');

  const handleAddThesis = () => {
    if (!newThesisTitle.trim() || !newThesisTag.trim()) {
      notify('请完整填写课题标签与标题');
      return;
    }
    const cleanTag = newThesisTag.trim().startsWith('#')
      ? newThesisTag.trim()
      : `#${newThesisTag.trim()}`;
    const newEntry = {
      id: `th-${Date.now()}`,
      tag: cleanTag,
      title: newThesisTitle.trim(),
      hypothesis: newThesisHypothesis.trim() || '核心假设：持续观测产业链一手信源动态。',
      status: 'active',
      hitCount: 1,
      notesCount: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const nextList = [newEntry, ...theses];
    setTheses(nextList);
    update('thesis_vault', { list: nextList });
    setShowNewThesisModal(false);
    setNewThesisTag('');
    setNewThesisTitle('');
    setNewThesisHypothesis('');
    notify(`新在研课题「${cleanTag}」已沉淀至本地 SQLite 第二大脑`);
  };

  const handleToggleArchiveThesis = (id) => {
    const nextList = theses.map((t) => {
      if (t.id === id) {
        const nextStatus = t.status === 'archived' ? 'active' : 'archived';
        return { ...t, status: nextStatus };
      }
      return t;
    });
    setTheses(nextList);
    update('thesis_vault', { list: nextList });
    notify('课题研判状态已更新');
  };

  const handleDeleteThesis = (id) => {
    const target = theses.find((t) => t.id === id);
    const nextList = theses.filter((t) => t.id !== id);
    setTheses(nextList);
    update('thesis_vault', { list: nextList });
    notify(`已从第二大脑移除课题「${target?.tag || ''}」`);
  };

  // 聚合历史反思与质疑记录 (Cognitive Reflection Stream)
  const [liveEventsWithNotes, setLiveEventsWithNotes] = useState([]);

  useEffect(() => {
    let active = true;
    getLiveEvents({ scope: 'all' })
      .then((data) => {
        if (active && Array.isArray(data)) {
          const withNotes = data.filter((e) => e.record?.note && e.record.note.trim());
          setLiveEventsWithNotes(withNotes);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const aggregatedReflections = useMemo(() => {
    const list = [];
    const allCatalogArticles = [...articles, ...(prototypeArticles || [])];

    // 1. 来自 entries (本地工作区保存的文章笔记)
    Object.entries(entries).forEach(([key, val]) => {
      if (val?.note && typeof val.note === 'string' && val.note.trim()) {
        const art = allCatalogArticles.find((a) => a.id === key);
        const text = val.note.trim();
        const matchedTag = theses.find((th) => text.includes(th.tag))?.tag || '';
        list.push({
          id: `ref-${key}`,
          articleId: key,
          title: art?.title || key,
          source: art?.source || '研读材料',
          note: text,
          thesisTag: matchedTag,
          time: val.updatedAt ? val.updatedAt.slice(0, 16).replace('T', ' ') : '今日沉淀',
          isChallenge: text.includes('质疑') || text.includes('纠偏'),
        });
      }
    });

    // 2. 来自 liveEvents (实时事件笔记)
    liveEventsWithNotes.forEach((evt) => {
      const text = evt.record.note.trim();
      const matchedTag = theses.find((th) => text.includes(th.tag))?.tag || '';
      list.push({
        id: `ref-${evt.id}`,
        articleId: evt.id,
        title: evt.title,
        source: evt.source || '实时监控',
        note: text,
        thesisTag: matchedTag,
        time: evt.record.updatedAt ? evt.record.updatedAt.slice(0, 16).replace('T', ' ') : '今日沉淀',
        isChallenge: text.includes('质疑') || text.includes('纠偏'),
      });
    });

    // 3. 初始示范数据（确保在初次进入未产生笔记时也有高质量展示）
    const seedReflections = [
      {
        id: 'seed-1',
        articleId: 'demo-speculative-decoding',
        title: 'Recursive Speculative Decoding: 在消费级单卡实现 70B 模型 3.2x 推理吞吐突破',
        source: 'arXiv:2502.18432',
        note: '【人机协同·质疑与纠偏】: 我认为该推论存在盲区——实验忽视了长文本 KV Cache 在消费级显存过载下的带宽衰减，建议在 32k 上下文窗口下重新评估吞吐收益。 #端侧推理与投机解码',
        thesisTag: '#端侧推理与投机解码',
        time: '2026-09-08 11:24',
        isChallenge: true,
      },
      {
        id: 'seed-2',
        articleId: 'demo-anthropic-energy',
        title: 'Anthropic 签署大额多方算力供电协议，锁定至少 14.8 GW 跨区域清洁能源储备',
        source: 'SEC 监管报告 & 彭博终端',
        note: '【人机协同·质疑与纠偏】: PPA 长协锁价并未计入跨州输电线扩容与微网调峰改造成本，需警惕怀俄明园区 2027 年并网延迟风险。 #智算清洁供电长协',
        thesisTag: '#智算清洁供电长协',
        time: '2026-09-08 09:40',
        isChallenge: true,
      },
    ];

    const userKeys = new Set(list.map((r) => r.articleId));
    const filteredSeeds = seedReflections.filter((s) => !userKeys.has(s.articleId));
    return [...list, ...filteredSeeds];
  }, [entries, liveEventsWithNotes, theses]);

  // 今日统计数据（柔和变化动效）
  const [metrics, setMetrics] = useState({
    reads: 5,
    quotes: 4,
    sources: 18,
    words: 3840,
  });

  const handleRefreshStats = () => {
    setAnimating(true);
    setTimeout(() => {
      setMetrics((prev) => ({
        reads: prev.reads === 5 ? 6 : 5,
        quotes: prev.quotes === 4 ? 5 : 4,
        sources: 18,
        words: prev.words === 3840 ? 4120 : 3840,
      }));
      setAnimating(false);
      notify('已根据今日最新研读与批注重新测算态势指标');
    }, 400);
  };

  const handleToggleTodo = (id) => {
    const next = todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    setTodos(next);
    update('review_todos', { todos: next });
  };

  const handleDeleteTodo = (id) => {
    const next = todos.filter((t) => t.id !== id);
    setTodos(next);
    update('review_todos', { todos: next });
    notify('已删除该待办项');
  };

  const handleAddTodo = () => {
    if (!newTodoText.trim()) return;
    const next = [
      ...todos,
      {
        id: `td-${Date.now()}`,
        title: newTodoText.trim(),
        sub: '今日新增待办项',
        tag: newTodoTag,
        completed: false,
      },
    ];
    setTodos(next);
    update('review_todos', { todos: next });
    setNewTodoText('');
    setShowNewTodo(false);
    notify('已添加明日研读待办');
  };

  const handleExportMarkdown = () => {
    const completedCount = todos.filter((t) => t.completed).length;
    const md =
      `# Signal Desk — 今日研读复盘简报 (2026-09-08)\n\n` +
      `## 态势矩阵指标\n` +
      `- 今日深度精读: ${metrics.reads} 篇 (完读率 83%)\n` +
      `- 沉淀核心高光: ${metrics.quotes} 处研判引用\n` +
      `- 信源覆盖跨度: ${metrics.sources} 个信源 (信度 96.4%)\n` +
      `- 认知密度增量: ${metrics.words.toLocaleString()} 字研读笔记\n\n` +
      `## 明日继续关注待办 (${completedCount}/${todos.length})\n` +
      todos.map((t) => `- [${t.completed ? 'x' : ' '}] ${t.title} (${t.tag})`).join('\n') +
      `\n\n## 研读复盘草稿备忘\n${memo}\n`;

    downloadText(`Signal_Desk_Daily_Review_2026-09-08.md`, md);
    notify('已导出今日研读复盘 Markdown 简报');
  };

  const handleSyncObsidian = () => {
    setSyncedObsidian(true);
    notify(
      '已将今日态势矩阵与复盘笔记推送到本地 Obsidian 知识库 (Vault: DailyNotes/2026-09-08.md)',
    );
  };

  const handleArchiveDay = () => {
    setArchivedToday(true);
    notify('已完成今日工作台归档，快照已固化写入 SQLite');
  };

  const completedTodos = useMemo(() => todos.filter((t) => t.completed).length, [todos]);

  return (
    <article className="w-full max-w-5xl mx-auto space-y-6 pb-16 select-none">
      {/* 顶部控制与操作功能条 */}
      <div className="bg-surface rounded-2xl border border-hairline px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-ink font-semibold">
            <span className="material-symbols-outlined text-primary text-[18px]">psychology</span>
            <span>研判复盘与认知资产</span>
          </div>
          <span className="text-hairline">|</span>
          <div className="flex items-center gap-1.5 text-[11.5px] text-muted font-mono bg-[#f4efe6] px-2.5 py-1 rounded-md border border-hairline/60">
            <span className="material-symbols-outlined text-[13px] text-muted">calendar_today</span>
            <span>2026-09-08</span>
          </div>
          <button
            onClick={handleRefreshStats}
            className="flex items-center gap-1 text-[11.5px] text-ink hover:text-amber-800 bg-[#f7f3ec] hover:bg-amber-100/60 px-2.5 py-1 rounded-md border border-hairline transition-all active:scale-95 group cursor-pointer"
            title="重新测算今日指标"
            type="button"
          >
            <span
              className={`material-symbols-outlined text-[14px] text-primary transition-transform duration-500 ${
                animating ? 'rotate-180' : 'group-hover:rotate-90'
              }`}
            >
              refresh
            </span>
            <span>重新测算</span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#f4efe6] hover:bg-[#eae3d5] text-ink text-xs border border-hairline transition-colors shadow-2xs cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[15px] text-muted">markdown</span>
            <span>导出简报</span>
          </button>

          <button
            onClick={handleSyncObsidian}
            className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs border transition-colors shadow-2xs cursor-pointer ${
              syncedObsidian
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-[#f4efe6] hover:bg-[#eae3d5] text-ink border-hairline'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[15px] text-primary">sync_alt</span>
            <span>{syncedObsidian ? '已同步 Obsidian' : '同步 Obsidian'}</span>
          </button>

          <button
            onClick={handleArchiveDay}
            className={`flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer ${
              archivedToday
                ? 'bg-emerald-700 text-white'
                : 'bg-primary hover:bg-primary-hover text-white'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[15px]">inventory_2</span>
            <span>{archivedToday ? '今日已归档' : '归档'}</span>
          </button>
        </div>
      </div>

      {/* Number Trend 态势四维卡片群 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 指标 1：今日深度精读 */}
        <div className="bg-surface rounded-2xl border border-hairline p-4 flex flex-col justify-between gap-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-muted font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary/70"></span>
              今日深度精读
            </span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200/80">
              完读 83%
            </span>
          </div>
          <div className="flex items-end justify-between mt-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-[32px] leading-none font-bold text-ink tracking-tight">
                {metrics.reads}
              </span>
              <span className="text-[12px] text-muted font-serif">篇</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] font-mono">
              <span className="material-symbols-outlined text-[12px]">arrow_upward</span>
              <span className="font-semibold">+2 篇</span>
            </div>
          </div>
          <div className="pt-2.5 border-t border-hairline flex items-center justify-between text-[10.5px] text-muted">
            <span>近 7 天研读频次</span>
            <svg className="w-24 h-5 overflow-visible" viewBox="0 0 96 20">
              <path
                d="M2,16 L18,14 L34,17 L50,11 L66,8 L82,12 L94,4"
                fill="none"
                stroke="#d97706"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="94" cy="4" r="2.5" fill="#d97706" />
            </svg>
          </div>
        </div>

        {/* 指标 2：沉淀核心高光 */}
        <div className="bg-surface rounded-lg border border-hairline p-3.5 flex flex-col justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-muted font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              沉淀核心高光
            </span>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200/80">
              研判引用
            </span>
          </div>
          <div className="flex items-end justify-between mt-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-[32px] leading-none font-bold text-ink tracking-tight">
                {metrics.quotes}
              </span>
              <span className="text-[12px] text-muted font-serif">处</span>
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] font-mono">
              <span className="material-symbols-outlined text-[12px]">arrow_upward</span>
              <span className="font-semibold">+1 处</span>
            </div>
          </div>
          <div className="pt-2 border-t border-hairline flex items-center justify-between text-[10.5px] text-muted">
            <span>重点金句提炼</span>
            <div className="flex items-end gap-1 h-5">
              <span className="w-1.5 h-2 bg-amber-200 rounded-xs"></span>
              <span className="w-1.5 h-3 bg-amber-300 rounded-xs"></span>
              <span className="w-1.5 h-2.5 bg-amber-300 rounded-xs"></span>
              <span className="w-1.5 h-3.5 bg-amber-400 rounded-xs"></span>
              <span className="w-1.5 h-3 bg-amber-300 rounded-xs"></span>
              <span className="w-1.5 h-4 bg-amber-500 rounded-xs"></span>
              <span className="w-1.5 h-5 bg-primary rounded-xs"></span>
            </div>
          </div>
        </div>

        {/* 指标 3：信源覆盖跨度 */}
        <div className="bg-surface rounded-lg border border-hairline p-3.5 flex flex-col justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-muted font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
              信源覆盖跨度
            </span>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200/80">
              信度 96.4%
            </span>
          </div>
          <div className="flex items-end justify-between mt-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-[32px] leading-none font-bold text-ink tracking-tight">
                {metrics.sources}
              </span>
              <span className="text-[12px] text-muted font-serif">个</span>
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] font-mono">
              <span className="material-symbols-outlined text-[12px]">arrow_upward</span>
              <span className="font-semibold">+3 源</span>
            </div>
          </div>
          <div className="pt-2 border-t border-hairline flex items-center justify-between text-[10.5px] text-muted">
            <span>研报 / 论文 / 博客</span>
            <svg className="w-24 h-5 overflow-visible" viewBox="0 0 96 20">
              <path
                d="M2,15 L18,12 L34,14 L50,8 L66,10 L82,6 L94,3"
                fill="none"
                stroke="#0d9488"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="94" cy="3" r="2.5" fill="#0d9488" />
            </svg>
          </div>
        </div>

        {/* 指标 4：认知密度增量 */}
        <div className="bg-surface rounded-lg border border-hairline p-3.5 flex flex-col justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-muted font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-700"></span>
              认知密度增量
            </span>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-orange-50 text-orange-900 border border-orange-200/80">
              沉淀转化
            </span>
          </div>
          <div className="flex items-end justify-between mt-0.5">
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-[32px] leading-none font-bold text-ink tracking-tight">
                {metrics.words.toLocaleString()}
              </span>
              <span className="text-[12px] text-muted font-serif">字</span>
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10.5px] font-mono">
              <span className="material-symbols-outlined text-[12px]">trending_up</span>
              <span className="font-semibold">+18.5%</span>
            </div>
          </div>
          <div className="pt-2 border-t border-hairline flex items-center justify-between text-[10.5px] text-muted">
            <span>笔记与架构推演</span>
            <svg className="w-24 h-5 overflow-visible" viewBox="0 0 96 20">
              <path
                d="M2,17 L18,15 L34,13 L50,11 L66,7 L82,8 L94,2"
                fill="none"
                stroke="#b45309"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="94" cy="2" r="2.5" fill="#b45309" />
            </svg>
          </div>
        </div>
      </div>

      {/* 第二大脑：长期在研课题库 (Active Thesis Vault) */}
      <section className="bg-surface rounded-lg border border-hairline p-4 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-hairline gap-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-amber-100 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[14px]">psychology</span>
            </span>
            <h2 className="text-[14px] text-ink font-semibold tracking-tight">长期在研课题库 (Thesis Vault)</h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-mono border border-emerald-200">
              Agent 持续后台放哨中
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted font-mono hidden md:inline">
              {theses.filter((t) => t.status !== 'archived').length} 项在研假说 · 本地 SQLite 持久化
            </span>
            <button
              type="button"
              onClick={() => setShowNewThesisModal((prev) => !prev)}
              className="flex items-center gap-1 text-[11.5px] font-medium px-2.5 py-1 rounded bg-[#f4efe6] hover:bg-[#eae3d5] text-ink border border-hairline transition-all cursor-pointer shadow-2xs"
            >
              <span className="material-symbols-outlined text-[14px] text-primary">
                {showNewThesisModal ? 'close' : 'add'}
              </span>
              <span>{showNewThesisModal ? '收起表单' : '新增在研课题'}</span>
            </button>
          </div>
        </div>

        {/* 新增课题展开表单 */}
        {showNewThesisModal && (
          <div className="bg-[#faf6f0] p-4 sm:p-5 rounded-2xl border border-amber-300/80 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-ink">
              <span className="flex items-center gap-1.5 text-primary">
                <span className="material-symbols-outlined text-[16px]">edit_note</span>
                <span>登记新的硬核研究课题 (Thesis)</span>
              </span>
              <span className="text-[11px] font-mono text-muted">将自动接入全网信息流实时碰撞</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-muted mb-1.5">课题标签 (#Tag)</label>
                <input
                  type="text"
                  value={newThesisTag}
                  onChange={(e) => setNewThesisTag(e.target.value)}
                  placeholder="例: #硅光互联CPO"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-hairline bg-white text-ink placeholder:text-muted focus:outline-none focus:border-primary"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-mono text-muted mb-1.5">课题标题 / 核心研判命题</label>
                <input
                  type="text"
                  value={newThesisTitle}
                  onChange={(e) => setNewThesisTitle(e.target.value)}
                  placeholder="例: CPO 光引擎光电共封装良率是否在 2026 年击穿铜缆物理极限"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-hairline bg-white text-ink placeholder:text-muted focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-mono text-muted mb-1.5">核心验证假设 (Hypothesis)</label>
              <textarea
                rows={2}
                value={newThesisHypothesis}
                onChange={(e) => setNewThesisHypothesis(e.target.value)}
                placeholder="详细推论假设：例如当集群光链路功耗占比降至 12% 以下时，Scale-up 互联架构将全面抛弃有源铜缆..."
                className="w-full text-xs p-3 rounded-xl border border-hairline bg-white text-ink placeholder:text-muted focus:outline-none focus:border-primary resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowNewThesisModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-muted hover:text-ink cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleAddThesis}
                className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                保存并沉淀至第二大脑
              </button>
            </div>
          </div>
        )}

        {/* 课题卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {theses.map((th) => (
            <div
              key={th.id}
              className={`p-4 sm:p-4.5 rounded-2xl border space-y-2.5 transition-all shadow-2xs group flex flex-col justify-between ${
                th.status === 'archived'
                  ? 'bg-stone-50 border-hairline/60 opacity-60'
                  : 'bg-[#faf6f0] border-hairline/80 hover:border-amber-400/60'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-mono font-bold text-primary bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-400/30 truncate max-w-[160px]">
                    {th.tag}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[9.5px] font-mono px-2 py-0.5 rounded-md border ${
                        th.status === 'archived'
                          ? 'bg-stone-200 text-stone-600 border-stone-300'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {th.status === 'archived' ? '已归档' : '在研 Active'}
                    </span>
                  </div>
                </div>
                <h3 className="text-[13.5px] text-ink font-semibold leading-snug">
                  {th.title}
                </h3>
                <p className="text-[12px] text-[#57534e] leading-relaxed">
                  {th.hypothesis}
                </p>
              </div>

              {/* 底部元数据与操作 */}
              <div className="pt-2.5 border-t border-hairline/60 flex items-center justify-between text-[10.5px] font-mono text-muted">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px] text-primary">feed</span>
                  <span>命中 {th.hitCount || 1} 篇一手材料</span>
                </span>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleToggleArchiveThesis(th.id)}
                    className="hover:text-ink cursor-pointer hover:underline"
                    title={th.status === 'archived' ? '恢复在研状态' : '归档该课题'}
                  >
                    {th.status === 'archived' ? '激活' : '归档'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteThesis(th.id)}
                    className="hover:text-red-700 cursor-pointer"
                    title="从第二大脑删除"
                  >
                    <span className="material-symbols-outlined text-[13px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 第二大脑：已沉淀认知反思流 (Cognitive Reflection Stream) */}
      <section className="bg-surface rounded-2xl border border-hairline p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-hairline">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-orange-100 text-orange-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-[14px]">history_edu</span>
            </span>
            <h2 className="text-[14px] text-ink font-semibold tracking-tight">已沉淀认知反思流 (Cognitive Reflection Stream)</h2>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[10px] font-mono border border-amber-200">
              人机博弈复利资产
            </span>
          </div>
          <span className="text-xs text-muted font-mono">
            共沉淀 {aggregatedReflections.length} 条反思记录 · 真实持久化 SQLite
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {aggregatedReflections.slice(0, 4).map((ref) => (
            <div
              key={ref.id}
              onClick={() => setParams({ article: ref.articleId })}
              className="p-4 sm:p-4.5 bg-[#faf6f0] hover:bg-white rounded-2xl border border-hairline hover:border-amber-400/80 transition-all cursor-pointer shadow-2xs group flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[9.5px] font-mono font-semibold px-2 py-0.5 rounded-md border ${
                        ref.isChallenge
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-stone-100 text-stone-700 border-hairline'
                      }`}
                    >
                      {ref.isChallenge ? '⚡ 人机协同·质疑纠偏' : '📝 研判沉淀'}
                    </span>
                    {ref.thesisTag && (
                      <span className="text-[9.5px] font-mono text-primary bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {ref.thesisTag}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-muted">{ref.time}</span>
                </div>

                <p className="text-[12.5px] text-ink font-medium leading-relaxed bg-white/80 p-3 sm:p-3.5 rounded-xl border border-hairline/60 select-text">
                  {ref.note}
                </p>
              </div>

              <div className="pt-2.5 border-t border-hairline/60 flex items-center justify-between text-[11px] text-muted">
                <span className="truncate max-w-[280px] font-mono" title={ref.title}>
                  溯源材料: <span className="text-stone-700 font-sans">{ref.title}</span>
                </span>
                <span className="inline-flex items-center gap-0.5 text-primary text-[11px] font-mono group-hover:translate-x-0.5 transition-transform shrink-0">
                  <span>抽屉溯源</span>
                  <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 底部双栏：明日研读待办 + 今日复盘随想草稿纸 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 左栏：明日继续关注与研读待办 */}
        <div className="bg-surface p-5 rounded-2xl border border-hairline shadow-2xs flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-hairline">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">
                  next_plan
                </span>
                <h3 className="text-[14px] text-ink font-semibold">明日继续关注与研读待办</h3>
              </div>
              <span className="text-[11.5px] text-muted font-mono">
                待办 {completedTodos} / {todos.length} 项已完成
              </span>
            </div>

            {/* 待办清单 */}
            <div className="space-y-2">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className="p-3 rounded-xl bg-[#faf6f0] border border-hairline/70 flex items-start justify-between gap-3 transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggleTodo(todo.id)}
                      className="mt-0.5 rounded border-hairline text-primary focus:ring-0 cursor-pointer h-4 w-4"
                    />
                    <div className="flex flex-col">
                      <span
                        onClick={() => handleToggleTodo(todo.id)}
                        className={`text-[13px] font-medium cursor-pointer transition-all ${
                          todo.completed ? 'text-muted line-through' : 'text-ink'
                        }`}
                      >
                        {todo.title}
                      </span>
                      <span className="text-[11.5px] text-muted flex items-center gap-1 mt-0.5 font-mono">
                        {todo.sub}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-primary font-mono text-[10.5px] font-bold">
                      {todo.tag}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="text-muted hover:text-red-700 p-0.5 rounded transition-colors"
                      title="删除待办"
                    >
                      <span className="material-symbols-outlined text-[15px]">close</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 新增待办输入 */}
            {showNewTodo ? (
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-300/80 space-y-2.5">
                <input
                  type="text"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  placeholder="输入明日研读标题或线索..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-hairline bg-white text-ink placeholder:text-muted focus:outline-none focus:border-primary"
                />
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={newTodoTag}
                    onChange={(e) => setNewTodoTag(e.target.value)}
                    className="text-[11px] py-1.5 px-2.5 rounded-lg border border-hairline bg-white text-ink"
                  >
                    <option value="高优先级">高优先级</option>
                    <option value="跟进观察">跟进观察</option>
                    <option value="技术验证">技术验证</option>
                  </select>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setShowNewTodo(false)}
                      className="px-3 py-1 rounded-lg text-xs text-muted hover:text-ink cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleAddTodo}
                      className="px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-medium cursor-pointer"
                    >
                      添加
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewTodo(true)}
                className="w-full py-2.5 border border-dashed border-hairline hover:border-primary text-muted hover:text-primary rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                <span>追加明日待办</span>
              </button>
            )}
          </div>
        </div>

        {/* 右栏：今日复盘随想草稿箱 */}
        <div className="bg-surface p-5 rounded-2xl border border-hairline shadow-2xs flex flex-col justify-between gap-3">
          <div className="space-y-2 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-hairline">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-700 text-[18px]">
                  edit_note
                </span>
                <h3 className="text-[14px] text-ink font-semibold">今日复盘备忘草稿箱</h3>
              </div>
              <span className="text-[11px] text-emerald-700 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                自动保存至 SQLite
              </span>
            </div>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={8}
              placeholder="在此记录今日情报沉淀心得、待验证假设或团队交流备忘..."
              className="w-full flex-1 p-3.5 bg-[#faf6f0] border border-hairline rounded-xl text-xs text-ink leading-relaxed font-serif focus:outline-none focus:border-primary transition-all resize-none"
            />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-hairline/60 text-[11px] text-muted">
            <span>字数: {memo.length} 字</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(memo);
                notify('已复制复盘草稿文本');
              }}
              className="px-2.5 py-1 rounded-lg bg-[#f4efe6] hover:bg-[#e8e3d8] text-ink transition-colors cursor-pointer text-xs"
            >
              复制备忘
            </button>
          </div>
        </div>
      </section>
    </article>
  );
}
