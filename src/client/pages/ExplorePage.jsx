import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../state.jsx';
import { articles, exploreArticles } from '../data/catalog.js';

export function ExplorePage() {
  const [, setParams] = useSearchParams();
  const { entries, toggleBookmark, notify } = useWorkspace();

  const [activeMediaTab, setActiveMediaTab] = useState('all');
  const [timeScope, setTimeScope] = useState('today');
  const [sortOrder, setSortOrder] = useState('latest');
  const [filterKeyword, setFilterKeyword] = useState('');

  const openDrawer = (articleId) => {
    setParams({ article: articleId });
  };

  // 广场多维情报聚合数据：基于统一 catalog.js 的 exploreArticles，消除硬编码重复
  const exploreFeed = useMemo(() => {
    const rawItems = exploreArticles.map((art) => {
      const isPodcast = art.category?.includes('音频') || art.category?.includes('播客');
      const isBrief = art.category?.includes('快讯') || art.category?.includes('电报');
      const isReport = art.category?.includes('研报');
      const type = isPodcast ? 'podcast' : isBrief ? 'brief' : isReport ? 'report' : 'article';
      const typeIcon = isPodcast ? 'podcasts' : isBrief ? 'feed' : isReport ? 'analytics' : 'article';

      return {
        id: art.id,
        type,
        typeLabel: art.category,
        typeIcon,
        location: art.id === 'exp-spinoff-report' ? '新西兰·惠灵顿' : null,
        factGrade: art.id === 'exp-spinoff-report' ? '事实核查 A+' : art.id === 'exp-semianalysis-b200' ? '产业特研 S+' : null,
        source: art.source,
        time: art.time,
        readTime: art.readTime || (isPodcast ? '深度音频' : isBrief ? '1分钟速览' : '精选研读'),
        title: art.title,
        summary: art.body ? art.body.slice(0, 160) + '...' : art.summary || '',
        tags: art.tags || ['深度分析', '前沿观察'],
        weight: art.id === 'exp-semianalysis-b200' ? 98 : art.id === 'exp-vllm-spec' ? 95 : 88,
        badge: isReport ? '重点研报' : isBrief ? '突发要闻' : isPodcast ? '精选播客' : '深度报道',
      };
    });

    // 与 catalog 其他前沿精选融合
    const catItems = articles.slice(0, 10).map((a) => {
      const isReport = a.category?.includes('研报') || a.kind === 'report';
      const isPodcast = a.category?.includes('播客') || a.category?.includes('音频');
      const isBrief = a.category?.includes('快讯') || a.category?.includes('电报');
      const type = isPodcast ? 'podcast' : isBrief ? 'brief' : isReport ? 'report' : 'article';
      const typeIcon = isPodcast ? 'podcasts' : isBrief ? 'feed' : isReport ? 'analytics' : 'article';

      return {
        id: a.id,
        type,
        typeLabel: a.category || (a.kind === 'daily' ? '每日早报' : '智库研读'),
        typeIcon,
        source: a.source || a.author || 'Signal Desk 智库',
        time: a.time || '精选流',
        readTime: `${a.readingTime || 6} 分钟`,
        title: a.title,
        summary: a.summary || (a.body || '').slice(0, 140) + '...',
        tags: Array.isArray(a.takeaways) && a.takeaways.length ? ['核心指标', '智库研判'] : [a.kind || '精选', '广场推荐'],
        weight: 82,
        badge: isReport ? '智库专报' : isBrief ? '实时快讯' : isPodcast ? '播客音频' : '前沿观点',
      };
    });

    const map = new Map();
    [...rawItems, ...catItems].forEach((it) => {
      if (!map.has(it.id)) map.set(it.id, it);
    });
    return Array.from(map.values());
  }, []);

  // 过滤与排序
  const filteredFeed = useMemo(() => {
    return exploreFeed
      .filter((item) => {
        if (activeMediaTab !== 'all' && item.type !== activeMediaTab) return false;
        if (filterKeyword.trim()) {
          const q = filterKeyword.toLowerCase();
          const match =
            item.title.toLowerCase().includes(q) ||
            item.summary.toLowerCase().includes(q) ||
            item.source.toLowerCase().includes(q) ||
            item.tags.some((t) => t.toLowerCase().includes(q));
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'weight') return b.weight - a.weight;
        return 0; // 默认最新
      });
  }, [exploreFeed, activeMediaTab, filterKeyword, sortOrder]);

  return (
    <article className="w-full max-w-5xl mx-auto space-y-6 pb-20 select-none">
      {/* 极简清爽吸顶工具栏 (Single Row Clean Toolbar) */}
      <section className="sticky top-14 z-30 py-3.5 px-4 bg-[#fcf9f6]/95 backdrop-blur-md rounded-2xl border border-hairline shadow-2xs transition-all">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* 左侧：3~4 个核心主形态切换药丸 */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'all', label: '全部', icon: 'apps' },
              { id: 'report', label: '研报', icon: 'analytics' },
              { id: 'brief', label: '快讯', icon: 'bolt' },
              { id: 'podcast', label: '播客', icon: 'podcasts' },
              { id: 'article', label: '深度', icon: 'article' },
            ].map((cat) => {
              const active = activeMediaTab === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveMediaTab(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    active
                      ? 'bg-ink text-canvas shadow-xs'
                      : 'bg-surface hover:bg-stone-100 text-muted hover:text-ink border border-hairline'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px] opacity-85">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* 右侧：紧凑搜索框与排序切换 */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex-1 sm:w-56">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[15px] text-muted pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={filterKeyword}
                onChange={(e) => setFilterKeyword(e.target.value)}
                placeholder="搜索广场情报..."
                className="w-full pl-8 pr-7 py-2 bg-surface border border-hairline hover:border-hairline-strong rounded-xl text-xs text-ink placeholder:text-muted focus:outline-none focus:border-primary transition-colors shadow-2xs"
              />
              {filterKeyword && (
                <button
                  type="button"
                  onClick={() => setFilterKeyword('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>

            {/* 极简排序按钮 */}
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'latest' ? 'weight' : 'latest')}
              className="px-2.5 py-1.5 rounded-lg border border-hairline bg-surface hover:bg-stone-100 text-xs text-muted hover:text-ink font-medium transition-all shadow-2xs flex items-center gap-1 cursor-pointer shrink-0"
              title={sortOrder === 'latest' ? '当前：按最新时间（点击切按权重）' : '当前：按重要权重（点击切按最新）'}
            >
              <span className="material-symbols-outlined text-[14px] text-primary">
                {sortOrder === 'latest' ? 'schedule' : 'trending_up'}
              </span>
              <span>{sortOrder === 'latest' ? '最新' : '权重'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 双列 / 三列响应式网格画册瀑布流 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
        {filteredFeed.map((item) => {
          const isBookmarked = entries[item.id]?.bookmarked;
          const isReport = item.type === 'report';
          const isBrief = item.type === 'brief';
          const isPodcast = item.type === 'podcast';

          return (
            <article
              key={item.id}
              onClick={() => openDrawer(item.id)}
              className={`group rounded-2xl transition-all duration-200 cursor-pointer relative flex flex-col overflow-hidden bg-surface-card motion-card-lift ${
                isReport
                  ? 'border-2 border-amber-500/30 hover:border-amber-500/80 shadow-xs'
                  : isBrief
                  ? 'border border-orange-200/90 hover:border-orange-400/80 bg-gradient-to-b from-[#fffefc] to-[#fffaf2]'
                  : isPodcast
                  ? 'border border-hairline hover:border-amber-400/60'
                  : 'border border-hairline hover:border-[#d4cdc0] shadow-2xs'
              }`}
            >
              {/* 1. 行业研报特异化：深邃头部封板视窗 */}
              {isReport && (
                <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white px-5 py-3.5 border-b border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[15px]">analytics</span>
                    </span>
                    <span className="font-mono text-[10px] tracking-wider uppercase font-bold text-amber-400">
                      RESEARCH REPORT
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-semibold">
                    评级 S+
                  </span>
                </div>
              )}

              {/* 2. 要闻快讯特异化：醒目高对比亮色提示带 */}
              {isBrief && (
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-1.5 flex items-center justify-between text-[10px] font-mono font-bold tracking-wide">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] animate-pulse">bolt</span>
                    <span>BREAKING FLASH · 盘前要闻</span>
                  </span>
                  <span className="bg-white/20 px-2 py-0.5 rounded text-[9px] uppercase font-semibold">电报级直发</span>
                </div>
              )}

              {/* 3. 播客音频特异化：音频动态声波条 (MotionSites Dynamic Waves) */}
              {isPodcast && (
                <div className="bg-gradient-to-r from-[#f7f2ea] to-[#efe5d5] px-4 py-2.5 border-b border-hairline flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 text-stone-700">
                    <span className="w-6 h-6 rounded-full bg-stone-800 text-amber-300 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[13px]">play_arrow</span>
                    </span>
                    <span className="font-serif font-bold">深度漫谈与音频解读</span>
                  </div>
                  <div className="flex items-end gap-1 h-4">
                    <span className="w-1 bg-amber-600 rounded-full wave-bar-1" />
                    <span className="w-1 bg-stone-800 rounded-full wave-bar-2" />
                    <span className="w-1 bg-amber-500 rounded-full wave-bar-3" />
                    <span className="text-[10px] font-mono text-muted ml-1.5">高保真原声</span>
                  </div>
                </div>
              )}

              {/* 卡片主体：增加留白内边距，文字与边框彻底分离 */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3.5">
                {/* 顶栏元信息：类型徽章、来源、发布时间 */}
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    {/* 分类徽章 */}
                    <span
                      className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded text-[11px] ${
                        isReport
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : isBrief
                          ? 'bg-orange-100 text-orange-900 border border-orange-200'
                          : isPodcast
                          ? 'bg-stone-200/80 text-stone-800 border border-stone-300'
                          : 'bg-[#f4efe6] text-ink border border-hairline'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">{item.typeIcon}</span>
                      <span>{item.typeLabel}</span>
                    </span>

                    {/* 信源名称 */}
                    <span className="font-medium text-ink truncate max-w-[120px]" title={item.source}>
                      {item.source}
                    </span>

                    <span className="text-muted/60">·</span>

                    {/* 发布时间 */}
                    <span className="text-muted text-[10.5px] whitespace-nowrap">{item.time}</span>
                  </div>

                  {/* 收藏按钮 */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark({ id: item.id, title: item.title });
                    }}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                      isBookmarked
                        ? 'bg-amber-50 border-amber-300 text-primary'
                        : 'border-hairline/80 hover:border-hairline-strong bg-surface text-muted hover:text-ink'
                    }`}
                    title={isBookmarked ? '取消书签' : '存入我的阅读'}
                  >
                    <span
                      className="material-symbols-outlined text-[16px] block"
                      style={{ fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      bookmark
                    </span>
                  </button>
                </div>

                {/* 核心内容区：标题与摘要 */}
                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-base text-ink group-hover:text-primary transition-colors leading-snug line-clamp-3">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#57534e] leading-relaxed line-clamp-3">
                    {item.summary}
                  </p>
                </div>

                {/* 底部区：标签、阅读时长与研读引导 */}
                <div className="pt-3 border-t border-hairline/60 flex items-center justify-between gap-2 text-[11px]">
                  {/* 标签 */}
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {item.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded bg-[#f4efe6] text-stone-600 border border-hairline/60 font-mono text-[10px] truncate max-w-[90px]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* 研读指示器 */}
                  <div className="flex items-center gap-1 text-primary font-semibold text-xs group-hover:translate-x-0.5 transition-transform shrink-0">
                    <span>{item.readTime}</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* 空结果保护提示 */}
      {!filteredFeed.length && (
        <div className="py-20 text-center space-y-3 bg-surface rounded-xl border border-hairline shadow-2xs">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">travel_explore</span>
          </div>
          <h3 className="text-base font-serif font-bold text-ink">没有匹配的广场情报</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            未检索到与「{filterKeyword}」或当前形态标签相匹配的内容，请尝试清空搜索词或切换形态选项。
          </p>
          <button
            onClick={() => {
              setActiveMediaTab('all');
              setFilterKeyword('');
            }}
            className="px-4 py-1.5 rounded-lg bg-ink text-canvas text-xs font-medium hover:bg-stone-800 transition-colors"
          >
            重置所有条件
          </button>
        </div>
      )}
    </article>
  );
}

