import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../state.jsx';

export function TopicsPage() {
  const [, setParams] = useSearchParams();
  const { toggleBookmark, entries, notify } = useWorkspace();

  const [activeDimension, setActiveDimension] = useState('all');
  const [activeSubFocus, setActiveSubFocus] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const openDrawer = (articleId) => {
    setParams({ article: articleId });
  };

  // 38 项深度研读专题精选库 (严格对齐 signal_desk_2 与 signal_desk_10)
  const topicsData = [
    {
      id: 'topic-kimi-k3',
      dim: 'company_model',
      sub: 'opensource',
      coverBadge: '🏢 Kimi / 月之暗面',
      subBadge: '🌐 2.8T 开源',
      title: 'Kimi K3 发布：开放前沿与「AI 斯普特尼克时刻」',
      summary:
        '月之暗面发布 2.8 万亿参数开源权重模型 Kimi K3：全球首个登顶网页工程竞技场的开源模型，触发跨国算力蒸馏风暴与开源软件许可争议。四维架构解构其跨节点 MoE 动态路由策略。',
      citationsCount: 18,
      readingsCount: 10,
      updatedAt: '09-06',
      tagCategory: 'Kimi / 月之暗面 (42) · AI 编码 (572) · 开源生态',
    },
    {
      id: 'topic-frontier-bench',
      dim: 'compare',
      sub: 'reasoning',
      coverBadge: '⚖ 前沿横向实测对比',
      subBadge: '基准全景',
      title: '自研芯片与万卡集群互联演进：后英伟达时代的算力博弈与 Jalapeño 架构实测',
      summary:
        '对比 OpenAI 自研芯片与 NVIDIA Blackwell NVL72 在高并发投机解码场景下的能效比。深入拆解超低延迟以太网互联标准（UEC）与私有 NVLink 协议的生态替代空间。',
      citationsCount: 24,
      readingsCount: 12,
      updatedAt: '09-08',
      tagCategory: '硬件与互联 (38) · 算力基建 · 架构横评',
    },
    {
      id: 'topic-claude-3-7',
      dim: 'company_model',
      sub: 'reasoning',
      coverBadge: '🏢 Anthropic',
      subBadge: '混合推理',
      title: 'Anthropic 发布 Claude 3.7 Sonnet 混合推理模型与交互式思考模式',
      summary:
        '引入首创的混合推理架构，开发者与普通用户可按需动态调节思考预算，同时发布 Claude Code 命令行智能体工具，大幅提升自动化系统流水线代码调试效率。',
      citationsCount: 32,
      readingsCount: 15,
      updatedAt: '09-08',
      tagCategory: '推理机制 (42) · SWE-bench · 智能体工具',
    },
    {
      id: 'topic-asic-broadcom',
      dim: 'tech_direction',
      sub: 'chips',
      coverBadge: '⚡ ASIC 硬件定制',
      subBadge: '10nm 投片',
      title: 'OpenAI 与博通敲定 10nm 定制张量芯片投片排期：算力成本重构与去 CUDA 化',
      summary:
        '代号 Prometheus 的专用张量芯片完成流片验证，锁定台积电先进封装中介层产能，旨在从根本上平抑昂贵的第三方 GPU 溢价与云端服务边际成本。',
      citationsCount: 20,
      readingsCount: 8,
      updatedAt: '09-07',
      tagCategory: '半导体供应链 · 台积电 CoWoS · 架构对决',
    },
    {
      id: 'topic-clean-energy-ppa',
      dim: 'event',
      sub: 'chips',
      coverBadge: '🔋 宏观与电网',
      subBadge: '14.8 GW 锁定',
      title: '智算中心能源竞赛：Anthropic 签署大额多方 PPA 锁定区域清洁电力长协',
      summary:
        '算力上限的物理实质是电网与散热。梳理得州 ERCOT 与内华达州超算产业园区能源承销合同，研判数据中心微电网对公用电网电价与资本周期的长期传导机制。',
      citationsCount: 16,
      readingsCount: 7,
      updatedAt: '09-06',
      tagCategory: '宏观能源 · 电网基建 · PPA长协',
    },
    {
      id: 'topic-speculative-decoding',
      dim: 'tech_direction',
      sub: 'reasoning',
      coverBadge: '🚀 算法与推理',
      subBadge: '吞吐 3.2x',
      title: 'Recursive Speculative Decoding: 在消费级单卡打破 70B 模型自回归带宽瓶颈',
      summary:
        '分层草稿验证树与投机多分支动态对齐算法实测。无需昂贵的双路服务器，在单张 RTX 4090 达到接近数据中心级的推理交互响应速度。',
      citationsCount: 14,
      readingsCount: 6,
      updatedAt: '09-05',
      tagCategory: '轻量化部署 · 开源工程 · 推理加速',
    },
  ];

  // 过滤
  const filteredTopics = useMemo(() => {
    return topicsData
      .filter((item) => {
        if (activeDimension !== 'all' && item.dim !== activeDimension) return false;
        if (activeSubFocus !== 'all' && item.sub !== activeSubFocus) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'citations') return b.citationsCount - a.citationsCount;
        return 0; // 默认最新
      });
  }, [activeDimension, activeSubFocus, sortBy]);

  return (
    <article className="w-full max-w-5xl mx-auto space-y-5 pb-16 select-none">
      {/* 顶部一级维度 Smooth Tabs */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center p-1 rounded-full bg-[#f4efe6] border border-hairline overflow-x-auto">
            {[
              { id: 'all', label: '全部主题', count: '38' },
              { id: 'company_model', label: '公司与模型', count: '10' },
              { id: 'tech_direction', label: '技术方向', count: '8' },
              { id: 'event', label: '宏观事件', count: '12' },
              { id: 'compare', label: '前沿对比', count: '8' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveDimension(tab.id);
                  setActiveSubFocus('all');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeDimension === tab.id
                    ? 'bg-white text-ink font-semibold shadow-2xs'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${activeDimension === tab.id ? 'bg-amber-100 text-primary font-bold' : 'bg-surface text-muted'}`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-surface border border-hairline rounded-lg px-2.5 py-1 text-xs text-ink outline-none focus:border-primary cursor-pointer"
            >
              <option value="date">按更新时间排序</option>
              <option value="citations">按引用文献数量</option>
            </select>
            <button
              onClick={() => notify('已完成主题解读前沿交叉核验')}
              className="w-7 h-7 rounded-lg bg-surface hover:bg-[#f3efe6] border border-hairline flex items-center justify-center text-muted hover:text-ink transition-transform active:scale-95"
              title="同步最新事实核查"
            >
              <span className="material-symbols-outlined text-[16px]">sync</span>
            </button>
          </div>
        </div>

        {/* 二级焦点子胶囊分类 */}
        <div className="p-3 rounded-xl bg-[#f8f4ed] border border-hairline space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-hairline/70">
            <div className="text-xs text-ink font-semibold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">
                filter_list
              </span>
              <span>前沿对比 · 基准横评与架构实测</span>
            </div>
            <span className="font-mono text-[11px] text-muted bg-white/70 px-2 py-0.5 rounded border border-hairline/60">
              共收录 {filteredTopics.length} 项深度专题
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {[
              { id: 'all', label: '全部焦点 (38)' },
              { id: 'reasoning', label: '高阶推理与逻辑 (12)' },
              { id: 'chips', label: 'ASIC 硬件与互联 (8)' },
              { id: 'opensource', label: '开源生态与标准 (11)' },
              { id: 'safety', label: '安全对齐白皮书 (7)' },
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() => setActiveSubFocus(sub.id)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                  activeSubFocus === sub.id
                    ? 'bg-white text-primary font-bold shadow-2xs border border-primary/40'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 主题卡片网格 (Topics Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTopics.map((topic) => {
          const isBookmarked = entries[topic.id]?.bookmarked;

          return (
            <article
              key={topic.id}
              onClick={() => openDrawer(topic.id)}
              className="group bg-surface rounded-xl border border-hairline hover:border-primary/50 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
            >
              <div className="p-5 space-y-3">
                {/* 顶栏徽标 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-[#f2ebe0] text-ink text-[11px] font-medium border border-hairline">
                      {topic.coverBadge}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-primary text-[11px] font-semibold border border-amber-200">
                      {topic.subBadge}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark({ id: topic.id, title: topic.title });
                    }}
                    className={`p-1 rounded-full hover:bg-[#f2ebe0] transition-colors ${
                      isBookmarked ? 'text-primary' : 'text-muted hover:text-ink'
                    }`}
                    title={isBookmarked ? '取消存入' : '存入研读'}
                  >
                    <span
                      className="material-symbols-outlined text-[17px]"
                      style={{ fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      bookmark
                    </span>
                  </button>
                </div>

                {/* 分类路径与主标题 */}
                <div className="space-y-1.5">
                  <div className="text-[11px] text-muted font-mono truncate">
                    {topic.tagCategory}
                  </div>
                  <h2 className="font-serif text-[18px] font-bold text-ink group-hover:text-primary transition-colors leading-snug">
                    {topic.title}
                  </h2>
                  <p className="text-xs text-[#57534e] leading-relaxed line-clamp-3">
                    {topic.summary}
                  </p>
                </div>
              </div>

              {/* 卡片底栏微信息 */}
              <div className="px-5 py-3 bg-[#faf7f2] border-t border-hairline flex items-center justify-between text-xs text-muted">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-muted">
                      bookmark
                    </span>
                    <span>{topic.citationsCount} 篇引用</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-muted">
                      menu_book
                    </span>
                    <span>{topic.readingsCount} 延伸阅读</span>
                  </span>
                  <span>·</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(
                        `[${topic.title}] · 核心专题：${topic.summary}`,
                      );
                      notify('已复制主题研读依据');
                    }}
                    className="flex items-center gap-1 text-muted hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[13px]">content_copy</span>
                    <span className="text-[11px]">复制引用</span>
                  </button>
                </div>
                <span className="font-mono text-[11px] text-muted">更新于 {topic.updatedAt}</span>
              </div>
            </article>
          );
        })}
      </div>
    </article>
  );
}
