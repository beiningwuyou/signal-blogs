import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { articles, articleUrl, routeMap } from '../data/catalog.js';
import { useWorkspace } from '../state.jsx';
import { Sidebar } from './Sidebar.jsx';
import { AudioBar } from './AudioBar.jsx';
import { EmptyState, Icon, IconButton } from './UI.jsx';
import { trapDialogFocus } from './dialog.js';

export function Layout() {
  const [navOpen, setNavOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchDialog = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    preferences,
    update,
    entries,
    error,
    retry,
    toast,
    ready,
    saving,
    currentRole,
    roles,
    switchRole,
  } = useWorkspace();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const roleMenuRef = useRef(null);

  // 点击外部关闭角色弹窗
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target)) {
        setRoleMenuOpen(false);
      }
    };
    if (roleMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [roleMenuOpen]);

  useEffect(() => {
    const shortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchDialog.current?.showModal();
      }
    };
    document.addEventListener('keydown', shortcut);
    return () => document.removeEventListener('keydown', shortcut);
  }, []);

  const results = articles.filter((article) =>
    `${article.title} ${article.source || ''} ${article.body} ${entries[article.id]?.note || ''}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-canvas text-body font-body selection:bg-amber-100 selection:text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1.5 focus:bg-primary focus:text-white focus:rounded focus:shadow-md"
      >
        跳转至正文
      </a>

      {/* 左侧侧栏 */}
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      {/* 主内容区域 (偏移 240px 侧栏) */}
      <div className="md:pl-60 flex flex-col min-h-screen">
        {/* 全局顶栏 */}
        <header className="h-14 sticky top-0 z-40 bg-[#fcf9f6]/95 backdrop-blur-md border-b border-hairline flex items-center justify-between px-4 md:px-8 w-full select-none">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            {/* 移动端汉堡菜单 */}
            <button
              type="button"
              className="md:hidden p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface transition-colors"
              onClick={() => setNavOpen(!navOpen)}
              aria-label="打开菜单"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>

            {/* ⌘K 全局搜索框 */}
            <button
              type="button"
              className="flex items-center w-full max-w-sm bg-surface-card/70 hover:bg-surface-card transition-all rounded-lg px-3 py-1.5 border border-hairline hover:border-hairline-strong text-muted text-xs shadow-2xs group focus:outline-none"
              onClick={() => searchDialog.current?.showModal()}
            >
              <span className="material-symbols-outlined text-[16px] mr-2 text-muted group-hover:text-primary transition-colors">
                search
              </span>
              <span className="text-muted-soft select-none flex-1 text-left truncate">
                搜索事件、信源、笔记...
              </span>
              <kbd className="font-mono text-[10px] px-1.5 py-0.5 bg-surface rounded border border-hairline text-muted shadow-2xs">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* 顶栏右侧功能区 */}
          <div className="flex items-center gap-2 md:gap-3">
            <button
              type="button"
              className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-body hover:bg-surface transition-colors"
              title="当前仅支持简体中文"
            >
              <span className="material-symbols-outlined text-[15px] text-muted">translate</span>
              <span>简体中文</span>
            </button>

            <button
              type="button"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface transition-colors"
              onClick={() => update('preferences', { dark: !preferences.dark })}
              disabled={!ready}
              aria-label="切换阅读主题"
              title="切换阅读主题"
            >
              <span className="material-symbols-outlined text-[18px]">
                {preferences.dark ? 'dark_mode' : 'light_mode'}
              </span>
            </button>

            <div className="h-4 w-[1px] bg-hairline hidden sm:block" />

            {/* 角色切换交互按钮与订阅包下拉菜单 */}
            <div className="relative" ref={roleMenuRef}>
              <button
                type="button"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg hover:bg-surface border border-transparent hover:border-hairline cursor-pointer transition-all duration-150 select-none group focus:outline-none"
                title="点击切换工作台角色与订阅源包"
                aria-expanded={roleMenuOpen}
              >
                <div
                  className={`w-7 h-7 rounded-full ${currentRole?.avatarBg || 'bg-primary'} text-white flex items-center justify-center text-xs font-serif font-bold shadow-2xs group-hover:scale-105 transition-transform`}
                >
                  {currentRole?.short || '析'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-ink leading-tight group-hover:text-primary transition-colors">
                    {currentRole?.name || '首席分析师'}
                  </span>
                  <span className="text-[10px] text-muted leading-tight font-mono">
                    {currentRole?.tagline || '工作台'}
                  </span>
                </div>
                <span
                  className={`material-symbols-outlined text-[16px] text-muted transition-transform duration-200 ${roleMenuOpen ? 'rotate-180 text-primary' : ''}`}
                >
                  expand_more
                </span>
              </button>

              {/* 角色与专属 RSS 订阅源包下拉抽屉面板 */}
              {roleMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface-card rounded-2xl border border-hairline shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 select-none">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-hairline px-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-serif font-semibold text-ink">
                      <span className="material-symbols-outlined text-[16px] text-primary">
                        badge
                      </span>
                      <span>切换研读角色与信源预设</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted bg-[#f4efe6] px-1.5 py-0.5 rounded">
                      5 个角色预设
                    </span>
                  </div>

                  {/* 角色列表 */}
                  <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-0.5">
                    {roles?.map((r) => {
                      const isSelected = r.id === currentRole?.id;
                      return (
                        <div
                          key={r.id}
                          onClick={() => {
                            switchRole(r.id);
                            setRoleMenuOpen(false);
                          }}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                            isSelected
                              ? 'bg-[#faf5ec] border-primary ring-1 ring-primary shadow-2xs'
                              : 'bg-surface hover:bg-[#faf7f2] border-hairline hover:border-[#dcd4c6]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-6 h-6 rounded-full ${r.avatarBg} text-white flex items-center justify-center text-[11px] font-serif font-bold shadow-2xs`}
                              >
                                {r.short}
                              </div>
                              <span className="text-xs font-serif font-semibold text-ink">
                                {r.name}
                              </span>
                              <span className="text-[10px] font-mono text-muted">
                                · {r.tagline}
                              </span>
                            </div>

                            {isSelected ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-primary bg-amber-100 px-1.5 py-0.5 rounded">
                                <span className="material-symbols-outlined text-[12px]">check</span>
                                当前活跃
                              </span>
                            ) : (
                              <span className="text-[10.5px] text-primary font-medium opacity-0 group-hover:opacity-100">
                                启用
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-[#57534e] leading-snug line-clamp-2 pl-8">
                            {r.description}
                          </p>

                          <div className="flex items-center justify-between pl-8 pt-1 border-t border-hairline/60 text-[10px] text-muted font-mono">
                            <span className="flex items-center gap-1 text-primary font-medium">
                              <span className="material-symbols-outlined text-[12px]">
                                folder_special
                              </span>
                              <span>{r.bundleName}</span>
                            </span>
                            <span>{r.sources.length} 个 RSS 信源</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-hairline flex items-center justify-between text-[11px] text-muted px-1.5">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      本地 SQLite 双向同步生效
                    </span>
                    <Link
                      to="/settings"
                      onClick={() => setRoleMenuOpen(false)}
                      className="text-primary hover:underline flex items-center gap-0.5 font-medium"
                    >
                      <span>信源中心管理</span>
                      <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 顶部轻量提示条 (数据保存或离线状态) */}
        {error && (
          <div className="px-4 py-2 bg-error-container text-on-error-container text-xs flex items-center justify-between border-b border-red-200">
            <span>{error}</span>
            <button onClick={retry} className="underline font-semibold ml-2">
              重试
            </button>
          </div>
        )}

        {/* 页面主工作区 */}
        <main
          id="main-content"
          className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6"
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>

      {/* 左下角常驻微缩音频条 */}
      <AudioBar />

      {/* 浮动 Toast 通知 */}
      <div
        className={`fixed bottom-6 right-8 z-50 flex items-center gap-2 px-4 py-2.5 bg-surface-dark text-on-dark rounded-xl shadow-xl border border-white/10 transition-all duration-300 ease-out ${
          toast ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'
        }`}
        role="status"
        aria-live="polite"
      >
        <span className="material-symbols-outlined text-warning text-[18px]">bookmark_added</span>
        <span className="text-xs font-medium">{toast}</span>
      </div>

      {/* 全局 ⌘K 搜索弹窗 */}
      <dialog
        ref={searchDialog}
        className="fixed inset-0 m-auto w-full max-w-xl bg-surface-card rounded-xl border border-hairline shadow-2xl p-0 backdrop:bg-ink/30 backdrop:backdrop-blur-xs z-50 select-none overflow-hidden"
        aria-label="全局搜索情报"
        onKeyDown={trapDialogFocus}
        onClick={(event) => {
          if (event.target === event.currentTarget) searchDialog.current?.close();
        }}
      >
        <div className="flex flex-col max-h-[80vh]">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-hairline bg-[#fcf9f6]">
            <span className="material-symbols-outlined text-[18px] text-muted">search</span>
            <input
              autoFocus
              aria-label="全局搜索"
              placeholder="检索研读、信源、概念或笔记…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent border-none text-sm text-ink placeholder:text-muted focus:outline-none"
            />
            <button
              type="button"
              onClick={() => searchDialog.current?.close()}
              className="text-muted hover:text-ink text-xs p-1"
              aria-label="关闭搜索"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div className="px-4 py-2 bg-surface text-[11px] font-mono text-muted border-b border-hairline">
            {search ? `匹配 ${results.length} 篇情报` : '全部研读 · 输入关键词开始检索'}
          </div>

          <div className="p-2 overflow-y-auto space-y-1 max-h-96">
            {results.length ? (
              results.map((article) => (
                <button
                  key={article.id}
                  type="button"
                  onClick={() => {
                    searchDialog.current?.close();
                    navigate(articleUrl(article));
                  }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-surface text-xs transition-colors flex items-center justify-between group"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-[10px] text-muted font-mono truncate">
                      {article.kind === 'daily' ? `${article.date} · 每日早报` : article.source}
                    </span>
                    <span className="font-medium text-ink group-hover:text-primary transition-colors truncate mt-0.5">
                      {article.title}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-muted group-hover:text-primary shrink-0">
                    arrow_forward
                  </span>
                </button>
              ))
            ) : (
              <div className="py-8 text-center text-muted text-xs">
                没有找到匹配的情报，尝试其他关键词
              </div>
            )}
          </div>

          <footer className="px-4 py-2 bg-[#fcf9f6] border-t border-hairline text-[11px] text-muted font-mono flex items-center justify-between">
            <span>搜索范围包含研读、信源及本地笔记</span>
            <kbd className="px-1 py-0.5 bg-surface rounded border border-hairline">Esc 关闭</kbd>
          </footer>
        </div>
      </dialog>
    </div>
  );
}
