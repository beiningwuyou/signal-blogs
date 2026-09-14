import { Link, NavLink, Outlet, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useWorkspace } from '../state.jsx';
import { useLive } from './LiveProvider.jsx';
import { Icon, IconButton } from '../components/UI.jsx';
import { LiveSettings } from './LiveSettings.jsx';
import { JobPanel } from './JobPanel.jsx';

export function LiveLayout() {
  const { status, error, refresh, toast } = useLive();
  const { preferences, update, ready } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const [navOpen, setNavOpen] = useState(false);
  const [jobsOpen, setJobsOpen] = useState(false);
  const settings = params.get('settings');
  const openSettings = (tab) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set('settings', tab);
      return next;
    });
  const closeSettings = () =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete('settings');
        return next;
      },
      { replace: true },
    );
  const running = status?.jobs.filter((job) => job.state === 'running').length || 0;
  return (
    <div className="live-app">
      <a className="skip-link" href="#live-content">
        跳转至事件列表
      </a>
      <header className="live-topbar">
        <IconButton
          className="live-menu-toggle"
          icon="menu"
          label="打开主导航"
          onClick={() => setNavOpen(!navOpen)}
        />
        <Link to="/events" className="live-brand">
          <Icon name="logo" size={24} />
          Signal Blogs
        </Link>
        <span className="live-caption">私人日报</span>
        <div className="live-top-actions">
          <button
            className="button"
            onClick={() => setJobsOpen(!jobsOpen)}
            aria-expanded={jobsOpen}
          >
            <Icon name={running ? 'refresh' : 'history'} />
            {running ? `${running} 项任务运行中` : '任务记录'}
          </button>
          <IconButton
            icon={preferences.dark ? 'moon' : 'sun'}
            label="切换阅读主题"
            disabled={!ready}
            onClick={() => update('preferences', { dark: !preferences.dark })}
          />
        </div>
      </header>
      {navOpen && (
        <button
          className="live-nav-mask"
          aria-label="关闭主导航"
          onClick={() => setNavOpen(false)}
        />
      )}
      <aside className={`live-nav ${navOpen ? 'open' : ''}`} aria-label="主导航">
        <div>
          <p>我的工作台</p>
          {[
            ['/events', 'bolt', '精选'],
            ['/all', 'compass', '全部事件'],
            ['/bookmarks', 'bookmark', '收藏'],
          ].map(([to, icon, label]) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setNavOpen(false)}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon name={icon} />
              {label}
            </NavLink>
          ))}
          <button
            className="nav-item"
            onClick={() => {
              openSettings('channels');
              setNavOpen(false);
            }}
          >
            <Icon name="headphones" />
            频道研究
          </button>
        </div>
        <footer>
          <Link className="prototype-entry" to="/daily">
            <Icon name="book" />
            设计原型与旧笔记
          </Link>
          <button
            id="status"
            data-state={status ? 'ready' : error ? 'error' : 'loading'}
            className="live-health"
            onClick={() => refresh()}
          >
            <span className={`status-dot ${error ? 'error' : status ? 'ready' : 'loading'}`} />
            {error ? '连接失败，点击重试' : status ? '本地服务就绪' : '正在连接…'}
          </button>
          <button
            className="nav-item"
            onClick={() => {
              openSettings('rss');
              setNavOpen(false);
            }}
          >
            <Icon name="settings" />
            设置
          </button>
        </footer>
      </aside>
      <div className="live-workspace">
        {error && (
          <div className="error-banner" role="alert">
            {error}
            <button onClick={() => refresh()}>重试连接</button>
          </div>
        )}
        {jobsOpen && <JobPanel onClose={() => setJobsOpen(false)} />}
        <Outlet context={{ openSettings, openJobs: () => setJobsOpen(true) }} />
      </div>
      {settings && <LiveSettings tab={settings} onTab={openSettings} onClose={closeSettings} />}
      <div className={`toast ${toast ? 'visible' : ''}`} role="status">
        {toast}
      </div>
    </div>
  );
}
