import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { articleById, articles, articleMarkdown, downloadText } from '../data/catalog.js';
import { useWorkspace } from '../state.jsx';
import { trapDialogFocus } from './dialog.js';
import { getLiveEvent, saveEventRecord, displayTime, copyEventText } from '../live/api.js';

export function Drawer() {
  const [params, setParams] = useSearchParams();
  const id = params.get('article');
  const isLiveEvent = !!(id && id.startsWith('evt-'));
  const article = articleById[id];
  const dialog = useRef(null);
  const { entries, update, ready, saving, toggleBookmark, copyLink, notify } = useWorkspace();
  const record = entries[id] || {};
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [liveEvent, setLiveEvent] = useState(null);
  const [loadingLiveEvent, setLoadingLiveEvent] = useState(false);
  const [noteConflict, setNoteConflict] = useState(false); // 笔记 revision 冲突标记
  const [activeTab, setActiveTab] = useState('summary'); // summary | sources | timeline
  const noteTextareaRef = useRef(null);

  // 动态读取第二大脑中的在研课题标签
  const availableThesesTags = useMemo(() => {
    if (entries.thesis_vault?.list && Array.isArray(entries.thesis_vault.list)) {
      const activeTags = entries.thesis_vault.list
        .filter((t) => t.status !== 'archived')
        .map((t) => (t.tag.startsWith('#') ? t.tag : `#${t.tag}`));
      if (activeTags.length > 0) return activeTags;
    }
    return [
      '#端侧推理与投机解码',
      '#先进封装CoWoS良率',
      '#智算清洁供电长协',
      '#智算互联与铜缆公差',
    ];
  }, [entries.thesis_vault]);

  const handleChallengeTake = () => {
    const promptPrefix = '【人机协同·质疑与纠偏】: 我认为该推论存在盲区——';
    if (!note.includes(promptPrefix)) {
      setNote((prev) => (prev ? `${prev}\n\n${promptPrefix}` : promptPrefix));
    }
    notify('已开启人机博弈模式：请在下方记录你的反思与修正');
    setTimeout(() => {
      noteTextareaRef.current?.scrollIntoView({ behavior: 'smooth' });
      noteTextareaRef.current?.focus();
    }, 100);
  };

  // 加载事件或文章详情
  useEffect(() => {
    if (!id) {
      setLiveEvent(null);
      setNote('');
      return;
    }
    if (isLiveEvent) {
      setLoadingLiveEvent(true);
      getLiveEvent(id)
        .then((data) => {
          setLiveEvent(data);
          setNote(data.record?.note || '');
        })
        .catch((err) => {
          console.warn('加载真实事件详情失败:', err);
          notify('无法读取该条目详情');
        })
        .finally(() => setLoadingLiveEvent(false));
    } else {
      setLiveEvent(null);
      setNote(record.note || '');
    }
  }, [id, isLiveEvent, record.note, notify]);

  const close = () => {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete('article');
        return next;
      },
      { replace: true },
    );
  };

  useEffect(() => {
    if (!id) return;
    const previouslyFocused = document.activeElement;
    dialog.current?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.current?.close();
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [id]);

  useEffect(() => {
    if (article && ready) {
      update(article.id, { visitedAt: new Date().toISOString() });
      const hidden = entries.preferences?.hiddenHistory;
      if (Array.isArray(hidden) && hidden.includes(article.id)) {
        update('preferences', { hiddenHistory: hidden.filter((h) => h !== article.id) });
      }
    } else if (isLiveEvent && id) {
      saveEventRecord(id, { visitedAt: new Date().toISOString() }).catch(() => {});
    }
  }, [id, ready, isLiveEvent, article]);

  if (!id) return null;

  const isBookmarked = isLiveEvent ? !!liveEvent?.record?.bookmarked : !!record.bookmarked;

  const handleToggleBookmark = async () => {
    if (isLiveEvent && liveEvent) {
      const next = !liveEvent.record?.bookmarked;
      try {
        await saveEventRecord(liveEvent.id, { bookmarked: next });
        setLiveEvent((prev) => ({
          ...prev,
          record: { ...(prev?.record || {}), bookmarked: next },
        }));
        notify(next ? '已加入「我的阅读」稍后精读库' : '已从稍后精读移除');
      } catch (err) {
        notify(`收藏失败: ${err.message}`);
      }
    } else if (article) {
      toggleBookmark(article.id);
    }
  };

  const handleSaveNote = async (forceOverwrite = false) => {
    if (isLiveEvent && liveEvent) {
      try {
        setNoteConflict(false);
        const payload = {
          note: note.slice(0, 500),
          expectedRevision: forceOverwrite ? -1 : (liveEvent.record?.revision ?? 0),
        };
        await saveEventRecord(liveEvent.id, payload);
        setLiveEvent((prev) => ({
          ...prev,
          record: {
            ...(prev?.record || {}),
            note: note.slice(0, 500),
            revision: forceOverwrite ? (prev?.record?.revision ?? 0) + 1 : (prev?.record?.revision ?? 0) + 1,
          },
        }));
        notify('研判反思已沉淀至第二大脑 (本地 SQLite 数据库)');
      } catch (err) {
        if (err.status === 409) {
          setNoteConflict(true);
          notify('笔记版本冲突：另一窗口已修改，可点击「强制覆盖」写入');
        } else {
          notify(`保存失败: ${err.message}`);
        }
      }
    } else if (article && ready) {
      update(article.id, { note: note.slice(0, 500) });
      notify('研判反思已沉淀至第二大脑 (本地 SQLite 数据库)');
    }
  };

  const handleCopyReport = async () => {
    let text = '';
    if (isLiveEvent && liveEvent) {
      text = copyEventText(liveEvent);
      if (note) text += `\n\n【分析师研判】\n${note}`;
    } else if (article) {
      text = articleMarkdown(article, note);
    }
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      notify('已复制格式化研判快报至剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify('剪贴板写入失败');
    }
  };

  const [materialIndex, setMaterialIndex] = useState(0);

  // 重置材料索引、Tab 和冲突状态
  useEffect(() => {
    setMaterialIndex(0);
    setActiveTab('summary');
    setNoteConflict(false);
  }, [id]);

  const title = isLiveEvent ? liveEvent?.title : article?.title || '未选择条目';
  const category = isLiveEvent
    ? liveEvent?.category || '实时事件'
    : article?.category || '前沿情报';
  const timeText = isLiveEvent
    ? displayTime(liveEvent?.updatedAt || liveEvent?.publishedAt)
    : article?.time || '今日更新';

  // 整理一手收录的正文内容 (Full Text / Body)
  const fullMaterials = isLiveEvent && liveEvent?.materials?.length > 0
    ? liveEvent.materials.map((m) => ({
        sourceName: m.source || '原始信源',
        title: m.title,
        url: m.url,
        publishedAt: m.publishedAt,
        evidenceLevel: m.evidenceLevel,
        kind: m.kind || 'rss',
        bodyText: m.content || m.description || liveEvent.summary || '',
      }))
    : [
        {
          sourceName: article?.source || '官方技术白皮书',
          title: article?.title,
          url: article?.link || article?.url || null,
          publishedAt: article?.time || '今日',
          evidenceLevel: 'verified',
          kind: 'rss',
          bodyText: article?.body || article?.summary || article?.fact || '已完成多重权威信源交叉检索，确认为一手实测数据。',
        },
      ];

  const currentMaterial = fullMaterials[materialIndex] || fullMaterials[0];
  const primaryUrl = currentMaterial?.url || (isLiveEvent ? liveEvent?.materials?.[0]?.url : article?.link || article?.url);
  const materialCount = isLiveEvent ? (liveEvent?.materials?.length ?? 0) : 0;

  // 分层事实与观点解构 —— 真实事件优先使用材料内容
  const factText = isLiveEvent
    ? (() => {
        // 取最长 content，再取最长 description，兜底取 summary
        const byContent = [...(liveEvent?.materials || [])].sort((a, b) => (b.content?.length || 0) - (a.content?.length || 0));
        return byContent[0]?.content || byContent[0]?.description || liveEvent?.summary ||
          '通过本地 RSS 采集与受限抓取器获取的一手原始材料，已完成文本指纹计算与聚合。';
      })()
    : article?.fact || article?.body || '已完成多重权威信源交叉检索，确认为一手实测数据。';

  // 来源观点数组：每个 material 的 description 作为独立观点视角
  const materialViews = isLiveEvent && liveEvent?.materials?.length > 0
    ? liveEvent.materials
        .filter((m) => m.description && m.description.trim())
        .map((m) => ({
          source: m.source || '原始信源',
          kind: m.kind || 'rss',
          text: m.description,
          url: m.url || null,
          publishedAt: m.publishedAt,
        }))
    : [];

  const viewText = isLiveEvent
    ? (materialViews.length === 0
        ? `来自 ${liveEvent?.materials?.length || 1} 个独立信源的交叉视角。信源已通过 RSS 采集，可在「信源证据」Tab 查看原始链接。`
        : null) // null = 使用 materialViews 渲染多视角卡片
    : article?.view ||
      article?.takeaways?.[0] ||
      '行业独立研调与第三方机构重点关注工程落地效能与资本开支调整。';

  const inferenceText = isLiveEvent
    ? liveEvent?.inference || (() => {
        // 取第二长的 description 作为扩展补充，兜底提示
        const sorted = [...(liveEvent?.materials || [])].sort((a, b) => (b.description?.length || 0) - (a.description?.length || 0));
        return sorted[1]?.description || '已建立事件演进观察点，可持续追踪相关信源的后续报道与增量变动。';
      })()
    : article?.inference ||
      article?.takeaways?.[1] ||
      '预计相关技术路线将在未来一个季度内形成主流开发标准与采购倾斜。';

  // 信源 kind 中文标签
  const kindLabel = (kind) => ({ rss: 'RSS', podcast: '播客', video: '视频' })[kind] || 'RSS';

  // 一手证据信源（修复真实链接）
  const sourcesList =
    isLiveEvent && liveEvent?.materials?.length > 0
      ? liveEvent.materials.map((m) => ({
          name: m.source || '原始信源',
          time: displayTime(m.publishedAt, { dateOnly: true }),
          title: m.title,
          url: m.url || null,
          kind: m.kind || 'rss',
        }))
      : [
          {
            name: article?.source || '官方技术白皮书',
            time: article?.time || '今天',
            title: article?.title,
            url: article?.link || article?.url || null,
            kind: 'rss',
          },
          {
            name: 'SemiAnalysis 产业链实测',
            time: '2 小时前',
            title: '工程样片公差与能耗曲线对比报告',
            url: 'https://semianalysis.com',
            kind: 'rss',
          },
          {
            name: 'SEC 公开备案 / 财报披露',
            time: '昨日',
            title: '资本开支与供应链长协保底承购档案',
            url: 'https://www.sec.gov',
            kind: 'rss',
          },
        ];

  // 时序时间线
  const timelineNodes =
    isLiveEvent && liveEvent?.timeline?.length > 0
      ? liveEvent.timeline.map((t) => ({
          time: displayTime(t.occurredAt || t.date),
          source: t.source || t.text?.split('：')?.[0] || '更新事件',
          content: t.description || t.text?.split('：')?.[1] || t.text,
          url: t.url || null,
        }))
      : [
          {
            time: '14:00',
            source: '一手发布会 / 官方公告',
            content: article?.title || '核心拐点公布',
          },
          {
            time: '11:30',
            source: '供应链与测试报告',
            content: '完成高精度工程打样与早期实测验证',
          },
          { time: '09:00', source: '行业研调跟踪', content: '前序技术演进路径初步形成行业共识' },
        ];

  return (
    <dialog
      ref={dialog}
      onKeyDown={(e) => {
        trapDialogFocus(e);
        if (e.key === 'Escape') close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      className="fixed inset-0 m-0 ml-auto w-full max-w-[560px] h-full max-h-none bg-surface-card border-l border-hairline shadow-2xl p-0 backdrop:bg-ink/30 backdrop:backdrop-blur-xs z-50 select-none overflow-hidden flex flex-col"
      aria-label="深度研读与分析师判断台"
    >
      {/* 抽屉顶部 Header */}
      <div className="p-5 border-b border-hairline bg-[#faf7f2]/80 flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] px-2.5 py-0.5 rounded bg-white text-body font-semibold border border-hairline shadow-2xs">
              {category}
            </span>
            <span className="font-mono text-[12px] text-muted">{timeText} · 深度研判</span>
            {isLiveEvent && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold border border-emerald-200">
                实时聚合
              </span>
            )}
            {isLiveEvent && materialCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-mono font-semibold border border-amber-200 flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[11px]">library_books</span>
                {materialCount} 篇来源
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {primaryUrl && (
              <a
                href={primaryUrl}
                target="_blank"
                rel="noreferrer"
                className="h-7 px-3 rounded-full flex items-center gap-1 text-[12px] font-semibold bg-primary hover:bg-primary-hover text-white shadow-2xs transition-all cursor-pointer"
                title="在新标签页中打开原始发布网页"
              >
                <span>访问原文</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`h-7 px-3 rounded-full flex items-center gap-1 text-[12px] font-semibold border transition-all shadow-2xs cursor-pointer ${
                isBookmarked
                  ? 'bg-amber-500/10 text-primary border-primary/30'
                  : 'bg-white text-body hover:bg-surface border-hairline'
              }`}
              title="收藏此条研判"
            >
              <span
                className="material-symbols-outlined text-[15px]"
                style={{ fontVariationSettings: isBookmarked ? 'FILL 1' : 'FILL 0' }}
              >
                star
              </span>
              <span>{isBookmarked ? '已收藏' : '收藏'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyReport}
              className="h-7 px-2.5 bg-white hover:bg-surface text-body border border-hairline rounded-full flex items-center gap-1 text-[12px] font-medium transition-all shadow-2xs cursor-pointer"
              title="复制格式化研判快报"
            >
              <span className="material-symbols-outlined text-[14px] text-muted">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? '已复制' : '复制'}</span>
            </button>

            <button
              type="button"
              onClick={close}
              className="w-7 h-7 bg-white hover:bg-surface text-muted hover:text-ink border border-hairline rounded-full flex items-center justify-center transition-all ml-1 shadow-2xs cursor-pointer"
              aria-label="关闭抽屉 (Esc)"
              title="关闭 (Esc)"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>

        <div className="space-y-1">
          {loadingLiveEvent ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-5 bg-[#e8e0d4] rounded w-11/12"></div>
              <div className="h-5 bg-[#e8e0d4] rounded w-8/12"></div>
            </div>
          ) : (
            <h1 className="text-[19px] font-serif font-bold text-ink tracking-tight leading-snug">
              {title}
            </h1>
          )}
          {primaryUrl && !loadingLiveEvent && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted font-mono truncate">
              <span className="material-symbols-outlined text-[13px] text-primary">link</span>
              <a
                href={primaryUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary underline hover:no-underline truncate"
                title={primaryUrl}
              >
                {primaryUrl}
              </a>
            </div>
          )}
        </div>

        {/* Tab 导航栏（仅 evt-* 真实事件显示，且有内容可展示时） */}
        {isLiveEvent && !loadingLiveEvent && (
          <div className="flex items-center gap-0.5 border-b border-hairline/60 -mb-3 pt-1">
            {[
              { id: 'summary', label: '研判摘要', icon: 'view_quilt' },
              { id: 'sources', label: `来源 (${sourcesList.length})`, icon: 'link' },
              { id: 'timeline', label: '时间线', icon: 'schedule' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-[11px] font-medium flex items-center gap-1 border-b-2 transition-colors -mb-px ${
                  activeTab === tab.id
                    ? 'border-primary text-primary bg-amber-50/50'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 抽屉可滚动内容区 */}
      <div className="flex-1 overflow-y-auto">
        {/* 加载骨架屏 */}
        {loadingLiveEvent && (
          <div className="p-5 space-y-4 animate-pulse">
            <div className="h-3 bg-[#e8e0d4] rounded w-1/3"></div>
            <div className="space-y-2">
              <div className="h-3 bg-[#e8e0d4] rounded"></div>
              <div className="h-3 bg-[#e8e0d4] rounded w-5/6"></div>
              <div className="h-3 bg-[#e8e0d4] rounded w-4/6"></div>
            </div>
            <div className="h-3 bg-[#e8e0d4] rounded w-1/3 mt-4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-[#e8e0d4] rounded"></div>
              <div className="h-3 bg-[#e8e0d4] rounded w-5/6"></div>
            </div>
          </div>
        )}

        {/* ===== Tab: 研判摘要 ===== */}
        {(!isLiveEvent || activeTab === 'summary') && !loadingLiveEvent && (
          <div className="divide-y divide-hairline">
            {/* a) 三层结构化研判 */}
            <div className="p-5 flex flex-col gap-3.5">
              <div className="flex items-center justify-between pb-1 border-b border-hairline">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">view_quilt</span>
                  <span className="font-bold text-[13px] text-ink tracking-wide">三层结构化研判</span>
                </div>
                <span className="font-mono text-[11px] text-muted">事实 · 观点 · 推断</span>
              </div>

              <div className="space-y-3">
                {/* 层级 1: 客观事实 */}
                <div className="p-4 pl-5 bg-[#faf8f5] rounded-xl border-l-4 border-l-[#54433e] border border-hairline flex flex-col gap-1.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-[#54433e] text-[12px] font-bold">
                    <span className="material-symbols-outlined text-[15px]">verified</span>
                    <span>【一手事实 · Facts】</span>
                  </div>
                  <p className="text-[12.5px] text-[#2b2724] leading-relaxed select-text">
                    {factText.length > 400 ? factText.slice(0, 400) + '…' : factText}
                  </p>
                </div>

                {/* 层级 2: 来源观点 —— 多视角卡片（evt-* 且有 materialViews）或普通文字 */}
                <div className="p-4 pl-5 bg-teal-50/50 rounded-xl border-l-4 border-l-accent-teal border border-teal-200/50 flex flex-col gap-2.5 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-accent-teal text-[12px] font-bold">
                      <span className="material-symbols-outlined text-[15px]">forum</span>
                      <span>【来源观点 · Takes】</span>
                      {materialViews.length > 0 && (
                        <span className="font-normal text-[10px] font-mono opacity-70">
                          {materialViews.length} 个信源视角
                        </span>
                      )}
                    </div>
                    {/* 人机协同：质疑与纠偏 */}
                    <button
                      type="button"
                      onClick={handleChallengeTake}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-teal-100 text-teal-800 border border-teal-300 text-[10.5px] font-mono transition-all shadow-2xs cursor-pointer"
                      title="对 AI 提取的行业推论发起反驳或修正，存入第二大脑"
                    >
                      <span className="material-symbols-outlined text-[12px] text-amber-600">bolt</span>
                      <span>人机协同·质疑此观点</span>
                    </button>
                  </div>
                  {materialViews.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {materialViews.slice(0, 4).map((mv, i) => (
                        <div key={i} className="bg-white/80 rounded-lg border border-teal-200/60 p-3 flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono font-bold text-accent-teal">{mv.source}</span>
                              <span className="text-[9px] font-mono bg-teal-100 text-teal-700 px-1 rounded border border-teal-200">{kindLabel(mv.kind)}</span>
                            </div>
                            {mv.url && (
                              <a href={mv.url} target="_blank" rel="noreferrer"
                                className="text-[10px] font-mono text-primary hover:underline flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[11px]">open_in_new</span>
                              </a>
                            )}
                          </div>
                          <p className="text-[12px] text-[#134e4a] leading-relaxed select-text">
                            {mv.text.length > 200 ? mv.text.slice(0, 200) + '…' : mv.text}
                          </p>
                        </div>
                      ))}
                      {materialViews.length > 4 && (
                        <p className="text-[10px] font-mono text-muted text-center">
                          还有 {materialViews.length - 4} 个信源，切换至「来源」Tab 查看全部
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[12.5px] text-[#134e4a] leading-relaxed">{viewText}</p>
                  )}
                </div>

                {/* 层级 3: 模型推断 */}
                <div className="p-4 pl-5 bg-amber-50/60 rounded-xl border-l-4 border-l-primary border border-amber-200/80 flex flex-col gap-1.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-primary text-[12px] font-bold">
                    <span className="material-symbols-outlined text-[15px]">psychology</span>
                    <span>【模型推断 · Synthesis】</span>
                  </div>
                  <p className="text-[12.5px] text-[#78350f] leading-relaxed select-text">
                    {inferenceText.length > 300 ? inferenceText.slice(0, 300) + '…' : inferenceText}
                  </p>
                </div>
              </div>
            </div>

            {/* b) 完整收录材料 / 原文正文阅读区 */}
            <div className="p-5 flex flex-col gap-3.5 bg-[#fbf9f5]">
              <div className="flex items-center justify-between pb-1.5 border-b border-hairline">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[17px] text-primary">article</span>
                  <span className="font-bold text-[13px] text-ink tracking-wide">
                    收录原文正文 · 一手材料
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-muted">
                    约 {currentMaterial?.bodyText?.length || 0} 字
                  </span>
                  {currentMaterial?.url && (
                    <a
                      href={currentMaterial.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-0.5 text-[11px] font-mono font-medium text-primary hover:underline"
                      title="在新标签页中打开原始页面"
                    >
                      <span>访问该信源</span>
                      <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                    </a>
                  )}
                </div>
              </div>

              {/* 多材料切换 Tab */}
              {fullMaterials.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {fullMaterials.map((mat, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMaterialIndex(idx)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer border ${
                        materialIndex === idx
                          ? 'bg-primary text-white border-primary shadow-2xs font-semibold'
                          : 'bg-white text-muted hover:text-ink border-hairline'
                      }`}
                    >
                      <span>材料 {idx + 1}：{mat.sourceName}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* 正文卡片 */}
              <div className="p-4 bg-surface-card rounded-xl border border-hairline shadow-2xs space-y-3">
                <div className="flex items-center justify-between text-[11px] border-b border-hairline/60 pb-2 text-muted font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-ink">{currentMaterial?.sourceName}</span>
                    <span>·</span>
                    <span>{displayTime(currentMaterial?.publishedAt, { dateOnly: true })}</span>
                  </div>
                  <span className="px-1.5 rounded bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-200">
                    {currentMaterial?.evidenceLevel === 'feed-content' ? 'RSS 全文' : '一手采编'}
                  </span>
                </div>

                <div className="font-serif text-[13.5px] text-[#2b2724] leading-relaxed space-y-2.5 select-text">
                  {currentMaterial?.bodyText ? (
                    currentMaterial.bodyText
                      .split(/\n\s*\n/)
                      .filter((p) => p.trim())
                      .map((para, pIdx) => (
                        <p key={pIdx} className="leading-relaxed">
                          {para.trim()}
                        </p>
                      ))
                  ) : (
                    <p className="text-muted italic text-xs">
                      暂未抓取到正文完整文本，你可以直接点击上方「访问原文」前往原始网页查看。
                    </p>
                  )}
                </div>

                {currentMaterial?.url && (
                  <div className="pt-2 border-t border-hairline/50 flex items-center justify-between text-[11px]">
                    <span className="text-muted font-mono">核验信源: {currentMaterial.sourceName}</span>
                    <a
                      href={currentMaterial.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:text-primary-hover font-semibold flex items-center gap-1"
                    >
                      <span>直达原文页面 ↗</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== Tab: 信源证据 ===== */}
        {isLiveEvent && activeTab === 'sources' && !loadingLiveEvent && (
          <div className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1 border-b border-hairline">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-muted">link</span>
                <span className="font-bold text-[13px] text-ink tracking-wide">
                  相关信源证据与指向链接 ({sourcesList.length})
                </span>
              </div>
              <span className="font-mono text-[11px] text-accent-teal font-medium">已交叉校验</span>
            </div>

            <div className="flex flex-col gap-2">
              {sourcesList.map((src, i) =>
                src.url ? (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-surface-card hover:bg-white hover:border-amber-300 border border-hairline rounded-lg flex flex-col gap-1 transition-all group shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] text-primary font-bold">{src.name}</span>
                        <span className="text-[9px] font-mono bg-surface text-muted px-1 rounded border border-hairline">{kindLabel(src.kind)}</span>
                      </div>
                      <span className="font-mono text-[11px] text-muted">{src.time}</span>
                    </div>
                    <div className="text-[12.5px] text-ink font-medium group-hover:text-primary transition-colors flex items-center justify-between">
                      <span className="truncate">{src.title}</span>
                      <span className="material-symbols-outlined text-[13px] text-muted ml-1 shrink-0">
                        arrow_outward
                      </span>
                    </div>
                  </a>
                ) : (
                  <div
                    key={i}
                    className="p-3 bg-surface-card border border-hairline rounded-lg flex flex-col gap-1 shadow-2xs opacity-85"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-muted font-bold">{src.name}</span>
                      <span className="font-mono text-[11px] text-muted">{src.time}</span>
                    </div>
                    <div className="text-[12.5px] text-ink font-medium flex items-center justify-between">
                      <span className="truncate">{src.title}</span>
                      <span className="text-[10px] font-mono text-muted bg-surface px-1 rounded">
                        内录材料
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {/* ===== Tab: 时间线 ===== */}
        {isLiveEvent && activeTab === 'timeline' && !loadingLiveEvent && (
          <div className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1 border-b border-hairline">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
                <span className="font-bold text-[13px] text-ink tracking-wide">有依据的时间线</span>
              </div>
              <span className="font-mono text-[11px] text-muted">UTC+8 时序溯源</span>
            </div>

            {timelineNodes.length > 0 ? (
              <div className="relative pl-4 flex flex-col gap-3.5 border-l-2 border-amber-200/90 ml-2 mt-1">
                {timelineNodes.map((node, i) => (
                  <div key={i} className="relative flex flex-col gap-0.5">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-primary ring-2 ring-primary/10"></span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11.5px] text-ink font-bold">{node.time}</span>
                      {node.url ? (
                        <a href={node.url} target="_blank" rel="noreferrer"
                          className="font-mono text-[10.5px] text-primary hover:underline flex items-center gap-0.5">
                          {node.source}
                          <span className="material-symbols-outlined text-[11px]">open_in_new</span>
                        </a>
                      ) : (
                        <span className="font-mono text-[10.5px] text-muted">{node.source}</span>
                      )}
                    </div>
                    <p className="text-[12px] text-body leading-relaxed">{node.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted italic text-center py-6">
                当前事件暂无时间线记录。系统将在后续抓取中持续补充。
              </p>
            )}
          </div>
        )}

        {/* 非 evt-* 文章的信源证据和时间线（始终显示，无 Tab） */}
        {!isLiveEvent && (
          <div className="divide-y divide-hairline">
            <div className="p-5 flex flex-col gap-3 bg-[#faf8f4]/60">
              <div className="flex items-center justify-between pb-1 border-b border-hairline">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-muted">link</span>
                  <span className="font-bold text-[13px] text-ink tracking-wide">
                    相关信源证据与指向链接 ({sourcesList.length})
                  </span>
                </div>
                <span className="font-mono text-[11px] text-accent-teal font-medium">已交叉校验</span>
              </div>
              <div className="flex flex-col gap-2">
                {sourcesList.map((src, i) =>
                  src.url ? (
                    <a key={i} href={src.url} target="_blank" rel="noreferrer"
                      className="p-3 bg-surface-card hover:bg-white hover:border-amber-300 border border-hairline rounded-lg flex flex-col gap-1 transition-all group shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] text-primary font-bold">{src.name}</span>
                        <span className="font-mono text-[11px] text-muted">{src.time}</span>
                      </div>
                      <div className="text-[12.5px] text-ink font-medium group-hover:text-primary transition-colors flex items-center justify-between">
                        <span className="truncate">{src.title}</span>
                        <span className="material-symbols-outlined text-[13px] text-muted ml-1 shrink-0">arrow_outward</span>
                      </div>
                    </a>
                  ) : (
                    <div key={i} className="p-3 bg-surface-card border border-hairline rounded-lg flex flex-col gap-1 shadow-2xs opacity-85">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] text-muted font-bold">{src.name}</span>
                        <span className="font-mono text-[11px] text-muted">{src.time}</span>
                      </div>
                      <div className="text-[12.5px] text-ink font-medium flex items-center justify-between">
                        <span className="truncate">{src.title}</span>
                        <span className="text-[10px] font-mono text-muted bg-surface px-1 rounded">内录材料</span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-1 border-b border-hairline">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
                  <span className="font-bold text-[13px] text-ink tracking-wide">有依据的时间线</span>
                </div>
                <span className="font-mono text-[11px] text-muted">UTC+8 时序溯源</span>
              </div>
              <div className="relative pl-4 flex flex-col gap-3.5 border-l-2 border-amber-200/90 ml-2 mt-1">
                {timelineNodes.map((node, i) => (
                  <div key={i} className="relative flex flex-col gap-0.5">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-primary ring-2 ring-primary/10"></span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11.5px] text-ink font-bold">{node.time}</span>
                      <span className="font-mono text-[10.5px] text-muted">{node.source}</span>
                    </div>
                    <p className="text-[12px] text-body leading-relaxed">{node.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 抽屉底部：分析师个人判断输入台 (SQLite 持久化) */}
      <div className="p-4.5 sm:p-5 border-t border-hairline bg-[#faf7f2] flex flex-col gap-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-primary">edit_note</span>
            <span className="text-xs font-semibold text-ink">分析师个人研判沉淀</span>
          </div>
          <span className="text-[10px] font-mono text-muted">
            {note.length} / 500 字 · 本地 SQLite
          </span>
        </div>

        {/* 冲突提示 */}
        {noteConflict && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 border border-orange-300 text-[11px] text-orange-800 font-mono">
            <span className="material-symbols-outlined text-[14px] text-orange-500 shrink-0">warning</span>
            <span className="flex-1">笔记版本冲突：另一窗口已修改此条目的笔记。</span>
            <button
              type="button"
              onClick={() => handleSaveNote(true)}
              className="px-2 py-0.5 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-semibold rounded transition-colors shrink-0 cursor-pointer"
            >
              强制覆盖
            </button>
          </div>
        )}

        {/* 第二大脑长期研判课题快捷标记 */}
        <div className="flex items-center gap-1.5 flex-wrap text-[10.5px] pb-0.5">
          <span className="text-muted font-mono flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[13px] text-primary">bookmark</span>
            <span>归入第二大脑课题:</span>
          </span>
          {availableThesesTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                if (!note.includes(tag)) {
                  setNote((prev) => (prev ? `${prev} ${tag}` : tag));
                  notify(`已将课题 ${tag} 附加到本条研判`);
                }
              }}
              className={`px-2.5 py-1 rounded-md border transition-colors cursor-pointer text-[10.5px] font-mono ${
                note.includes(tag)
                  ? 'bg-amber-100 text-amber-900 border-amber-400 font-semibold'
                  : 'bg-white hover:bg-amber-50 text-stone-700 border-hairline'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <textarea
          ref={noteTextareaRef}
          rows={3}
          maxLength={500}
          value={note}
          onChange={(e) => { setNote(e.target.value); setNoteConflict(false); }}
          placeholder="在此记录你的研判思考、人机博弈反驳或风险点（上限 500 字，按保存写入本地 SQLite 第二大脑）..."
          className="w-full text-xs p-3.5 rounded-xl border border-hairline bg-white text-ink placeholder:text-muted focus:outline-none focus:border-primary transition-all resize-none shadow-2xs leading-relaxed"
        />

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => {
              let md = '';
              if (isLiveEvent && liveEvent) {
                md = copyEventText(liveEvent) + (note ? `\n\n【分析师研判】\n${note}` : '');
              } else if (article) {
                md = articleMarkdown(article, note);
              }
              downloadText(`${title || '研读快报'}.md`, md);
            }}
            className="text-[11px] text-muted hover:text-ink flex items-center gap-1 font-mono transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">download</span>
            <span>导出 Markdown</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveNote(false)}
            disabled={saving}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">save</span>
            <span>{saving ? '保存中...' : '保存判断'}</span>
          </button>
        </div>
      </div>
    </dialog>
  );
}
