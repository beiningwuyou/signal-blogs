import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getHealth } from './api.js';
import { initialSources } from './data/catalog.js';
import { rolesConfig } from './data/roles.js';
import { seedLiveSources } from './live/api.js';

const defaultWorkspace = {
  entries: {},
  ready: false,
  update: () => Promise.resolve(false),
  health: 'loading',
  checkHealth: () => {},
  error: '',
  saving: 0,
  retry: () => {},
  notify: () => {},
  toast: '',
  preferences: {},
  currentRole: rolesConfig[0],
  roles: rolesConfig,
  switchRole: () => {},
  sources: initialSources,
  toggleBookmark: () => {},
  copyLink: () => {},
};

const WorkspaceContext = createContext(defaultWorkspace);
export const useWorkspace = () => useContext(WorkspaceContext) || defaultWorkspace;

export function WorkspaceProvider({ children }) {
  const [entries, setEntries] = useState({});
  const entriesRef = useRef({});
  const [ready, setReady] = useState(false);
  const [health, setHealth] = useState('loading');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(0);
  const [toast, setToast] = useState('');
  const pending = useRef(new Map());
  const queue = useRef(Promise.resolve());
  const timer = useRef();

  const notify = useCallback((message) => {
    setToast(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), 3200);
  }, []);

  const checkHealth = useCallback(async () => {
    setHealth('loading');
    try {
      await getHealth();
      setHealth('ready');
    } catch {
      setHealth('error');
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/workspace', { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error('读取失败');
      const data = await response.json();
      entriesRef.current = data;
      setEntries(data);
      setReady(true);
      setError('');
    } catch {
      setError('无法读取本地记录，请重试。');
    }
  }, []);

  useEffect(() => {
    checkHealth();
    load();
    return () => clearTimeout(timer.current);
  }, [checkHealth, load]);

  const persist = useCallback((id, value) => {
    pending.current.set(id, value);
    setSaving((n) => n + 1);
    const job = queue.current
      .catch(() => {})
      .then(async () => {
        try {
          const response = await fetch(`/api/workspace/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(value),
            signal: AbortSignal.timeout(5000),
          });
          if (!response.ok) throw new Error('保存失败');
          if (pending.current.get(id) === value) pending.current.delete(id);
          if (!pending.current.size) setError('');
          return true;
        } catch {
          setError('保存失败：改动仍在当前页面，请重试保存后再关闭。');
          return false;
        } finally {
          setSaving((n) => n - 1);
        }
      });
    queue.current = job;
    return job;
  }, []);

  const update = useCallback(
    (id, patch) => {
      if (!ready) {
        notify('本地记录尚未就绪，请先重试连接。');
        return Promise.resolve(false);
      }
      const value = { ...entriesRef.current[id], ...patch };
      entriesRef.current = { ...entriesRef.current, [id]: value };
      setEntries(entriesRef.current);
      return persist(id, value);
    },
    [ready, persist, notify],
  );

  const retry = async () => {
    await checkHealth();
    if (!ready) return load();
    for (const [id, value] of pending.current) await persist(id, value);
  };

  useEffect(() => {
    const onUnload = (event) => {
      if (pending.current.size) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);

  const preferences = entries.preferences || {};
  const currentRoleId = preferences.role || 'chief_analyst';
  const currentRole = rolesConfig.find((r) => r.id === currentRoleId) || rolesConfig[0];

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.dark ? 'dark' : 'light';
  }, [preferences.dark]);

  const switchRole = async (roleId) => {
    const targetRole = rolesConfig.find((r) => r.id === roleId);
    if (!targetRole) return;
    const ok = await update('preferences', {
      role: roleId,
      sources: targetRole.sources,
    });
    if (ok) {
      if (Array.isArray(targetRole.sources) && targetRole.sources.length > 0) {
        try {
          await seedLiveSources(
            targetRole.sources.map((s) => ({
              name: s.name,
              url: s.url,
              kind: s.kind || 'rss',
              category: s.category || 'AI 算法与模型',
              enabled: true,
            })),
          );
        } catch (e) {
          console.warn('同步角色专属信源至 SQLite 失败:', e);
        }
      }
      notify(
        `已切换至「${targetRole.name}」角色，并同步装载专属 RSS 订阅源包（共 ${targetRole.sources.length} 个信源）`,
      );
    }
  };

  const toggleBookmark = async (articleOrId) => {
    const targetId = typeof articleOrId === 'string' ? articleOrId : articleOrId?.id;
    if (!targetId) return;
    const bookmarked = !entriesRef.current[targetId]?.bookmarked;
    if (await update(targetId, { bookmarked }))
      notify(bookmarked ? '已加入「我的阅读」稍后精读库' : '已从稍后精读移除');
  };
  const copyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(new URL(url, location.origin).href);
      notify('研读链接已复制');
    } catch {
      notify('无法访问剪贴板，请从地址栏复制当前链接。');
    }
  };
  return (
    <WorkspaceContext.Provider
      value={{
        entries,
        ready,
        update,
        health,
        checkHealth,
        error,
        saving,
        retry,
        notify,
        toast,
        preferences,
        currentRole,
        roles: rolesConfig,
        switchRole,
        sources: preferences.sources || currentRole.sources || initialSources,
        toggleBookmark,
        copyLink,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
