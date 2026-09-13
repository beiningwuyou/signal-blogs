import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../state.jsx';
import { downloadText } from '../data/catalog.js';

export function TimelinePage() {
  const [, setParams] = useSearchParams();
  const { notify } = useWorkspace();

  const [activeSpan, setActiveSpan] = useState('all');
  const [activeTrack, setActiveTrack] = useState('all');
  const [viewMode, setViewMode] = useState('stream'); // stream (时序流) or lanes (四维泳道)

  const openDrawer = (articleId) => {
    setParams({ article: articleId });
  };

  // 产业重大演进节点 (严格对齐 signal_desk_1 与 signal_desk_motion)
  const timelineNodes = [
    {
      id: 'node-1',
      date: '2026-09-08',
      span: '2026',
      track: 'compute',
      trackLabel: '算力与芯片竞争',
      source: 'Broadcom 8-K • Reuters',
      badge: 'S-Rank 极高重要',
      title: 'OpenAI 与博通敲定 10nm 定制张量芯片（ASIC）投片排期，首批算力预计 2026 年中交付',
      summary:
        '代号 Prometheus 的自研芯片锁定台积电 CoWoS-L 先进中介层产能，旨在从根本上平抑第三方 GPU 溢价与云端服务边际成本，能效比预估提升 2.8 倍。',
      impact: '硬件成本重构 · 去 CUDA 化',
      citationsCount: 3,
      verified: '3源交叉核实',
    },
    {
      id: 'node-2',
      date: '2026-09-08',
      span: '2026',
      track: 'model',
      trackLabel: '推理模型突破',
      source: 'Anthropic Engineering',
      badge: 'S-Rank 行业标杆',
      title: 'Anthropic 正式推出 Claude 3.7 Sonnet：首次引入混合推理（Hybrid Reasoning）机制',
      summary:
        '在单一商业 API 开放按 Token 调节思考预算，SWE-bench Verified 跃升至 70.3%，代码重构与大型工程任务准确率显著领跑。',
      impact: '推理计算范式 · 交互式思考',
      citationsCount: 4,
      verified: '官方实测与开源复现',
    },
    {
      id: 'node-3',
      date: '2026-08-22',
      span: '2026',
      track: 'compute',
      trackLabel: '算力与芯片竞争',
      source: 'xAI 技术通报',
      badge: 'A-Rank 万卡里程碑',
      title: 'xAI Colossus 智算集群突破十万卡互联与 Grok 算法演进',
      summary:
        '孟菲斯单一扁平网络在 150MW 满负荷下实现超低丢包率，万卡故障自愈时间缩减至 45 秒内，开启十万卡分布式并行新纪元。',
      impact: '智算互联拓扑 · 容错调度',
      citationsCount: 2,
      verified: '工信与电网实测',
    },
    {
      id: 'node-4',
      date: '2026-08-15',
      span: '2026',
      track: 'opensource',
      trackLabel: '开源与商业生态',
      source: '月之暗面发布会',
      badge: 'A-Rank 开源里程碑',
      title: '月之暗面发布 Kimi K3：开放 2.8 万亿参数全开源 MoE 模型，重构长文本推理成本',
      summary:
        '全球首个登顶网页工程竞技场的开源权重模型，触发跨国算力蒸馏与开源软件许可范式转移，推动企业私有化部署成本下降 80%。',
      impact: '开源生态破局 · 算力平权',
      citationsCount: 5,
      verified: 'HuggingFace 官方登顶',
    },
    {
      id: 'node-5',
      date: '2025-11-20',
      span: '2025',
      track: 'compute',
      trackLabel: '算力与芯片竞争',
      source: 'Ultra Ethernet Consortium',
      badge: 'A-Rank 互联协议',
      title: 'UEC 联盟发布 1.0 传输层标准：万卡 RoCEv2 智算集群去专有化',
      summary:
        '针对 AI 大吞吐突发流量优化拥塞通知，打破英伟达 InfiniBand 专有协议垄断，为万卡异构互联铺平开放工业标准。',
      impact: '智算网络解耦 · 工业互联',
      citationsCount: 2,
      verified: 'IEEE/UEC 官方联合发布',
    },
    {
      id: 'node-6',
      date: '2025-09-12',
      span: '2025',
      track: 'agent',
      trackLabel: '智能体与工作流',
      source: 'OpenAI Research',
      badge: 'S-Rank 拐点里程碑',
      title: 'OpenAI 正式披露 o1 与 o3 系列前沿测试：开启推理计算时代与思维链革命',
      summary:
        '计算范式正式从预训练算力堆叠（Pre-training Scaling）全面转向推理时算力扩展（Inference Scaling），重塑数学与编程边界。',
      impact: '推理即计算 · 隐藏思考链',
      citationsCount: 6,
      verified: 'ARC-AGI 突破',
    },
  ];

  // 过滤
  const filteredNodes = useMemo(() => {
    return timelineNodes.filter((node) => {
      if (activeSpan !== 'all' && node.span !== activeSpan) return false;
      if (activeTrack !== 'all' && node.track !== activeTrack) return false;
      return true;
    });
  }, [activeSpan, activeTrack]);

  const handleExportTimeline = () => {
    const md =
      `# Signal Desk — 产业重大事件演进时间轴\n\n导出时间: ${new Date().toLocaleString('zh-CN')}\n共收录: ${filteredNodes.length} 个核心历史节点\n\n---\n\n` +
      filteredNodes
        .map(
          (n, i) =>
            `${i + 1}. [${n.date}] **${n.title}**\n   - 维度: ${n.trackLabel}\n   - 信源: ${n.source} (${n.verified})\n   - 影响范式: ${n.impact}\n   - 概要: ${n.summary}\n`,
        )
        .join('\n');

    downloadText(`Signal_Desk_Timeline_${new Date().toISOString().slice(0, 10)}.md`, md);
    notify('已导出事件时间轴 Markdown 文档');
  };

  return (
    <article className="w-full max-w-5xl mx-auto space-y-5 pb-16 select-none">
      {/* 顶部周期控制栏 */}
      <section className="bg-surface rounded-xl border border-hairline shadow-2xs p-3.5 space-y-3">
        {/* 上行：时间周期切换与导出 */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline/70 pb-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {[
              { id: 'all', label: '全部周期 (142)' },
              { id: '2026', label: '2026 年 (进行中 · 48)' },
              { id: '2025', label: '2025 年下半年里程碑 (54)' },
            ].map((sp) => (
              <button
                key={sp.id}
                onClick={() => setActiveSpan(sp.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all shadow-2xs ${
                  activeSpan === sp.id
                    ? 'bg-ink text-white font-semibold'
                    : 'bg-[#f5f0e8] hover:bg-[#eae3d5] text-muted border border-hairline'
                }`}
              >
                {sp.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* 视图模式切换：时序流 vs 分支泳道 */}
            <div className="inline-flex rounded-lg border border-hairline p-0.5 bg-[#f4efe6] text-xs">
              <button
                onClick={() => setViewMode('stream')}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
                  viewMode === 'stream'
                    ? 'bg-white text-ink shadow-2xs font-semibold'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">view_agenda</span>
                <span>时序单轨</span>
              </button>
              <button
                onClick={() => setViewMode('lanes')}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
                  viewMode === 'lanes'
                    ? 'bg-white text-ink shadow-2xs font-semibold'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">view_column</span>
                <span>四维泳道</span>
              </button>
            </div>

            <button
              onClick={handleExportTimeline}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#f6f3ee] border border-hairline rounded-md text-xs font-medium text-ink transition-colors shadow-2xs"
            >
              <span className="material-symbols-outlined text-[14px] text-muted">download</span>
              <span>导出时间轴</span>
            </button>
          </div>
        </div>

        {/* 下行：四维分类胶囊 */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {[
            { id: 'all', label: '全部维度' },
            { id: 'compute', label: '算力与芯片竞争' },
            { id: 'model', label: '推理模型突破' },
            { id: 'agent', label: '智能体与工作流' },
            { id: 'opensource', label: '开源与商业生态' },
          ].map((trk) => (
            <button
              key={trk.id}
              onClick={() => setActiveTrack(trk.id)}
              className={`text-xs px-2.5 py-0.5 rounded transition-colors border ${
                activeTrack === trk.id
                  ? 'bg-[#f2ebe0] text-ink font-semibold border-hairline'
                  : 'bg-white hover:bg-[#f6f3ee] text-muted border-hairline'
              }`}
            >
              {trk.label}
            </button>
          ))}
        </div>
      </section>

      {/* 视图一：时序单轨深度流 */}
      {viewMode === 'stream' && (
        <div className="space-y-4 pt-1">
          {filteredNodes.map((node) => (
            <article
              key={node.id}
              onClick={() => openDrawer(node.id)}
              className="group bg-surface rounded-xl border border-hairline hover:border-[#d4cdc0] p-4.5 shadow-2xs hover:shadow-sm transition-all cursor-pointer relative"
            >
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      {node.date}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#f4efe6] text-ink font-medium border border-hairline">
                      {node.trackLabel}
                    </span>
                    <span className="text-muted font-medium">{node.source}</span>
                    <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 font-mono">
                      <span className="material-symbols-outlined text-[12px]">verified</span>
                      {node.verified}
                    </span>
                  </div>

                  <span className="font-mono text-[11px] text-primary font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {node.badge}
                  </span>
                </div>

                <h2 className="text-[17px] font-serif text-ink font-semibold group-hover:text-primary transition-colors leading-snug">
                  {node.title}
                </h2>

                <p className="text-xs text-[#57534e] leading-relaxed">{node.summary}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-hairline/60 text-[11px] text-muted">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-primary font-medium">
                      <span className="material-symbols-outlined text-[14px]">schema</span>
                      <span>影响范式: {node.impact}</span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-muted">
                        attachment
                      </span>
                      <span>{node.citationsCount} 篇原始研报</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(
                          `[${node.date}] ${node.title} · 核心结论：${node.summary}`,
                        );
                        notify('已复制时间轴研判摘要');
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f4efe6] hover:bg-[#e8e3d8] text-ink transition-colors"
                    >
                      <span className="material-symbols-outlined text-[13px]">content_copy</span>
                      <span>引用</span>
                    </button>
                    <span className="inline-flex items-center gap-0.5 text-primary font-medium group-hover:translate-x-0.5 transition-transform">
                      <span>研读洞察</span>
                      <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 视图二：四维分支泳道 (Swimlanes View) */}
      {viewMode === 'lanes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {[
            { id: 'compute', label: '01/ 算力与芯片', color: 'border-primary' },
            { id: 'model', label: '02/ 推理与模型', color: 'border-teal-600' },
            { id: 'agent', label: '03/ 智能体工作流', color: 'border-amber-700' },
            { id: 'opensource', label: '04/ 开源与生态', color: 'border-stone-600' },
          ].map((track) => {
            const laneNodes = filteredNodes.filter((n) => n.track === track.id);

            return (
              <div
                key={track.id}
                className="bg-[#faf6f0] rounded-xl border border-hairline p-3.5 space-y-3 flex flex-col"
              >
                <div className={`border-l-3 ${track.color} pl-2.5 py-0.5 flex items-center justify-between`}>
                  <h3 className="text-xs font-serif font-bold text-ink">{track.label}</h3>
                  <span className="font-mono text-[10.5px] text-muted bg-surface px-2 py-0.5 rounded border border-hairline">
                    {laneNodes.length} Nodes
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px] pr-0.5">
                  {laneNodes.map((node) => (
                    <div
                      key={node.id}
                      onClick={() => openDrawer(node.id)}
                      className="p-3 bg-surface rounded-lg border border-hairline/80 hover:border-primary/50 shadow-2xs hover:shadow-xs transition-all cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-muted">
                        <span className="text-primary font-bold">{node.date}</span>
                        <span>{node.source.split('•')[0].trim()}</span>
                      </div>
                      <h4 className="text-xs font-serif font-semibold text-ink leading-snug hover:text-primary transition-colors line-clamp-2">
                        {node.title}
                      </h4>
                      <p className="text-[11px] text-[#57534e] line-clamp-2 leading-relaxed">
                        {node.summary}
                      </p>
                    </div>
                  ))}

                  {!laneNodes.length && (
                    <div className="py-8 text-center text-xs text-muted">暂无匹配节点</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
