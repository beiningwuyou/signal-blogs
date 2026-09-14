import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../state.jsx';
import { downloadText } from '../data/catalog.js';

export function WeeklyPage() {
  const [, setParams] = useSearchParams();
  const { notify } = useWorkspace();

  const [currentIssue, setCurrentIssue] = useState('111');

  const openDrawer = (articleId) => {
    setParams({ article: articleId });
  };

  const issuesList = [
    {
      id: '111',
      number: '第 111 期',
      title: '经验复利：当 Agent 从完成一次任务，走向团队与组织的长期工作',
      subtitle: '发现真正适合你的高质量内容 · 全球精选 20 篇',
      date: '2026-09-04',
      articleCount: 20,
      leadText:
        '大家好！欢迎阅读第 111 期 AI 精选文章推荐。过去几周，我们一直在讨论模型能力变强之后，什么会变得更稀缺。本周 20 篇内容把问题又向前推了一步：当 Agent 不再只完成单次指令任务，而是深度切入团队、产品和组织的长期工作流程，真正拉开差距的不是它今天能做多少，而是每一次执行后发生的纠正、经验复用与沉淀机制。',
      tags: ['#复杂系统协同', '#记忆检索架构', '#全球精选20篇'],
      highlights: [
        {
          id: 'weekly-111-1',
          cat: '多智能体组织',
          title: 'Building Effective Agents: A Year of Production Multi-Agent Systems',
          author: 'Anthropic Engineering',
          summary:
            '从单 Agent 提示词走向 Orchestrator-Workers，系统化解构长程任务中的状态同步与上下文边界隔离。',
        },
        {
          id: 'weekly-111-2',
          cat: '本地基础设施',
          title: 'Quoting and annotating with Datasette: SQLite WASM 离线生态',
          author: 'Simon Willison',
          summary: '零网络开销、单文件离线存储与个人情报分析工作台的范式重塑。',
        },
        {
          id: 'weekly-111-3',
          cat: '硬件与互联',
          title: 'B200 与 GB200 NVL72 铜缆背板公差实测与热应力分析报告',
          author: 'SemiAnalysis',
          summary: '万卡集群工业互联公差解析，算力基础设施由计算瓶颈转向电气与互联工程瓶颈。',
        },
      ],
    },
    {
      id: '110',
      number: '第 110 期',
      title: '新的稀缺：推理芯片、模型、编译与服务软件的协同循环',
      subtitle: '从算力暴力堆叠转向微观级协同演进',
      date: '2026-08-28',
      articleCount: 18,
      leadText:
        'OpenAI 用 Jalapeño 把推理芯片、模型、编译与服务软件放进同一个优化循环，标志着软硬件协同正式进入微观级优化阶段。真正的壁垒正从单卡浮点算力向拓扑互联与调度编译迁移。',
      tags: ['#软硬件协同', '#ASIC架构', '#推理即计算'],
      highlights: [],
    },
    {
      id: '109',
      number: '第 109 期',
      title: '程序员的职业未来：从单行代码实现者走向系统架构评测者',
      subtitle: '当编程 Agent 永久成为工作流的核心',
      date: '2026-08-21',
      articleCount: 22,
      leadText:
        '当编码 Agent 永久进入软件开发流程，程序员的未来既不是简单消失，也不是机械性减负，而是正在向系统架构评测者、代码品味审查者与决策者全面迁移。',
      tags: ['#开发者演进', '#代码智能体', '#认知重构'],
      highlights: [],
    },
  ];

  const activeIssueData = useMemo(() => {
    return issuesList.find((i) => i.id === currentIssue) || issuesList[0];
  }, [currentIssue]);

  const handleExportIssue = () => {
    const md =
      `# Signal Blogs — ${activeIssueData.number} · ${activeIssueData.title}\n\n` +
      `发布时间: ${activeIssueData.date} | 收录: ${activeIssueData.articleCount} 篇精选研报\n\n` +
      `## 导读摘要\n${activeIssueData.leadText}\n\n` +
      `## 精选导读清单\n` +
      activeIssueData.highlights
        .map((h, i) => `${i + 1}. [${h.cat}] **${h.title}** (${h.author})\n   ${h.summary}`)
        .join('\n\n');

    downloadText(`Signal_Desk_Weekly_Issue_${activeIssueData.id}.md`, md);
    notify(`已导出 ${activeIssueData.number} 精选周刊 Markdown`);
  };

  return (
    <article className="w-full max-w-5xl mx-auto space-y-8 pb-16 select-none">
      {/* 报头导读 */}
      <header className="border-b border-hairline pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11.5px] font-mono text-muted uppercase tracking-wider">
            <span>CURATED WEEKLY DISPATCH</span>
            <span>·</span>
            <span className="text-primary font-semibold">精选期刊合辑</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-ink tracking-tight flex items-center gap-2">
            <span>精选周刊</span>
            <span className="text-xs font-sans font-normal text-muted bg-[#f2ebe0] border border-hairline px-2 py-0.5 rounded-full">
              共 111 期
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportIssue}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface hover:bg-[#f6f3ee] border border-hairline rounded-md text-xs font-medium text-ink transition-colors shadow-2xs"
          >
            <span className="material-symbols-outlined text-[15px] text-muted">download</span>
            <span>导出本期周刊</span>
          </button>
        </div>
      </header>

      {/* 本期精选期刊主视窗 (Issue Cover Banner + Reading Window) */}
      <section className="bg-surface rounded-2xl border border-hairline shadow-sm overflow-hidden">
        {/* 杂志精装顶栏封面条 */}
        <div className="bg-[#24211e] text-white p-6 md:p-8 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none"></div>
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-amber-300 font-bold uppercase tracking-widest">
                ISSUE // {activeIssueData.id} · CURATED DISPATCH
              </span>
              <span className="text-xs text-stone-300 font-mono">{activeIssueData.date} 发布</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-serif font-bold text-white leading-tight">
              {activeIssueData.title}
            </h2>

            <p className="text-sm text-stone-300 font-sans max-w-2xl">{activeIssueData.subtitle}</p>
          </div>
        </div>

        {/* 导读视窗正文 */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <span className="material-symbols-outlined text-[16px]">menu_book</span>
              <span>主编导读</span>
            </div>
            <p className="font-serif text-[15px] text-[#2c2825] leading-relaxed">
              {activeIssueData.leadText}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {activeIssueData.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded bg-[#f4efe6] text-muted text-xs font-mono"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* 本期深度收录文章列表 */}
          {activeIssueData.highlights.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-hairline">
              <h3 className="text-xs font-mono text-muted uppercase tracking-wider font-semibold">
                本期精选研读推荐 ({activeIssueData.highlights.length})
              </h3>
              <div className="space-y-2.5">
                {activeIssueData.highlights.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => openDrawer(item.id)}
                    className="p-3.5 rounded-lg bg-[#faf6f0] border border-hairline/80 hover:border-primary/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[11.5px]">
                        <span className="font-bold text-primary font-mono">[{item.cat}]</span>
                        <span className="text-ink font-medium">{item.author}</span>
                      </div>
                      <h4 className="text-[14px] font-serif font-semibold text-ink group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-muted leading-relaxed line-clamp-1">
                        {item.summary}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-primary font-medium shrink-0 group-hover:translate-x-0.5 transition-transform">
                      <span>阅读全文</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 往期精选周刊网格归档 */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-hairline pb-2">
          <h3 className="text-lg font-serif font-medium text-ink">往期周刊归档</h3>
          <span className="text-xs text-muted font-mono">共 111 期</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {issuesList.map((issue) => (
            <article
              key={issue.id}
              onClick={() => setCurrentIssue(issue.id)}
              className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                currentIssue === issue.id
                  ? 'bg-[#faf6f0] border-primary ring-1 ring-primary shadow-xs'
                  : 'bg-surface border-hairline hover:border-[#d4cdc0] shadow-2xs hover:shadow-xs'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-ink">{issue.number}</span>
                  <span className="text-muted">{issue.date}</span>
                </div>
                <h4 className="text-[16px] font-serif font-semibold text-ink hover:text-primary transition-colors leading-snug">
                  {issue.title}
                </h4>
                <p className="text-xs text-[#57534e] leading-relaxed line-clamp-2">
                  {issue.leadText}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-hairline/60 text-xs">
                <span className="text-muted font-mono">收录 {issue.articleCount} 篇精选研报</span>
                <span className="text-primary font-medium flex items-center gap-0.5">
                  <span>{currentIssue === issue.id ? '正在阅读' : '打开阅读'}</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </article>
  );
}
