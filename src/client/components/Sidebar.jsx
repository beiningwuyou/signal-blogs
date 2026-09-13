import { NavLink, Link } from 'react-router-dom';
import { routeMap } from '../data/catalog.js';
import { useWorkspace } from '../state.jsx';
import { SignalDeskLogo, Icon } from './UI.jsx';

export function Sidebar({ open, onClose }) {
  const { entries, health, checkHealth } = useWorkspace();
  const count = Object.entries(entries).filter(
    ([id, value]) => id !== 'preferences' && value.bookmarked,
  ).length;

  const intelligenceRoutes = routeMap.filter((r) => r.group === '情报研读' && !r.hiddenInNav);
  const publicRoutes = routeMap.filter((r) => r.group === '公共广场' && !r.hiddenInNav);
  const brainRoutes = routeMap.filter((r) => r.group === '第二大脑' && !r.hiddenInNav);

  const renderNavItem = (route) => (
    <NavLink
      key={route.path}
      to={route.path}
      onClick={onClose}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150 ${
          isActive
            ? 'bg-amber-500/10 text-primary font-semibold border-l-2 border-primary shadow-2xs'
            : 'text-body hover:bg-surface hover:text-ink'
        }`
      }
    >
      {route.materialIcon ? (
        <span
          className="material-symbols-outlined text-[18px]"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
        >
          {route.materialIcon}
        </span>
      ) : (
        <Icon name={route.icon} size={18} />
      )}
      <span>{route.label}</span>
      {route.path === '/reading' && (
        <span
          id="savedReadCountBadge"
          className="ml-auto text-[10px] bg-[#ebe5dc] group-hover:bg-amber-100 group-hover:text-amber-900 text-muted font-mono px-1.5 py-0.5 rounded transition-colors"
        >
          {count}
        </span>
      )}
      {route.badge && (
        <span className="ml-auto text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-mono font-bold leading-none shadow-2xs">
          {route.badge}
        </span>
      )}
    </NavLink>
  );

  return (
    <>
      {open && (
        <button
          className="fixed inset-0 bg-ink/20 z-40 md:hidden backdrop-blur-xs"
          aria-label="关闭导航"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed left-0 top-0 h-full w-60 shrink-0 border-r border-hairline bg-[#faf6f1] flex flex-col justify-between select-none z-50 transition-transform duration-200 md:translate-x-0 ${
          open ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
        aria-label="主导航"
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo 顶栏 */}
          <div className="h-14 px-4 border-b border-hairline flex items-center justify-between shrink-0 bg-[#faf6f1]">
            <Link
              to="/personal"
              onClick={onClose}
              className="flex items-center gap-2.5 text-ink group focus:outline-none select-none"
            >
              <SignalDeskLogo className="w-6 h-6 text-primary" />
              <span className="text-ink font-serif font-semibold tracking-tight text-[16px] leading-none">
                Signal Desk
              </span>
            </Link>
          </div>

          {/* 导航分组 */}
          <div className="p-3 flex flex-col gap-3.5 overflow-y-auto flex-1">
            {/* 1. 情报研读 */}
            <div className="space-y-0.5">
              <div className="px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-muted font-semibold flex items-center justify-between">
                <span>情报研读</span>
                <span className="text-[10px] text-amber-600/70 font-normal">Personal</span>
              </div>
              {intelligenceRoutes.map(renderNavItem)}
            </div>

            {/* 2. 公共广场 */}
            <div className="space-y-0.5 pt-2 border-t border-hairline/60">
              <div className="px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-muted font-semibold flex items-center justify-between">
                <span>公共广场</span>
                <span className="text-[10px] text-stone-500 font-normal">Public</span>
              </div>
              {publicRoutes.map(renderNavItem)}
            </div>

            {/* 3. 第二大脑 */}
            <div className="space-y-0.5 pt-2 border-t border-hairline/60">
              <div className="px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-muted font-semibold flex items-center justify-between">
                <span>第二大脑</span>
                <span className="text-[10px] text-amber-600/70 font-normal">Thesis Memory</span>
              </div>
              {brainRoutes.map(renderNavItem)}
            </div>
          </div>
        </div>

        {/* 底部系统卡片与设置 */}
        <div className="p-3 border-t border-hairline flex flex-col gap-2 bg-[#fcf9f6]">
          <button
            id="status"
            type="button"
            data-state={health}
            onClick={checkHealth}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-[#f7f3ec] border border-hairline text-left hover:border-hairline-strong transition-all focus:outline-none"
            title="点击重新检测本地服务状态"
          >
            <span className="relative flex size-2 shrink-0">
              {health === 'ready' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full size-2 ${
                  health === 'ready'
                    ? 'bg-success'
                    : health === 'loading'
                      ? 'bg-warning animate-pulse'
                      : 'bg-error'
                }`}
              />
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-semibold text-ink leading-tight truncate">
                {health === 'ready'
                  ? '本地服务运行中'
                  : health === 'loading'
                    ? '检查服务中…'
                    : '服务未连接'}
              </span>
              <span className="text-[10px] text-muted font-mono leading-tight mt-0.5 truncate">
                {health === 'ready'
                  ? '端口: 8080 · 双向同步'
                  : health === 'loading'
                    ? '正在探测端口 8080'
                    : '点击重试连接'}
              </span>
            </div>
          </button>

          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors duration-150 ${
                isActive
                  ? 'bg-amber-500/10 text-primary font-semibold border-l-2 border-primary'
                  : 'text-muted hover:text-ink hover:bg-surface'
              }`
            }
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
            <span>系统设置</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}
