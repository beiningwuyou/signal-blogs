import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useWorkspace } from '../state.jsx';
import { intelligence, prototypeArticles } from '../data/catalog.js';
import extendedStreams from '../data/extended-streams.json';
import {
  getLiveEvents,
  saveEventRecord,
  startFetchJob,
  getLiveJob,
  displayTime,
} from '../live/api.js';

export function FollowingPage() {
  const [, setParams] = useSearchParams();
  const { entries, toggleBookmark, copyLink, update, notify, currentRole } = useWorkspace();
  const [streamMode, setStreamMode] = useState('curated'); // curated | live
  const [liveEvents, setLiveEvents] = useState([]);
  const [loadingLive, setLoadingLive] = useState(false);
  const [syncingLive, setSyncingLive] = useState(false);
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedThesis, setSelectedThesis] = useState('all');
  const [timeFilter, setTimeFilter] = useState('month');
  const [sortOrder, setSortOrder] = useState('latest'); // latest | weight
  const [keyword, setKeyword] = useState('');
  const [playingAudioId, setPlayingAudioId] = useState(null);

  // 动态读取第二大脑在研课题
  const activeTheses = useMemo(() => {
    if (entries.thesis_vault?.list && Array.isArray(entries.thesis_vault.list)) {
      const active = entries.thesis_vault.list.filter((t) => t.status !== 'archived');
      if (active.length > 0) return active;
    }
    return [
      { id: 'th-1', tag: '#端侧推理与投机解码' },
      { id: 'th-2', tag: '#先进封装CoWoS良率' },
      { id: 'th-3', tag: '#智算清洁供电长协' },
    ];
  }, [entries.thesis_vault]);

  // 课题匹配检测函数
  const getItemThesis = useCallback(
    (item) => {
      const text = `${item.title || ''} ${item.summary || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
      for (const th of activeTheses) {
        const cleanTag = th.tag.replace('#', '').toLowerCase();
        if (text.includes(cleanTag)) return th;
        if (
          cleanTag.includes('端侧') &&
          (text.includes('端侧') ||
            text.includes('投机') ||
            text.includes('推理') ||
            text.includes('decoding') ||
            text.includes('vllm'))
        )
          return th;
        if (
          cleanTag.includes('cowos') &&
          (text.includes('cowos') ||
            text.includes('封装') ||
            text.includes('台积电') ||
            text.includes('blackwell') ||
            text.includes('良率'))
        )
          return th;
        if (
          cleanTag.includes('供电') &&
          (text.includes('供电') ||
            text.includes('清洁') ||
            text.includes('ppa') ||
            text.includes('储能') ||
            text.includes('电网') ||
            text.includes('能源'))
        )
          return th;
        if (th.keywords && th.keywords.some((kw) => text.includes(kw.toLowerCase()))) return th;
      }
      return null;
    },
    [activeTheses],
  );

  // 用于在组件卸载时清除轮询 interval，避免内存泄漏
  const syncTimerRef = useRef(null);

  const openDrawer = (articleId) => {
    setParams({ article: articleId });
  };

  const loadLiveEvents = useCallback(async () => {
    try {
      setLoadingLive(true);
      const data = await getLiveEvents({ scope: 'all' });
      setLiveEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('加载实时事件失败:', err);
    } finally {
      setLoadingLive(false);
    }
  }, []);

  useEffect(() => {
    loadLiveEvents();
    // 组件卸载时清除任何正在运行的同步轮询
    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };
  }, [loadLiveEvents]);

  const handleSyncLive = async () => {
    if (syncingLive) return;
    try {
      setSyncingLive(true);
      notify('正在调度后台增量抓取...');
      const job = await startFetchJob({});
      syncTimerRef.current = setInterval(async () => {
        try {
          const current = await getLiveJob(job.id);
          if (current.state !== 'running') {
            clearInterval(syncTimerRef.current);
            syncTimerRef.current = null;
            setSyncingLive(false);
            await loadLiveEvents();
            if (current.state === 'completed') {
              notify(
                `🎉 抓取完成！新增 ${current.new_count || 0} 篇材料，共更新 ${current.updated_count || 0} 条事件`,
              );
            } else {
              notify(`抓取结束 (状态: ${current.state})，已刷新列表`);
            }
          }
        } catch {
          clearInterval(syncTimerRef.current);
          syncTimerRef.current = null;
          setSyncingLive(false);
        }
      }, 800);
    } catch (err) {
      setSyncingLive(false);
      notify(`启动同步失败: ${err.message}`);
    }
  };

  const handleToggleLiveBookmark = async (event) => {
    const isBookmarked = !!event.record?.bookmarked;
    const next = !isBookmarked;
    try {
      await saveEventRecord(event.id, { bookmarked: next });
      setLiveEvents((prev) =>
        prev.map((e) =>
          e.id === event.id ? { ...e, record: { ...e.record, bookmarked: next } } : e,
        ),
      );
      notify(next ? '已加入「我的阅读」稍后精读库' : '已从稍后精读移除');
    } catch (err) {
      notify(`操作失败: ${err.message}`);
    }
  };

  // 高保真对齐 signal_desk_8 的多模态信息流 (56+ 条完整覆盖)
  const feedItems = useMemo(() => {
    const signatureMeta = {
      'demo-spinoff-policy': {
        category: 'article',
        catLabel: '深度报道',
        catIcon: 'article',
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuB7_ahxZ0V9R22qOjsZrVrkLqT7et4jHuJ4G2q2LRKunRgil9HNMD7jJ2JBi7i4YqcjIbgUd6UdD5WcMzlmG4Md45_7wZ0lHaUOEDg7PWQBqsa_fI7yET8awYSfkU8vO9tODoM_hxGrpQpQAzzJZYzxI2THLmpPP6PyFK6zPvv4QwMxYmWd3VSY_611nHn99GN0Bj1kD3tefbXLAth3_5nvGCHFITlY918jxOTlPfs02CYx47TIfxQ-',
        location: '新西兰·惠灵顿',
        factGrade: '事实核查 A+',
        code: 'MSD-POLICY-REPORT',
        readTime: '696 字 (约 3 分钟速读)',
        weight: 98,
        timestamp: 1725755400,
        tags: ['社会福利', '新西兰政策', 'EN Translated'],
        actionText: '阅读全文',
      },
      'demo-podcast-microduck': {
        category: 'podcast',
        catLabel: '第一财经',
        catIcon: 'podcasts',
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDglmLaaeeAesTLVzSR21IbRqiEVGTBMg693T8Lb_gslQ9BcA20NzFjNWYyTFd-TnuWChCA7Ks0ne13daz9Vi2bPqcDWw9KNKvd0Xg-WQytEQ__VC3QvWAeqm52UKJfLsb0dxOtoMXDlSLY0Vakv6XyOeapsbilgaQ_wPG-lUadLeMRZjZPCmVp7iRm8mbxUJVNA4bd_pE-mvf02u96SLb93NZfNm5cUH51Fp7NvRtDw_yXv71XwYL6',
        duration: '09:02',
        factGrade: '科技与商业焦点',
        factIcon: 'trending_up',
        code: 'EPISODE #602',
        readTime: '9 分钟深度音频',
        highlightTag: '极客社群裂变',
        weight: 95,
        timestamp: 1725750900,
        tags: ['具身智能', '供应链赋能'],
        actionText: '在线试听',
      },
      'demo-cls-brief': {
        category: 'brief',
        catLabel: '盘前要闻',
        catIcon: 'feed',
        isVisualLogo: true,
        logoText: 'CLS',
        logoSub: '快讯',
        logoBadge: '高权重',
        factGrade: '盘前大宗与资本异动',
        factIcon: 'bolt',
        code: 'MARKET-ALERT-0915',
        readTime: '3,119 字 (约 8 分钟速读)',
        highlightTag: '4 条交叉验证',
        weight: 92,
        timestamp: 1725749100,
        tags: ['小米汽车', '券商合并', '贵金属走势'],
        actionText: '速览电报',
      },
      'demo-culture-limited': {
        category: 'podcast',
        catLabel: '文',
        catIcon: 'auto_stories',
        isVisualBookCover: true,
        bookHeader: 'CULTURE LIMITED',
        bookTitle: '蝇王',
        bookSubtitle: 'Lord of the Flies',
        bookFooter: 'NOBEL LAUREATE 1983',
        duration: '01:59:22',
        factGrade: '文艺社科长篇',
        factIcon: 'auto_stories',
        code: 'EPISODE #351',
        readTime: '119 分钟深度漫谈',
        highlightTag: '典藏精选',
        weight: 90,
        timestamp: 1725712800,
        tags: ['文学经典', '制度隐喻'],
        actionText: '在线试听',
      },
      'demo-storage-report': {
        category: 'report',
        catLabel: '行业研报',
        catIcon: 'analytics',
        isVisualReportCover: true,
        reportHeader: 'RESEARCH REPORT',
        reportTitle: '新型储能技术与微电网',
        reportSub: '2024-2030 SCENARIOS',
        reportFooter: 'PDF · 48页',
        reportRating: 'Desk 评级 9.4',
        factGrade: '智库精编报告',
        factIcon: 'analytics',
        code: 'ENERGY-DESK-Q3',
        readTime: '14,200 字 (研读约 25 分钟)',
        highlightTag: '高保真图表',
        weight: 96,
        timestamp: 1725696900,
        tags: ['长时储能', '电网韧性', 'LCOS测算'],
        actionText: '研读报告',
      },
    };

    const signatureCards = prototypeArticles
      .filter((art) => signatureMeta[art.id])
      .map((art) => {
        const meta = signatureMeta[art.id];
        return {
          id: art.id,
          title: art.title,
          source: art.source,
          link: art.link,
          time: art.time,
          summary: art.body ? art.body.split('\n\n')[0] : '',
          ...meta,
        };
      });

    // 当前角色专属定制条目 (3条)
    const roleCards = (currentRole?.topNews || []).map((n, idx) => ({
      id: n.id,
      category: 'article',
      catLabel: currentRole?.name || '角色专享',
      catIcon: 'verified',
      title: n.title,
      source: n.source,
      time: '今天 09:00',
      readTime: '约 4 分钟研读',
      weight: 94 - idx,
      timestamp: 1725757200 - (idx + 1) * 1800,
      summary: n.summary || n.quote || '',
      tags: [currentRole?.name || '专属', '核心研读'],
      actionText: n.actionText || '查看研判',
      factGrade: n.badge || '专属研报 S',
      code: `ROLE-${n.id.toUpperCase()}`,
    }));

    // 权威前沿情报条目 (8条)
    const intelligenceCards = intelligence.map((item, idx) => ({
      id: item.id,
      category: item.category?.includes('研报') ? 'report' : 'article',
      catLabel: item.category || '技术研判',
      catIcon: 'article',
      title: item.title,
      source: item.source,
      time: item.time || '今天 08:00',
      readTime: '约 5 分钟研读',
      weight: item.score || 90 - idx,
      timestamp: 1725753600 - (idx + 4) * 3600,
      summary: item.core || item.body || '',
      tags: item.tags || [],
      actionText: '研读全文',
      factGrade: '权威前沿 A+',
      code: `INTEL-${item.id.toUpperCase()}`,
    }));

    // 延伸情报流条目 (40条)
    const streamCards = (extendedStreams || []).map((stream, idx) => {
      const isPodcast = stream.cat?.includes('播客') || stream.cat?.includes('音频');
      const isReport =
        stream.cat?.includes('研报') ||
        stream.cat?.includes('宏观') ||
        stream.cat?.includes('资本');
      const isBrief =
        stream.cat?.includes('快讯') ||
        stream.cat?.includes('协议') ||
        stream.cat?.includes('规范');
      const category = isPodcast ? 'podcast' : isReport ? 'report' : isBrief ? 'brief' : 'article';

      return {
        id: stream.id || `exp-stream-${idx + 1}`,
        category,
        catLabel: stream.cat?.replace('#', '') || '情报流',
        catIcon: isPodcast ? 'podcasts' : isReport ? 'analytics' : isBrief ? 'feed' : 'article',
        title: stream.title,
        source: stream.source,
        time: stream.time || '今日',
        readTime: '约 2 分钟速读',
        weight: 85 - (idx % 10),
        timestamp: 1725740000 - (idx + 1) * 1800,
        summary: `${stream.title}。经行业信源「${stream.source}」一手测试验证，关键技术指标已收录至本地监测流水线。`,
        tags: [stream.tag || stream.cat?.replace('#', '')],
        actionText: '速览要点',
        factGrade: '一手实测 A',
        code: `STRM-${idx + 1}`,
      };
    });

    const all = [...signatureCards, ...roleCards, ...intelligenceCards, ...streamCards];
    const map = new Map();
    all.forEach((item) => {
      if (!map.has(item.id)) map.set(item.id, item);
    });
    return Array.from(map.values());
  }, [currentRole]);

  // 统合智能流：无缝混合精选研读与实时抓取条目 (消除生硬的双模割裂)
  const unifiedItems = useMemo(() => {
    // 实时抓取条目转换格式
    const liveItems = liveEvents.map((evt) => ({
      id: evt.id,
      category: evt.category?.includes('播客') ? 'podcast' : evt.category?.includes('快讯') ? 'brief' : 'article',
      catLabel: evt.category || '实时抓取',
      catIcon: 'satellite_alt',
      title: evt.title,
      source: evt.materials?.[0]?.source || '本地 RSS 聚合',
      link: evt.primaryUrl || (evt.materials?.[0]?.url) || null,
      time: displayTime(evt.updatedAt || evt.publishedAt),
      readTime: '实时更新',
      weight: 94,
      timestamp: Date.parse(evt.updatedAt || evt.publishedAt || 0) || Date.now(),
      summary: evt.summary || '通过本地信源网络聚合所得的突发情报，已在本地数据库完成去重。',
      tags: ['实时聚合', '多源交叉'],
      isLive: true,
      bookmarked: !!evt.record?.bookmarked,
    }));

    // 合并并去重
    const map = new Map();
    liveItems.forEach((it) => map.set(it.id, it));
    feedItems.forEach((it) => {
      if (!map.has(it.id)) map.set(it.id, it);
    });

    return Array.from(map.values());
  }, [feedItems, liveEvents]);

  // 过滤与排序逻辑
  const filteredItems = useMemo(() => {
    return unifiedItems
      .filter((item) => {
        if (selectedCat !== 'all' && item.category !== selectedCat) return false;
        if (selectedThesis !== 'all') {
          const matched = getItemThesis(item);
          if (!matched || matched.tag !== selectedThesis) return false;
        }
        if (keyword.trim()) {
          const q = keyword.toLowerCase();
          const match =
            item.title.toLowerCase().includes(q) ||
            item.summary.toLowerCase().includes(q) ||
            (item.source && item.source.toLowerCase().includes(q)) ||
            (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)));
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'weight') return b.weight - a.weight;
        return b.timestamp - a.timestamp;
      });
  }, [unifiedItems, selectedCat, selectedThesis, keyword, sortOrder, getItemThesis]);

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto pb-16 select-none">
      {/* 极简清爽吸顶控制栏 (Single Row Clean Toolbar) */}
      <section className="sticky top-14 z-30 py-3.5 px-4 bg-[#fcf9f6]/95 backdrop-blur-md rounded-2xl border border-hairline shadow-2xs transition-all space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* 左侧：分类药丸胶囊 */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'all', label: '全部', icon: 'auto_awesome' },
              { id: 'article', label: '深度报道', icon: 'article' },
              { id: 'podcast', label: '播客音频', icon: 'podcasts' },
              { id: 'brief', label: '要闻快讯', icon: 'bolt' },
              { id: 'report', label: '行业研报', icon: 'analytics' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCat(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  selectedCat === cat.id
                    ? 'bg-ink text-canvas shadow-xs'
                    : 'bg-surface hover:bg-stone-100 text-muted hover:text-ink border border-hairline'
                }`}
              >
                <span className="material-symbols-outlined text-[15px] opacity-85">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* 右侧：过滤与后台抓取同步 */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex-1 sm:w-60">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[15px] text-muted pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="过滤关注流情报..."
                className="w-full pl-8 pr-7 py-2 bg-surface border border-hairline hover:border-hairline-strong rounded-xl text-xs text-ink placeholder:text-muted focus:outline-none focus:border-primary transition-colors shadow-2xs"
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => setKeyword('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>

            {/* 极简排序按钮 */}
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'latest' ? 'weight' : 'latest')}
              className="px-3 py-2 rounded-xl border border-hairline bg-surface hover:bg-stone-100 text-xs text-muted hover:text-ink font-medium transition-all shadow-2xs flex items-center gap-1 cursor-pointer shrink-0"
              title={sortOrder === 'latest' ? '当前：按最新时间（点击切按权重）' : '当前：按重要权重（点击切按最新）'}
            >
              <span className="material-symbols-outlined text-[14px] text-primary">
                {sortOrder === 'latest' ? 'schedule' : 'trending_up'}
              </span>
              <span>{sortOrder === 'latest' ? '最新' : '权重'}</span>
            </button>

            {/* 后台增量抓取同步 */}
            <button
              type="button"
              disabled={syncingLive}
              onClick={handleSyncLive}
              className="p-2 rounded-xl border border-hairline bg-surface hover:bg-stone-100 text-muted hover:text-primary transition-all shadow-2xs flex items-center justify-center cursor-pointer shrink-0 disabled:opacity-50"
              title="触发一次本地信源全网更新"
            >
              <span className={`material-symbols-outlined text-[16px] ${syncingLive ? 'animate-spin text-primary' : ''}`}>
                refresh
              </span>
            </button>
          </div>
        </div>

        {/* 第二大脑 · 课题雷达联动筛选条 */}
        <div className="pt-2.5 border-t border-hairline/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <span className="text-muted font-mono flex items-center gap-1 shrink-0 text-[11px]">
            <span className="material-symbols-outlined text-[14px] text-primary">psychology</span>
            <span>课题雷达:</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedThesis('all')}
            className={`px-3 py-1 rounded-full text-[11px] font-mono transition-all shrink-0 cursor-pointer ${
              selectedThesis === 'all'
                ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300'
                : 'bg-surface hover:bg-stone-100 text-muted border border-hairline'
            }`}
          >
            全部课题
          </button>
          {activeTheses.map((th) => (
            <button
              key={th.id || th.tag}
              type="button"
              onClick={() => setSelectedThesis(th.tag)}
              className={`px-3 py-1 rounded-full text-[11px] font-mono transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                selectedThesis === th.tag
                  ? 'bg-primary text-white font-bold shadow-2xs'
                  : 'bg-surface hover:bg-amber-50 text-stone-700 border border-hairline'
              }`}
            >
              <span>{th.tag}</span>
            </button>
          ))}
          {selectedThesis !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedThesis('all')}
              className="text-[10.5px] font-mono text-muted hover:text-red-700 ml-1 shrink-0 cursor-pointer"
            >
              [重置]
            </button>
          )}
        </div>
      </section>

      {/* 统一信息流展示区 (包含实时抓取与精选研读) */}
      <div className="space-y-4">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              onClick={() => openDrawer(item.id)}
              className="bg-surface/85 backdrop-blur-sm p-5 rounded-2xl border border-hairline hover:border-amber-400/70 motion-card-lift shadow-2xs flex flex-col md:flex-row gap-5 items-start cursor-pointer group"
            >
              {/* 左侧卡片视觉视窗 (封面图/长视频轨/专属设计视窗) */}
              <div className="relative w-full md:w-52 h-36 shrink-0 rounded-xl overflow-hidden border border-hairline/60">
                {/* 1. 真实图片封面 (深度报道 / 播客) */}
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}

                {/* 2. 快讯 CLS 视觉视窗 */}
                {item.isVisualLogo && (
                  <div className="w-full h-full bg-gradient-to-br from-amber-50/80 to-orange-100/50 flex items-center justify-center p-3">
                    <div className="w-14 h-14 rounded-xl bg-ink text-canvas flex flex-col items-center justify-center shadow-md">
                      <span className="font-serif text-[18px] font-bold tracking-tight text-amber-400">
                        {item.logoText}
                      </span>
                      <span className="font-mono text-[9px] tracking-wider uppercase font-semibold text-stone-300">
                        {item.logoSub}
                      </span>
                    </div>
                    {item.logoBadge && (
                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-white/90 text-body-strong rounded font-mono text-[10px] border border-hairline">
                        {item.logoBadge}
                      </span>
                    )}
                  </div>
                )}

                {/* 3. 文化有限 蝇王 书封视窗 */}
                {item.isVisualBookCover && (
                  <div className="w-full h-full bg-gradient-to-br from-amber-100 via-stone-200 to-amber-200/50 flex flex-col justify-between p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-ink font-bold tracking-tight">
                        {item.bookHeader}
                      </span>
                      <span className="w-4 h-4 rounded-full bg-ink flex items-center justify-center text-canvas text-[9px] font-bold">
                        {item.catLabel}
                      </span>
                    </div>
                    <div>
                      <div className="font-serif text-[20px] font-bold text-ink leading-none">
                        {item.bookTitle}
                      </div>
                      <div className="text-[10px] text-stone-600 font-sans mt-0.5">
                        {item.bookSubtitle}
                      </div>
                    </div>
                    <div className="font-mono text-[9px] text-stone-500 font-medium">
                      {item.bookFooter}
                    </div>
                  </div>
                )}

                {/* 4. 行业研报视窗 */}
                {item.isVisualReportCover && (
                  <div className="w-full h-full bg-gradient-to-br from-stone-800 to-stone-900 flex flex-col justify-between p-3.5 text-white">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                        {item.reportHeader}
                      </span>
                      <span className="material-symbols-outlined text-[16px] text-amber-400">
                        bolt
                      </span>
                    </div>
                    <div>
                      <div className="text-[13px] font-bold tracking-tight text-stone-100">
                        {item.reportTitle}
                      </div>
                      <div className="font-mono text-[9px] text-stone-400 mt-0.5">
                        {item.reportSub}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-stone-400 border-t border-stone-700/60 pt-1 font-mono">
                      <span>{item.reportFooter}</span>
                      <span className="text-amber-300">{item.reportRating}</span>
                    </div>
                  </div>
                )}

                {/* 5. 经典典藏刊物藏书票印章 (针对无特定封面图片的研报与快讯，不再重复冗余标题) */}
                {!item.image &&
                  !item.isVisualLogo &&
                  !item.isVisualBookCover &&
                  !item.isVisualReportCover && (
                    <div className="w-full h-full bg-gradient-to-br from-[#faf6ee] via-[#f3ede0] to-[#e8decb] flex flex-col justify-between p-3.5 border border-hairline/60 select-none">
                      {/* 顶栏：分类徽章与信源格式 */}
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-ink text-amber-300 rounded-md text-[10px] font-semibold shadow-2xs">
                          <span className="material-symbols-outlined text-[12px]">
                            {item.category === 'podcast'
                              ? 'podcasts'
                              : item.category === 'report'
                                ? 'analytics'
                                : 'feed'}
                          </span>
                          <span>{item.catLabel || '专栏情报'}</span>
                        </span>
                        <span className="font-mono text-[10px] text-stone-500 font-medium">
                          {item.isLive ? 'RSS 实时' : '精选专栏'}
                        </span>
                      </div>

                      {/* 核心视觉印记：刊物字印徽章 + 刊名 (通透大方，拒绝拥挤) */}
                      <div className="flex flex-col items-center justify-center my-auto py-1">
                        <div className="w-10 h-10 rounded-xl bg-surface-card/90 border border-hairline/80 shadow-2xs flex items-center justify-center text-primary mb-1.5 group-hover:scale-105 transition-transform">
                          <span className="font-serif font-bold text-lg leading-none text-ink">
                            {item.source?.[0] || '讯'}
                          </span>
                        </div>
                        <span className="font-serif font-bold text-xs text-ink tracking-tight text-center truncate max-w-[160px] px-1">
                          {item.source || 'SIGNAL DESK'}
                        </span>
                      </div>

                      {/* 底栏：时间与一手验证 */}
                      <div className="flex items-center justify-between text-[9.5px] text-stone-500 border-t border-hairline/60 pt-1 font-mono">
                        <span>{item.time || '今日'}</span>
                        <span className="text-primary font-medium">
                          {item.highlightTag || '一手信源'}
                        </span>
                      </div>
                    </div>
                  )}

                {/* 浮动标签：仅在真实图片上显示，避免与自绘视窗发生重叠 */}
                {item.image && item.category === 'article' && (
                  <span className="absolute top-2 left-2 px-2.5 py-1 bg-ink/90 text-amber-300 backdrop-blur-sm rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-[13px]">article</span>
                    {item.catLabel}
                  </span>
                )}
                {item.image && item.category === 'podcast' && item.catLabel !== '文' && (
                  <span className="absolute top-2 left-2 px-2.5 py-1 bg-accent-teal text-white backdrop-blur-sm rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-[13px]">podcasts</span>
                    {item.catLabel}
                  </span>
                )}
                {item.image && item.category === 'brief' && (
                  <span className="absolute top-2 left-2 px-2.5 py-1 bg-amber-700 text-white rounded-lg text-[11px] font-semibold shadow-xs">
                    {item.catLabel}
                  </span>
                )}
                {item.image && item.category === 'report' && (
                  <span className="absolute top-2 left-2 px-2.5 py-1 bg-primary text-white rounded-lg text-[11px] font-semibold shadow-xs">
                    {item.catLabel}
                  </span>
                )}

                {/* 右下角角标 (地理位置 / 音频时长) */}
                {item.location && (
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white rounded-md text-[10px] font-mono">
                    {item.location}
                  </span>
                )}
                {item.duration && (
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-ink/90 text-white rounded-md font-mono text-[11px] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px] text-accent-teal">
                      graphic_eq
                    </span>
                    {item.duration}
                  </span>
                )}
              </div>

              {/* 右侧核心内容 */}
              <div className="flex-1 flex flex-col justify-between w-full min-w-0 space-y-2">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {(() => {
                      const matchedTh = getItemThesis(item);
                      if (!matchedTh) return null;
                      return (
                        <span className="inline-flex items-center gap-1.5 font-mono font-bold text-[10.5px] text-amber-900 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-400/40 shadow-2xs">
                          <span className="material-symbols-outlined text-[12px] text-primary">psychology</span>
                          <span>{matchedTh.tag}</span>
                        </span>
                      );
                    })()}
                    {item.factGrade && (
                      <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-primary bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/50">
                        <span className="material-symbols-outlined text-[12px]">
                          {item.factIcon || 'verified'}
                        </span>
                        {item.factGrade}
                      </span>
                    )}
                    {item.code && (
                      <span className="text-[11px] text-muted font-mono">{item.code}</span>
                    )}
                  </div>

                  <h3 className="font-serif text-[18px] text-ink font-bold leading-snug group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted mt-1.5 font-mono">
                    <span className="font-semibold text-ink">{item.source}</span>
                    <span className="text-hairline-strong">•</span>
                    <span>{item.time}</span>
                    <span className="text-hairline-strong">•</span>
                    <span>{item.readTime}</span>
                    {item.highlightTag && (
                      <>
                        <span className="text-hairline-strong">•</span>
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium text-[11px]">
                          {item.highlightTag}
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-[13px] text-body line-clamp-2 leading-relaxed mt-1.5 text-stone-600">
                    {item.summary}
                  </p>
                </div>

                  {/* 底部区：标签、音频与简约操作 */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-hairline/60 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* 音频试听按钮与频谱动画 */}
                      {item.category === 'podcast' && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => toggleAudioPlay(item.id, e)}
                            className="flex items-center gap-1.5 px-3 py-1 bg-ink text-canvas hover:bg-stone-800 rounded-full text-xs font-semibold shadow-xs transition-all"
                          >
                            <span className="material-symbols-outlined text-[15px] text-amber-400">
                              {playingAudioId === item.id ? 'pause' : 'play_arrow'}
                            </span>
                            <span>{playingAudioId === item.id ? '暂停试听' : '在线试听'}</span>
                          </button>
                          {playingAudioId === item.id && (
                            <div className="flex items-center gap-1 audio-playing-bars text-primary pl-1">
                              <span className="w-1 h-3 bg-primary rounded-full animate-pulse"></span>
                              <span className="w-1 h-4 bg-primary rounded-full animate-bounce"></span>
                              <span className="w-1 h-2 bg-primary rounded-full animate-pulse"></span>
                              <span className="font-mono text-[11px] text-primary font-medium ml-1">
                                正在播放 01:24
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.tags.map((t, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-surface-cream text-body-strong text-[11px] rounded font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* 收藏操作 (轻量单按钮) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(item.id);
                        }}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          entries[item.id]?.bookmarked
                            ? 'bg-amber-50 border-amber-300 text-primary'
                            : 'border-hairline/80 hover:border-hairline-strong bg-surface text-muted hover:text-ink'
                        }`}
                        title={entries[item.id]?.bookmarked ? '取消收藏' : '存入我的收藏'}
                      >
                        <span
                          className="material-symbols-outlined text-[17px] block"
                          style={{
                            fontVariationSettings: entries[item.id]?.bookmarked ? "'FILL' 1" : "'FILL' 0",
                          }}
                        >
                          {entries[item.id]?.bookmarked ? 'bookmark' : 'bookmark_border'}
                        </span>
                      </button>

                      {/* 引导进入研读抽屉 */}
                      <div className="flex items-center gap-1 text-primary font-semibold text-xs group-hover:translate-x-0.5 transition-transform pl-1">
                        <span>研读</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
          ))}
        </div>
    </div>
  );
}
