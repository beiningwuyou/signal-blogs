import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../state.jsx';
import extendedStreams from '../data/extended-streams.json';
import { getLiveEvents, displayTime, saveEventRecord } from '../live/api.js';


// 课题匹配辅助函数：计算资讯对应的第二大脑长期研究课题
function getThesisMatch(item) {
  if (item.thesis) return item.thesis;
  const text = `${item.title || ''} ${item.badge || ''} ${item.summary || ''} ${item.category || ''}`;
  if (text.includes('能源') || text.includes('供电') || text.includes('PPA') || text.includes('电力') || text.includes('储能')) {
    return '智算清洁供电长协';
  }
  if (text.includes('CoWoS') || text.includes('台积电') || text.includes('封装') || text.includes('晶圆') || text.includes('良率')) {
    return '先进封装CoWoS良率';
  }
  if (text.includes('投机解码') || text.includes('4090') || text.includes('端侧') || text.includes('边缘') || text.includes('推理')) {
    return '端侧推理与投机解码';
  }
  if (text.includes('铜缆') || text.includes('NVL72') || text.includes('互联') || text.includes('以太网') || text.includes('RoCE') || text.includes('背板')) {
    return '智算互联与铜缆公差';
  }
  return '前沿架构工程演进';
}

export function PersonalDailyPage() {
  const [, setParams] = useSearchParams();
  const { toggleBookmark, entries, notify, currentRole } = useWorkspace();
  const [extendedExpanded, setExtendedExpanded] = useState(false);

  // SQLite 实时事件数据
  const [liveEvents, setLiveEvents] = useState([]);
  const [loadingLive, setLoadingLive] = useState(true);

  const loadEvents = useCallback(() => {
    setLoadingLive(true);
    getLiveEvents({ limit: 20 })
      .then((data) => {
        const evts = Array.isArray(data) ? data : (data?.events ?? []);
        setLiveEvents(evts);
      })
      .catch((err) => {
        console.warn('PersonalDailyPage 加载实时事件失败，降级为静态数据:', err);
        setLiveEvents([]);
      })
      .finally(() => setLoadingLive(false));
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const openDrawer = (articleId) => {
    setParams({ article: articleId });
  };

  // 角色数据（带降级保护）
  const role = currentRole || {};
  const topNews = role.topNews || [];
  const track1 = role.track1 || {
    title: '基础设施工程化提速与长效能源锁定',
    summary:
      'Anthropic 锁定 14.8 GW 清洁供电长协；GB200 NVL72 铜缆背板公差实测通过工业验证，供电及散热制约正逐步解耦。',
    tags: ['#核电PPA', '#铜缆背板公差', '#GB200 NVL72'],
  };
  const track2 = role.track2 || {
    title: '开源推理与边缘部署架构关键跃迁',
    summary:
      '单卡 RTX 4090 运行 70B 模型投机解码突破 3.2x 吞吐；台积电 CoWoS-L 键合良率跃升至 92%，先进封装瓶颈逐步释出。',
    tags: ['#4090单卡', '#投机解码', '#CoWoS-L良率92%'],
  };

  // 「今日要闻」：SQLite 真实事件优先，不足时回退至 roles.js 静态数据
  const liveTopNews = liveEvents.slice(0, 5).map((evt) => ({
    id: evt.id,
    isLive: true,
    badge: evt.category || '实时情报',
    source: evt.sources?.[0] || (evt.materials?.[0]?.source) || '多信源聚合',
    meta: displayTime(evt.updatedAt || evt.discoveredAt),
    title: evt.title,
    summary: evt.summary
      ? evt.summary.slice(0, 120) + (evt.summary.length > 120 ? '…' : '')
      : null,
    quote: null,
    actionText: '研读全文',
    materialCount: evt.articleCount ?? evt.materials?.length ?? 0,
  }));

  // 合并：live 有数据就用 live，否则用角色静态数据
  const todayTopNews = liveTopNews.length > 0 ? liveTopNews : topNews;

  // 「延伸情报流」：SQLite 剩余事件（第 6~20 条）+ 静态 extendedStreams
  const liveExtended = liveEvents.slice(5).map((evt, i) => ({
    id: evt.id,
    isLive: true,
    cat: evt.category || '实时情报',
    time: displayTime(evt.updatedAt || evt.discoveredAt),
    tag: evt.evidenceLevel === 'verified' ? '已核验' : '待核验',
    title: evt.title,
    source: evt.sources?.[0] || (evt.materials?.[0]?.source) || '多信源',
  }));

  // live 有数据时置前，静态数据追加；无 live 时全用静态
  const mergedExtended = liveExtended.length > 0
    ? [...liveExtended, ...extendedStreams]
    : extendedStreams;


  const now = new Date();
  const dateStr = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(now);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now - startOfYear) / (24 * 3600 * 1000)) + 1;
  const issueNo = `NO. ${String(dayOfYear).padStart(3, '0')} · 晨报`;

  return (
    <article className="space-y-8 w-full max-w-5xl mx-auto pb-16 select-none relative">
      {/* 动态环境暖光光晕 (MotionSites Ambient Aura) */}
      <div className="absolute -top-12 -left-12 w-96 h-96 bg-gradient-to-br from-amber-400/10 via-orange-300/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10 motion-glow-ambient" />
      <div className="absolute top-48 -right-12 w-80 h-80 bg-gradient-to-bl from-teal-400/10 via-amber-200/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10 motion-pulse-glow" />

      {/* 1. 报头区域：现代出版级排印 (Newsreader Serif + 柔光徽章) */}
      <header className="border-b border-hairline/80 pb-5 space-y-3 relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[12px] font-mono uppercase tracking-wider">
              <span className="px-2.5 py-1 rounded-md bg-surface/90 border border-hairline text-ink font-semibold shadow-2xs backdrop-blur-sm">
                {issueNo}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted font-mono lowercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>实时智库研报生成</span>
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-serif text-ink tracking-tight font-bold pt-1 leading-none">
              {dateStr}
            </h1>
          </div>

          <div className="flex items-center shrink-0">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface/80 border border-hairline/90 text-body text-xs shadow-2xs backdrop-blur-md">
              <span
                className="w-2.5 h-2.5 rounded-full bg-primary motion-pulse-glow"
              />
              <span>
                专为{' '}
                <strong className="text-ink font-semibold">
                  {currentRole?.name || '首席分析师'}
                </strong>{' '}
                定制
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. 智库早间导读：微拟物与悬浮卡片 */}
      <section className="rounded-2xl border border-hairline bg-surface/70 backdrop-blur-md shadow-xs p-5 space-y-4 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-hairline/60">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary motion-pulse-glow" />
            <span className="text-ink font-bold text-sm tracking-tight font-serif">智库早间导读</span>
            <span className="text-hairline">·</span>
            <span className="text-muted text-xs">
              {currentRole?.briefingTopic || 'AI 算力基建 & 认知重构'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-primary text-[10.5px] font-semibold tracking-wide border border-amber-500/20">
              对齐第二大脑 2 项在研课题
            </span>
          </div>
          <div className="text-[11px] text-muted font-mono flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            <span>{currentRole?.briefingDuration || '预计通读用时 8 分钟'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 主线一 */}
          <div className="p-5 rounded-2xl bg-surface/90 border border-hairline hover:border-amber-400/80 transition-all space-y-3.5 flex flex-col justify-between motion-card-lift shadow-2xs group">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-[11px] font-mono font-bold text-primary uppercase tracking-wider">
                    主线一
                  </span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-muted group-hover:text-primary transition-colors">
                  trending_up
                </span>
              </div>
              <h3 className="text-[15px] font-serif font-bold text-ink group-hover:text-primary transition-colors leading-snug">
                {track1.title}
              </h3>
              <p className="text-muted text-xs leading-relaxed pl-3.5 py-0.5 my-1.5 border-l-2 border-primary/60">
                {track1.summary}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-hairline/60 text-[10.5px] font-mono text-muted">
              {track1.tags.map((t) => (
                <span key={t} className="px-2.5 py-1 rounded-md bg-[#f4efe6] text-stone-700 border border-hairline/40">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* 主线二 */}
          <div className="p-5 rounded-2xl bg-surface/90 border border-hairline hover:border-teal-400/80 transition-all space-y-3.5 flex flex-col justify-between motion-card-lift shadow-2xs group">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-600" />
                  <span className="text-[11px] font-mono font-bold text-teal-700 uppercase tracking-wider">
                    主线二
                  </span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-muted group-hover:text-teal-600 transition-colors">
                  bolt
                </span>
              </div>
              <h3 className="text-[15px] font-serif font-bold text-ink group-hover:text-teal-700 transition-colors leading-snug">
                {track2.title}
              </h3>
              <p className="text-muted text-xs leading-relaxed pl-3.5 py-0.5 my-1.5 border-l-2 border-teal-600/60">
                {track2.summary}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-hairline/60 text-[10.5px] font-mono text-muted">
              {track2.tags.map((t) => (
                <span key={t} className="px-2.5 py-1 rounded-md bg-[#f4efe6] text-stone-700 border border-hairline/40">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. 今日要闻 */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between border-b border-hairline pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <h2 className="text-base font-bold text-ink tracking-tight font-serif">今日要闻</h2>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-primary text-[10.5px] font-semibold font-mono">
              {loadingLive ? '加载中…' : `${todayTopNews.length} 篇深度头条`}
            </span>
            {!loadingLive && liveTopNews.length > 0 && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-mono border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                实时聚合
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted font-mono">
            {loadingLive ? '' : '预计阅读 7 分钟'}
          </span>
        </div>

        <div className="space-y-4">
          {/* 骨架屏 */}
          {loadingLive && (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-surface/85 rounded-2xl border border-hairline p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-4 bg-[#e8e0d4] rounded w-20"></div>
                    <div className="h-4 bg-[#e8e0d4] rounded w-16"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-[#e8e0d4] rounded w-full"></div>
                    <div className="h-4 bg-[#e8e0d4] rounded w-11/12"></div>
                  </div>
                  <div className="h-3 bg-[#e8e0d4] rounded w-3/4"></div>
                </div>
              ))}
            </div>
          )}

          {/* 真实内容 */}
          {!loadingLive && todayTopNews.map((news) => {
            const thesisTag = getThesisMatch(news);
            return (
              <article
                key={news.id}
                onClick={() => openDrawer(news.id)}
                className="bg-surface/85 backdrop-blur-sm rounded-2xl border border-hairline hover:border-amber-400/70 transition-all p-5 space-y-3.5 motion-card-lift shadow-2xs group cursor-pointer"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-primary font-bold text-[11px] border border-amber-500/20">
                      {news.badge}
                    </span>
                    {/* 第二大脑 Thesis 记忆归因胶囊 */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fdf8f0] text-amber-900 text-[10.5px] font-mono font-medium border border-amber-400/50 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary motion-pulse-glow" />
                      <span className="text-amber-800 font-semibold">📌 命中课题:</span>
                      <span>#{thesisTag}</span>
                    </span>
                    <span className="text-muted text-[11.5px] font-medium">{news.source}</span>
                    {news.isLive && (
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9.5px] font-mono border border-emerald-200 flex items-center gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                        实时
                      </span>
                    )}
                    {news.isLive && news.materialCount > 0 && (
                      <span className="text-[9.5px] font-mono text-muted">
                        {news.materialCount} 篇来源
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[11px] text-muted flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>{news.meta}</span>
                  </div>
                </div>

              <div>
                <h3 className="text-[17px] md:text-[19px] font-serif font-bold text-ink leading-snug group-hover:text-primary transition-colors">
                  {news.title}
                </h3>
                {news.summary && (
                  <p className="text-body text-xs leading-relaxed pt-2 text-[#57534e]">
                    {news.summary}
                  </p>
                )}
                {news.quote && (
                  <div className="mt-3.5 py-3 px-4 bg-[#fbf9f5] rounded-xl border-l-3 border-primary text-body text-xs italic leading-relaxed text-stone-700 shadow-2xs">
                    "{news.quote}"
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3.5 border-t border-hairline/60 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (news.isLive) {
                        // evt-* 事件走 SQLite saveEventRecord
                        const current = entries[news.id]?.bookmarked;
                        try {
                          await saveEventRecord(news.id, { bookmarked: !current });
                          notify(!current ? '已加入「我的阅读」稍后精读库' : '已从稍后精读移除');
                        } catch {
                          notify('收藏操作失败，请重试');
                        }
                      } else {
                        toggleBookmark(news.id);
                      }
                    }}
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${
                      entries[news.id]?.bookmarked
                        ? 'bg-amber-50 border-amber-300 text-primary'
                        : 'border-hairline/80 hover:border-hairline-strong bg-surface text-muted hover:text-ink'
                    }`}
                    title={entries[news.id]?.bookmarked ? '取消收藏' : '存入我的收藏'}
                  >
                    <span
                      className="material-symbols-outlined text-[17px] block"
                      style={{
                        fontVariationSettings: entries[news.id]?.bookmarked ? "'FILL' 1" : "'FILL' 0",
                      }}
                    >
                      {entries[news.id]?.bookmarked ? 'bookmark' : 'bookmark_border'}
                    </span>
                  </button>
                  <span className="text-muted text-[11px]">
                    {entries[news.id]?.bookmarked ? '已存入' : '收藏'}
                  </span>
                </div>

                <div className="text-primary flex items-center gap-1 font-semibold text-xs group-hover:translate-x-0.5 transition-transform">
                  <span>{news.actionText || '研读全文'}</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </div>
              </div>
            </article>
          ); })}

          {/* 无数据空状态（加载完毕且 todayTopNews 为空） */}
          {!loadingLive && todayTopNews.length === 0 && (
            <div className="py-10 text-center text-muted text-sm space-y-2">
              <span className="material-symbols-outlined text-[32px] text-hairline block">newspaper</span>
              <p>暂无今日要闻。请先在「系统设置」中添加信源并触发同步抓取。</p>
            </div>
          )}
        </div>
      </section>

      {/* 4. 精选研读 */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between border-b border-hairline pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-teal" />
            <h2 className="text-base font-bold text-ink tracking-tight font-serif">精选研读</h2>
            <span className="px-1.5 py-0.5 rounded bg-surface text-body-strong text-[10.5px] font-mono border border-hairline">
              方法论
            </span>
          </div>
          <span className="text-[11px] text-muted font-mono">预计 14 分钟</span>
        </div>

        <div className="space-y-4">
          <div className="bg-surface/85 backdrop-blur-sm rounded-2xl border border-hairline p-5 space-y-3 hover:border-hairline-strong motion-card-lift shadow-2xs">
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="font-mono">arXiv · 推理架构工程</span>
              <span className="font-mono text-primary font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span>GitHub ★ 1.4k (+320 今日新标星)</span>
              </span>
            </div>
            <div>
              <h3
                onClick={() => openDrawer('demo-deepseek-r1')}
                className="text-base md:text-[17px] font-serif font-bold text-ink leading-snug hover:text-primary transition-colors cursor-pointer"
              >
                Recursive Speculative Decoding: 在单卡 RTX 4090 实现 70B 模型 3.2x 推理吞吐
              </h3>
              <p className="text-body text-xs leading-relaxed pt-2 text-[#57534e]">
                构建轻量级递归草稿头（Recursive Draft Head），避免草稿模型显存常驻，仅需约 300MB
                额外显存，便可在长文本代码补全实现 48 tokens/s 吞吐。
              </p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-hairline/60 text-xs">
              <button
                type="button"
                onClick={() => notify('已将推理配置环境发送至本地终端')}
                className="inline-flex items-center gap-1.5 text-primary hover:text-primary-hover font-semibold transition-colors px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20"
              >
                <span className="material-symbols-outlined text-[15px]">terminal</span>
                <span>一键导入本地环境</span>
              </button>
              <span className="text-muted flex items-center gap-1 text-[11px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>已同步至「技术调研」库</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface/85 backdrop-blur-sm rounded-2xl border border-hairline p-5 space-y-3.5 flex flex-col justify-between hover:border-hairline-strong motion-card-lift shadow-2xs group">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted">
                  <span className="font-semibold text-ink">Tooling 拆解 · Anthropic Log</span>
                  <span className="font-mono">读 4 分钟</span>
                </div>
                <h4
                  onClick={() => openDrawer('demo-claude-thinking')}
                  className="text-sm font-serif font-bold text-ink leading-snug hover:text-primary cursor-pointer transition-colors"
                >
                  Claude Code AST 语法树剪枝与多文件依赖上下文调度机制
                </h4>
                <p className="text-body text-xs leading-relaxed text-[#57534e]">
                  本地 CLI 代理利用 AST 差异传输修改 patch，减少 74% 冗余 token。
                </p>
              </div>
              <div className="pt-3 border-t border-hairline/60 flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={() => openDrawer('demo-claude-thinking')}
                  className="text-ink hover:text-primary font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  <span>阅读摘录</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>

            <div className="bg-surface/85 backdrop-blur-sm rounded-2xl border border-hairline p-5 space-y-3.5 flex flex-col justify-between hover:border-hairline-strong motion-card-lift shadow-2xs group">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted">
                  <span className="font-semibold text-ink">底层物理仿真 · IEEE Micro 刊载</span>
                  <span className="font-mono">读 5 分钟</span>
                </div>
                <h4
                  onClick={() => openDrawer('demo-hbm')}
                  className="text-sm font-serif font-bold text-ink leading-snug hover:text-primary cursor-pointer transition-colors"
                >
                  HBM3e 3D 堆叠垂直热阻与热膨胀失配 (CTE) 测量新基准
                </h4>
                <p className="text-body text-xs leading-relaxed text-[#57534e]">
                  嵌入微型光纤光栅传感器，测得 12-Hi 堆叠瞬态热阻仅 0.28 K/W。
                </p>
              </div>
              <div className="pt-3 border-t border-hairline/60 flex justify-between items-center text-xs">
                <span className="font-mono text-[10.5px] text-muted flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>实测图表已加载</span>
                </span>
                <button
                  type="button"
                  onClick={() => openDrawer('demo-hbm')}
                  className="text-ink hover:text-primary font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  <span>查看数据表</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 延伸情报流 */}
      <section className="space-y-3.5">
        <div className="flex items-baseline justify-between border-b border-hairline/80 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-muted" />
            <h2 className="text-base font-bold text-ink tracking-tight font-serif">延伸情报流</h2>
            <span className="px-2 py-0.5 rounded-md bg-surface text-muted text-[10.5px] font-mono border border-hairline/60">
              {mergedExtended.length} 条
            </span>
            {liveExtended.length > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-mono border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                含实时
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted font-mono">已过滤低信噪比信源</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {(extendedExpanded ? mergedExtended : mergedExtended.slice(0, 6)).map((item, i) => (
            <div
              key={item.id || i}
              className="bg-surface/85 backdrop-blur-sm rounded-xl border border-hairline p-4 hover:bg-[#fbf9f5] hover:border-amber-400/60 transition-all space-y-2.5 shadow-2xs cursor-pointer motion-card-lift"
              onClick={() => openDrawer(item.id)}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-[#f4efe6] text-body-strong font-medium text-[11px] border border-hairline/60">
                    {item.cat}
                  </span>
                  <span className="font-mono text-muted text-[11px]">{item.time}</span>
                </div>
                {item.isLive ? (
                  <span className="text-[9.5px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 flex items-center gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                    实时
                  </span>
                ) : (
                  <span className="text-[10.5px] font-mono text-primary font-bold">{item.tag}</span>
                )}
              </div>
              <p className="text-ink text-xs font-semibold leading-snug line-clamp-2">{item.title}</p>
              <div className="flex items-center justify-between text-[11px] text-muted pt-2.5 border-t border-hairline/60">
                <span className="text-stone-600">{item.source}</span>
                {!item.isLive && (
                  <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 font-semibold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">verified</span>
                    <span>已核验</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {mergedExtended.length > 6 && (
          <div className="flex items-center justify-center pt-3">
            <button
              type="button"
              onClick={() => setExtendedExpanded(!extendedExpanded)}
              className="text-xs text-muted hover:text-ink font-semibold flex items-center gap-1 px-4 py-2 rounded-xl border border-hairline bg-surface/90 hover:bg-surface transition-all shadow-2xs cursor-pointer"
            >
              <span>
                {extendedExpanded
                  ? '收起延伸速报'
                  : `展开其余 ${mergedExtended.length - 6} 条延伸速报 (共 ${mergedExtended.length} 篇)`}
              </span>
              <span className="material-symbols-outlined text-[16px]">
                {extendedExpanded ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          </div>
        )}
      </section>
    </article>
  );
}
