import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { initialSources, legacySources, legacyPodcasts, downloadText } from '../data/catalog.js';
import { useWorkspace } from '../state.jsx';
import { CATEGORIES } from '../../shared/contracts.js';
import {
  getLiveSources,
  saveLiveSource,
  deleteLiveSource,
  testLiveSource,
  seedLiveSources,
  startFetchJob,
  getLiveJob,
  getLiveStatus,
  displayTime,
} from '../live/api.js';

const blankSource = {
  name: '',
  match: '',
  url: '',
  category: '硬科技与半导体',
  weight: 90,
  enabled: true,
};

export function SettingsPage() {
  const { notify, saving, currentRole, roles, switchRole } = useWorkspace();
  const [activeTab, setActiveTab] = useState('rss');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState({ column: 'name', asc: true });
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const fileInputRef = useRef(null);

  // 真实信源列表与状态
  const [liveSources, setLiveSources] = useState([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [testingSourceId, setTestingSourceId] = useState(null);
  const [fetchJob, setFetchJob] = useState(null);
  const [lastFetchSuccessAt, setLastFetchSuccessAt] = useState(null);

  // 登记信源表单状态
  const [form, setForm] = useState(blankSource);
  const [formError, setFormError] = useState('');
  const [formTesting, setFormTesting] = useState(false);
  const [formTestResult, setFormTestResult] = useState(null);

  // 播客与长视频信源列表（已预装旧版完整 42 个高质量频道）
  const [podcasts, setPodcasts] = useState(legacyPodcasts);

  // 加载 SQLite 中真实信源
  const loadLiveSources = useCallback(async () => {
    try {
      setLoadingSources(true);
      const list = await getLiveSources();
      setLiveSources(Array.isArray(list) ? list : []);
      const st = await getLiveStatus();
      if (st?.lastFetchSuccessAt) setLastFetchSuccessAt(st.lastFetchSuccessAt);
    } catch (err) {
      console.warn('读取本地真实信源失败:', err);
    } finally {
      setLoadingSources(false);
    }
  }, []);

  useEffect(() => {
    loadLiveSources();
  }, [loadLiveSources]);

  const currentSources = liveSources;

  const availableCategories = useMemo(() => {
    const cats = new Set(currentSources.map((s) => s.category).filter(Boolean));
    return ['all', ...cats];
  }, [currentSources]);

  // 过滤与排序
  const filteredSources = useMemo(() => {
    return currentSources
      .filter((s) => {
        if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            s.name.toLowerCase().includes(q) ||
            s.url.toLowerCase().includes(q) ||
            (s.category && s.category.toLowerCase().includes(q));
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOrder.column === 'name') {
          return sortOrder.asc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        }
        if (sortOrder.column === 'weight') {
          const wa = a.weight ?? 90;
          const wb = b.weight ?? 90;
          return sortOrder.asc ? wa - wb : wb - wa;
        }
        return 0;
      });
  }, [currentSources, categoryFilter, searchQuery, sortOrder]);

  const totalPages = Math.ceil(filteredSources.length / pageSize) || 1;
  const paginatedSources = filteredSources.slice((page - 1) * pageSize, page * pageSize);

  // 启停信源（真实调用后端 PUT /api/live/sources/:id）
  const handleToggleSwitch = async (id) => {
    const target = currentSources.find((s) => s.id === id);
    if (!target) return;
    try {
      const nextEnabled = !target.enabled;
      await saveLiveSource(
        {
          name: target.name,
          url: target.url,
          kind: target.kind || 'rss',
          category: target.category,
          enabled: nextEnabled,
        },
        id,
      );
      setLiveSources((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: nextEnabled } : s)));
      notify(nextEnabled ? `已启用「${target.name}」轮询抓取` : `已暂停「${target.name}」轮询`);
    } catch (e) {
      notify(`更新信源状态失败: ${e.message}`);
    }
  };

  // 单个信源连通性测试
  const handleTestSingleSource = async (source) => {
    setTestingSourceId(source.id);
    notify(`正在探测信源「${source.name}」网络连通性...`);
    try {
      const res = await testLiveSource({
        name: source.name,
        url: source.url,
        kind: source.kind || 'rss',
        category: source.category,
        enabled: source.enabled,
      });
      notify(
        `✅「${source.name}」连接正常：检测到 ${res.itemCount} 篇近期文章 (${res.durationMs}ms)`,
      );
    } catch (e) {
      notify(`❌「${source.name}」连接失败: ${e.message}`);
    } finally {
      setTestingSourceId(null);
    }
  };

  // 删除信源（真实调用 DELETE /api/live/sources/:id）
  const handleDeleteSource = async (id) => {
    const target = currentSources.find((s) => s.id === id);
    try {
      await deleteLiveSource(id);
      setLiveSources((prev) => prev.filter((s) => s.id !== id));
      notify(`已从本地 SQLite 数据库移除「${target?.name || id}」`);
    } catch (e) {
      notify(`移除信源失败: ${e.message}`);
    }
  };

  // 表单 URL 连通性测试
  const handleTestFormSource = async () => {
    setFormError('');
    setFormTestResult(null);
    if (!form.url.trim()) {
      setFormError('请先输入 RSS 订阅地址。');
      return;
    }
    let parsedUrl;
    try {
      parsedUrl = new URL(form.url.trim());
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        setFormError('URL 仅支持 http:// 或 https:// 协议。');
        return;
      }
    } catch {
      setFormError('请输入有效的 URL 地址。');
      return;
    }
    setFormTesting(true);
    try {
      const res = await testLiveSource({
        name: form.name.trim() || '测试信源',
        url: parsedUrl.href,
        kind: 'rss',
        category: form.category,
        enabled: true,
      });
      setFormTestResult({
        success: true,
        message: `连通成功！检测到 ${res.itemCount} 篇有效条目 (${res.durationMs}ms)`,
      });
      if (!form.name.trim() && res.title) {
        setForm((prev) => ({ ...prev, name: res.title }));
      }
    } catch (err) {
      setFormTestResult({
        success: false,
        message: `连通失败: ${err.message}`,
      });
    } finally {
      setFormTesting(false);
    }
  };

  // 提交新增信源（真实调用 POST /api/live/sources）
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) {
      setFormError('请填写信源名称。');
      return;
    }
    let parsedUrl;
    try {
      parsedUrl = new URL(form.url.trim());
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        setFormError('URL 仅支持 http:// 或 https:// 协议。');
        return;
      }
    } catch {
      setFormError('请输入有效的 RSS 订阅 URL 地址。');
      return;
    }

    if (currentSources.some((s) => s.url === parsedUrl.href)) {
      setFormError('该订阅地址已存在于信源库中。');
      return;
    }

    try {
      const newSource = await saveLiveSource({
        name: form.name.trim(),
        url: parsedUrl.href,
        kind: 'rss',
        category: form.category,
        enabled: true,
      });
      setLiveSources((prev) => [newSource, ...prev]);
      setForm(blankSource);
      setFormTestResult(null);
      notify(`已成功新增信源「${newSource.name}」并写入本地 SQLite 库`);
    } catch (err) {
      setFormError(err.message || '新增信源失败');
    }
  };

  // 一键初始化预装推荐信源包
  const handleSeedDefaults = async (customList) => {
    try {
      const listToSeed = (customList || initialSources).map((s) => ({
        name: s.name,
        url: s.url,
        kind: 'rss',
        category: s.category || 'AI 算法与模型',
        enabled: true,
      }));
      notify(`正在向本地 SQLite 灌入 ${listToSeed.length} 个权威信源...`);
      await seedLiveSources(listToSeed);
      await loadLiveSources();
      notify(`🎉 成功装载 ${listToSeed.length} 个经典一手信源！`);
    } catch (e) {
      notify(`装载推荐信源失败: ${e.message}`);
    }
  };

  // 立即触发全量抓取 (Fetch All)
  const handleStartFetch = async () => {
    if (fetchJob && fetchJob.state === 'running') return;
    try {
      notify('正在启动全量 RSS 抓取与研判聚合引擎...');
      const job = await startFetchJob({});
      setFetchJob(job);

      const timer = setInterval(async () => {
        try {
          const current = await getLiveJob(job.id);
          setFetchJob(current);
          if (current.state !== 'running') {
            clearInterval(timer);
            const st = await getLiveStatus();
            if (st?.lastFetchSuccessAt) setLastFetchSuccessAt(st.lastFetchSuccessAt);
            if (current.state === 'completed') {
              notify(
                `🎉 抓取完成！新增 ${current.new_count || 0} 篇材料，更新 ${current.updated_count || 0} 条事件`,
              );
            } else if (current.state === 'partial') {
              notify(
                `⚠️ 抓取完成（部分信源超时）：成功 ${current.succeeded} 个，失败 ${current.failed} 个`,
              );
            } else {
              notify(`❌ 抓取任务失败: ${current.error || '部分网络源异常'}`);
            }
          }
        } catch {
          clearInterval(timer);
        }
      }, 800);
    } catch (err) {
      notify(`无法启动抓取任务: ${err.message}`);
    }
  };

  // 导出 OPML
  const handleExportOpml = () => {
    const outlines = currentSources
      .map(
        (s) =>
          `    <outline text="${s.name}" title="${s.name}" type="rss" xmlUrl="${s.url}" category="${s.category}"/>`,
      )
      .join('\n');
    const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Signal Desk Feeds</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
  </head>
  <body>
${outlines}
  </body>
</opml>`;
    downloadText('signal-desk-sources.opml', opml, 'text/xml');
    notify('已导出 OPML 订阅文件');
  };

  // 导入 OPML
  const handleImportOpml = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result;
        const matches = [...text.matchAll(/<outline[^>]+xmlUrl=["']([^"']+)["'][^>]*>/gi)];
        if (!matches.length) {
          notify('未能从 OPML 文件中解析到有效订阅源');
          return;
        }
        const newFeeds = [];
        for (const m of matches) {
          const raw = m[0];
          const urlMatch = raw.match(/xmlUrl=["']([^"']+)["']/i);
          const titleMatch = raw.match(/(title|text)=["']([^"']+)["']/i);
          if (urlMatch) {
            const url = urlMatch[1];
            const name = titleMatch ? titleMatch[2] : '导入信源';
            if (
              !currentSources.some((s) => s.url === url) &&
              !newFeeds.some((s) => s.url === url)
            ) {
              newFeeds.push({
                name,
                url,
                kind: 'rss',
                category: '宏观策略与独家',
                enabled: true,
              });
            }
          }
        }
        if (newFeeds.length) {
          await seedLiveSources(newFeeds);
          await loadLiveSources();
          notify(`成功从 OPML 导入 ${newFeeds.length} 个新信源！`);
        } else {
          notify('所有信源已存在，无新导入条目');
        }
      } catch {
        notify('解析 OPML 文件失败');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto pb-12 select-none">
      {/* 隐藏的 OPML 文件上传 input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".opml,.xml"
        onChange={handleImportOpml}
        className="hidden"
      />

      {/* 页面面包屑与定位 */}
      <div className="flex items-center gap-2 text-xs font-mono text-muted">
        <span>系统设置</span>
        <span>/</span>
        <span className="text-ink font-semibold">
          {activeTab === 'rss'
            ? '信源与抓取管理'
            : activeTab === 'podcasts'
              ? '播客与长视频频道'
              : activeTab === 'llm'
                ? 'AI 研判模型调度'
                : '通用偏好与本地服务'}
        </span>
      </div>

      {/* 单行水平操作栏 (对齐 signal_desk_6) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-3">
        {/* 左侧次级分类切换胶囊 */}
        <div className="flex items-center gap-1.5 bg-surface rounded-lg p-1 border border-hairline overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('rss')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs ${
              activeTab === 'rss'
                ? 'bg-surface-card text-ink border border-hairline'
                : 'text-muted hover:text-ink'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-primary">rss_feed</span>
            <span>RSS 信源管理 ({currentSources.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('podcasts')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'podcasts'
                ? 'bg-surface-card text-ink border border-hairline shadow-2xs'
                : 'text-muted hover:text-ink'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">podcasts</span>
            <span>播客与长视频 ({podcasts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('llm')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'llm'
                ? 'bg-surface-card text-ink border border-hairline shadow-2xs'
                : 'text-muted hover:text-ink'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">psychology</span>
            <span>AI 研判模型调度</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'general'
                ? 'bg-surface-card text-ink border border-hairline shadow-2xs'
                : 'text-muted hover:text-ink'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>通用与本地服务偏好</span>
          </button>
        </div>

        {/* 右侧紧凑功能按钮 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSeedDefaults(legacySources)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface border border-hairline text-body text-xs font-medium shadow-2xs transition-colors"
            title="重置并载入系统预装的 50 个完整优质信源库至 SQLite"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">history</span>
            <span>加载全部 50 个经典信源</span>
          </button>

          <button
            type="button"
            onClick={handleExportOpml}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface border border-hairline text-body text-xs font-medium shadow-2xs transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-muted">download</span>
            <span>导出 OPML</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface border border-hairline text-body text-xs font-medium shadow-2xs transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-muted">upload</span>
            <span>导入 OPML</span>
          </button>

          <button
            type="button"
            onClick={() => document.getElementById('quick-add-name')?.focus()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>新增信源</span>
          </button>
        </div>
      </div>

      {/* Tab 1: RSS 信源管理 (对齐 signal_desk_6 三列数据表) */}
      {activeTab === 'rss' && (
        <div className="space-y-4">
          {/* 全局抓取调度与引擎状态控制卡 */}
          <div className="p-4 rounded-xl bg-surface-card border border-hairline shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${fetchJob?.state === 'running' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}
                />
                <span className="text-xs font-bold text-ink">
                  {fetchJob?.state === 'running' ? '后台抓取任务进行中...' : '本地抓取引擎就绪'}
                </span>
                <span className="text-muted text-[11px]">·</span>
                <span className="text-[11px] text-muted">
                  已启用{' '}
                  <strong className="text-ink font-semibold">
                    {currentSources.filter((s) => s.enabled).length}
                  </strong>{' '}
                  / {currentSources.length} 个信源
                </span>
                {lastFetchSuccessAt && (
                  <span className="text-[11px] text-muted font-mono">
                    · 最近一次成功同步: {displayTime(lastFetchSuccessAt)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                使用本地独立 SQLite 与受限网络抓取器，对启用的 RSS
                进行增量读取、事件相似度计算与研判聚合。
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => handleSeedDefaults(currentRole?.sources || initialSources)}
                className="px-3 py-1.5 rounded-lg border border-primary/40 bg-amber-50 text-primary text-xs font-semibold hover:bg-amber-100 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="向本地 SQLite 信源库装载当前角色精选或权威推荐源"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>装载「{currentRole?.name || '推荐'}」信源包</span>
              </button>

              <button
                type="button"
                onClick={handleStartFetch}
                disabled={fetchJob && fetchJob.state === 'running'}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <span
                  className={`material-symbols-outlined text-[16px] ${fetchJob?.state === 'running' ? 'animate-spin' : ''}`}
                >
                  {fetchJob?.state === 'running' ? 'sync' : 'refresh'}
                </span>
                <span>
                  {fetchJob?.state === 'running'
                    ? `正在抓取 (${fetchJob.done || 0}/${fetchJob.total || currentSources.filter((s) => s.enabled).length})...`
                    : '立即全量抓取 (Fetch)'}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* 左侧 8 列主表格 */}
            <div className="xl:col-span-8 space-y-4">
              {/* 当前角色专属订阅源包横幅 */}
              <div className="p-3.5 rounded-xl bg-[#faf5ec] border border-primary/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full ${currentRole?.avatarBg || 'bg-primary'} text-white flex items-center justify-center font-serif font-bold text-xs shadow-xs`}
                  >
                    {currentRole?.short || '析'}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-serif font-semibold text-ink">
                        当前研读身份：{currentRole?.name}
                      </span>
                      <span className="text-[10px] font-mono text-primary font-bold bg-amber-100 px-1.5 py-0.5 rounded">
                        {currentRole?.bundleName}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#57534e]">{currentRole?.description}</p>
                  </div>
                </div>

                {/* 快捷角色切换胶囊 */}
                <div className="flex items-center gap-1 shrink-0 overflow-x-auto">
                  <span className="text-[10.5px] text-muted font-mono hidden md:inline mr-1">
                    切包:
                  </span>
                  {roles?.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={async () => {
                        await switchRole(r.id);
                        await loadLiveSources();
                      }}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                        r.id === currentRole?.id
                          ? 'bg-primary text-white font-semibold shadow-2xs'
                          : 'bg-surface hover:bg-[#f4efe6] text-muted hover:text-ink border border-hairline'
                      }`}
                    >
                      {r.short} {r.name.slice(0, 2)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 过滤器行 */}
              <div className="flex items-center justify-between gap-3 flex-wrap bg-surface-card border border-hairline rounded-xl px-4 py-2.5 shadow-2xs">
                <div className="flex items-center gap-1 bg-[#fbf9f5] rounded-lg p-0.5 text-xs overflow-x-auto border border-hairline max-w-full">
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setCategoryFilter(cat);
                        setPage(1);
                      }}
                      className={`px-2.5 py-1 rounded text-xs whitespace-nowrap transition-all ${
                        categoryFilter === cat
                          ? 'bg-white text-ink font-semibold shadow-2xs'
                          : 'text-muted hover:text-ink'
                      }`}
                    >
                      {cat === 'all' ? '全部' : cat}
                    </button>
                  ))}
                </div>

                {/* 行内即时搜索 */}
                <div className="relative flex-1 max-w-xs min-w-[180px]">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[15px] text-muted">
                    filter_alt
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder="当前分类内过滤..."
                    className="w-full bg-[#fbf9f5] focus:bg-white border border-hairline rounded-lg pl-8 pr-7 py-1 text-xs text-ink placeholder:text-muted focus:outline-none focus:border-primary transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                    >
                      <span className="material-symbols-outlined text-[13px]">close</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 精选高效三列数据表 (54% / 26% / 20%) */}
              <div className="bg-surface-card border border-hairline rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-body border-collapse">
                    <colgroup>
                      <col style={{ width: '54%' }} />
                      <col style={{ width: '26%' }} />
                      <col style={{ width: '20%' }} />
                    </colgroup>
                    <thead className="bg-[#fbf9f5] border-b border-hairline text-muted font-mono uppercase tracking-wider text-[11px]">
                      <tr>
                        <th
                          onClick={() => setSortOrder({ column: 'name', asc: !sortOrder.asc })}
                          className="py-3 pl-4 pr-3 font-semibold hover:text-ink cursor-pointer select-none"
                        >
                          <div className="inline-flex items-center gap-1">
                            <span>信源信息 &amp; 订阅协议</span>
                            <span className="material-symbols-outlined text-[14px]">
                              unfold_more
                            </span>
                          </div>
                        </th>
                        <th className="py-3 px-3 font-semibold text-muted">
                          <span>分类与层级</span>
                        </th>
                        <th
                          onClick={() => setSortOrder({ column: 'weight', asc: !sortOrder.asc })}
                          className="py-3 pr-4 pl-3 font-semibold text-right hover:text-ink cursor-pointer select-none"
                        >
                          <div className="inline-flex items-center justify-end gap-1 w-full">
                            <span>启停 / 操作</span>
                            <span className="material-symbols-outlined text-[14px]">
                              unfold_more
                            </span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {paginatedSources.map((source) => (
                        <tr key={source.id} className="hover:bg-[#fcfbf9] transition-colors group">
                          {/* 54% 列：信源信息 & 协议 */}
                          <td className="py-3 pl-4 pr-3 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg text-primary bg-amber-500/10 font-bold text-xs flex items-center justify-center border border-hairline shrink-0 shadow-2xs font-mono">
                                {source.name.slice(0, 1).toUpperCase()}
                              </div>
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-ink text-xs truncate max-w-[180px]">
                                    {source.name}
                                  </span>
                                  <span className="px-1.5 py-[1px] rounded bg-surface font-mono text-[10px] text-muted inline-flex items-center border border-hairline">
                                    RSS 2.0
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-muted">
                                  <span className="truncate font-mono max-w-[200px]">
                                    {source.url}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(source.url);
                                      notify(`已复制「${source.name}」的 RSS 链接`);
                                    }}
                                    className="hover:text-primary p-0.5 text-muted transition-colors"
                                    title="复制订阅链接"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">
                                      content_copy
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 26% 列：分类与层级 */}
                          <td className="py-3 px-3 align-middle">
                            <div className="space-y-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface text-body text-[11px] font-medium border border-hairline">
                                {source.category}
                              </span>
                              <div className="text-[10px] text-muted font-mono flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                <span>权重 {source.weight}% · 核心源</span>
                              </div>
                            </div>
                          </td>

                          {/* 20% 列：启停 / 操作 */}
                          <td className="py-3 pr-4 pl-3 text-right align-middle">
                            <div className="flex items-center justify-end gap-2">
                              {/* Switch 开关 */}
                              <button
                                type="button"
                                onClick={() => handleToggleSwitch(source.id)}
                                className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer ${
                                  source.enabled ? 'bg-primary' : 'bg-hairline'
                                }`}
                                title={source.enabled ? '点击停用轮询' : '点击启用轮询'}
                              >
                                <span
                                  className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform ${
                                    source.enabled ? 'translate-x-3.5' : 'translate-x-0'
                                  }`}
                                />
                              </button>

                              <button
                                type="button"
                                disabled={testingSourceId === source.id}
                                onClick={() => handleTestSingleSource(source)}
                                className="p-1 rounded text-muted hover:text-primary transition-colors disabled:opacity-50 cursor-pointer"
                                title="立即测试连接并探测健康度"
                              >
                                <span
                                  className={`material-symbols-outlined text-[16px] ${testingSourceId === source.id ? 'animate-spin text-primary' : ''}`}
                                >
                                  sync
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteSource(source.id)}
                                className="p-1 rounded text-muted hover:text-error transition-colors cursor-pointer"
                                title="移除此信源"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  delete
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 多页分页控制器 */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-hairline text-xs text-muted font-mono bg-[#fbf9f5]">
                  <span>
                    共 {filteredSources.length} 条订阅 · 第 {page} / {totalPages} 页
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-2.5 py-1 rounded border border-hairline bg-surface-card hover:bg-surface disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      上一页
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="px-2.5 py-1 rounded border border-hairline bg-surface-card hover:bg-surface disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧 4 列：快速登记新信源抽屉面板 */}
            <div className="xl:col-span-4 bg-surface-card border border-hairline rounded-xl p-5 shadow-2xs space-y-4">
              <div className="border-b border-hairline pb-2.5">
                <h2 className="text-sm font-bold text-ink flex items-center gap-1.5 font-serif">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    add_circle
                  </span>
                  <span>快速登记新信源</span>
                </h2>
                <p className="text-muted text-[11px] mt-0.5">
                  支持标准 RSS 2.0、Atom 与 Substack 专有订阅源
                </p>
              </div>

              {formError && (
                <div className="p-2.5 bg-error-container text-on-error-container text-xs rounded-lg border border-red-200">
                  {formError}
                </div>
              )}

              {formTestResult && (
                <div
                  className={`p-2.5 text-xs rounded-lg border leading-relaxed ${
                    formTestResult.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  {formTestResult.message}
                </div>
              )}

              <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-ink font-medium mb-1">信源名称</label>
                  <input
                    id="quick-add-name"
                    type="text"
                    placeholder="例如：SemiAnalysis"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full p-2 rounded-lg border border-hairline bg-[#fbf9f5] focus:bg-white text-ink placeholder:text-muted focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-ink font-medium mb-1">
                    订阅地址 (RSS / Atom URL)
                  </label>
                  <input
                    type="text"
                    placeholder="https://example.com/feed.xml"
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    className="w-full p-2 rounded-lg border border-hairline bg-[#fbf9f5] focus:bg-white text-ink placeholder:text-muted focus:outline-none focus:border-primary transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-ink font-medium mb-1">所属分类主题</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full p-2 rounded-lg border border-hairline bg-[#fbf9f5] focus:bg-white text-ink focus:outline-none focus:border-primary transition-all"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-ink font-medium">情报权重</label>
                    <span className="font-mono text-primary font-semibold">{form.weight}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestFormSource}
                    disabled={formTesting}
                    className="flex-1 py-2 bg-surface hover:bg-[#f2ece2] text-ink border border-hairline text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <span
                      className={`material-symbols-outlined text-[15px] ${formTesting ? 'animate-spin text-primary' : ''}`}
                    >
                      {formTesting ? 'sync' : 'network_check'}
                    </span>
                    <span>{formTesting ? '探测中...' : '测试连接'}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-[2] py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>{saving ? '写入中...' : '保存入库'}</span>
                  </button>
                </div>
              </form>

              {/* 预设信源包推荐 */}
              <div className="pt-4 border-t border-hairline space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[17px]">
                      package_2
                    </span>
                    <h3 className="text-xs font-bold text-ink">经典情报包快捷装载</h3>
                  </div>
                  <span className="text-[10px] font-mono text-primary bg-amber-500/10 px-1.5 py-0.5 rounded">
                    一键灌库
                  </span>
                </div>
                <div className="space-y-2">
                  <div
                    role="button"
                    onClick={() => {
                      const aiFeeds = legacySources.filter((s) => s.category === 'AI 算法与模型');
                      handleSeedDefaults(aiFeeds);
                    }}
                    className="p-2.5 rounded-lg border border-hairline hover:border-primary/40 hover:bg-[#faf5ec] cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-ink text-xs group-hover:text-primary transition-colors">
                          顶尖大模型工程团队包
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-primary text-[10px]">
                          AI核心
                        </span>
                      </div>
                      <div className="text-[11px] text-muted">
                        OpenAI, Anthropic, DeepSeek, Google 等 17 个源
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-muted group-hover:text-primary transition-colors">
                      add
                    </span>
                  </div>

                  <div
                    role="button"
                    onClick={() => {
                      const semiFeeds = legacySources.filter(
                        (s) => s.category === '硬科技与半导体',
                      );
                      handleSeedDefaults(semiFeeds);
                    }}
                    className="p-2.5 rounded-lg border border-hairline hover:border-primary/40 hover:bg-[#faf5ec] cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-ink text-xs group-hover:text-primary transition-colors">
                          半导体先进制造情报包
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-surface text-body text-[10px]">
                          硬件生态
                        </span>
                      </div>
                      <div className="text-[11px] text-muted">
                        SemiAnalysis, TSMC, ASML, Nvidia 等 19 个源
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-muted group-hover:text-primary transition-colors">
                      add
                    </span>
                  </div>

                  <div
                    role="button"
                    onClick={() => {
                      const macroFeeds = legacySources.filter(
                        (s) => s.category === '宏观策略与独家',
                      );
                      handleSeedDefaults(macroFeeds);
                    }}
                    className="p-2.5 rounded-lg border border-hairline hover:border-primary/40 hover:bg-[#faf5ec] cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-ink text-xs group-hover:text-primary transition-colors">
                          宏观策略与政策内幕包
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-surface text-body text-[10px]">
                          商业策略
                        </span>
                      </div>
                      <div className="text-[11px] text-muted">
                        Stratechery, SEC, Goldman, FT 等 14 个源
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-muted group-hover:text-primary transition-colors">
                      add
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: 播客与长视频频道 */}
      {activeTab === 'podcasts' && (
        <div className="bg-surface-card border border-hairline rounded-xl p-5 shadow-2xs space-y-4">
          <div className="border-b border-hairline pb-2 flex items-center justify-between">
            <div>
              <h2 className="text-base font-serif font-bold text-ink">播客与长视频监测台</h2>
              <p className="text-xs text-muted">监控已接入的深度科技访谈与长视频一手原声</p>
            </div>
            <button
              onClick={() => notify('已触发播客信道全局健康探测')}
              className="px-3 py-1.5 bg-surface text-ink hover:bg-[#fbf9f5] border border-hairline rounded-lg text-xs font-medium"
            >
              健康巡检
            </button>
          </div>

          <div className="divide-y divide-hairline">
            {podcasts.map((pod) => (
              <div key={pod.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-accent-teal flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[18px]">podcasts</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-ink">{pod.name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-surface text-[10px] font-mono text-muted border border-hairline">
                        {pod.platform}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted">
                      {pod.category} · {pod.freq}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setPodcasts(
                        podcasts.map((p) => (p.id === pod.id ? { ...p, enabled: !p.enabled } : p)),
                      );
                      notify(`已更新「${pod.name}」监听状态`);
                    }}
                    className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer ${
                      pod.enabled ? 'bg-primary' : 'bg-hairline'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform ${
                        pod.enabled ? 'translate-x-3.5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: AI 研判模型调度 */}
      {activeTab === 'llm' && (
        <div className="bg-surface-card border border-hairline rounded-xl p-5 shadow-2xs space-y-4">
          <div className="border-b border-hairline pb-2">
            <h2 className="text-base font-serif font-bold text-ink">AI 研判模型与本地调度</h2>
            <p className="text-xs text-muted">配置交叉核验、观点解构与事实提取的推理引擎</p>
          </div>
          <div className="space-y-3 text-xs text-body">
            <div className="p-3.5 rounded-lg bg-[#fbf9f5] border border-hairline space-y-1">
              <div className="font-semibold text-ink flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <span>本地 Codex / CLI 只读研究代理已连接</span>
              </div>
              <p className="text-muted text-[11.5px]">
                优先在本地安全沙箱执行长视频与长文本抓取研读，不向外部泄露私有数据。
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-surface border border-hairline space-y-1">
              <div className="font-semibold text-ink">结构化解构规范</div>
              <p className="text-muted text-[11.5px]">
                自动对入库情报执行【客观事实】、【来源观点】与【模型推断】三级拆解并对齐时间线。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: 通用与本地服务偏好 */}
      {activeTab === 'general' && (
        <div className="bg-surface-card border border-hairline rounded-xl p-5 shadow-2xs space-y-4">
          <div className="border-b border-hairline pb-2">
            <h2 className="text-base font-serif font-bold text-ink">本地服务运行偏好</h2>
            <p className="text-xs text-muted">本地持久化数据库与离线安全策略</p>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg border border-hairline bg-[#fbf9f5]">
              <div>
                <span className="font-semibold text-ink block">本地 HTTP 端口</span>
                <span className="text-muted text-[11px]">当前绑定 127.0.0.1:8080</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-success/10 text-success font-mono font-bold">
                8080 ACTIVE
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-hairline bg-[#fbf9f5]">
              <div>
                <span className="font-semibold text-ink block">存储驱动</span>
                <span className="text-muted text-[11px]">SQLite 3 · 本地零云端遥测</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono font-bold">
                READY
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
