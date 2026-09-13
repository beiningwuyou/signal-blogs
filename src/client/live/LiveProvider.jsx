import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { request } from './api.js';

const Context = createContext(null);
export const useLive = () => useContext(Context);
export function LiveProvider({ children }) {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const [toast, setToast] = useState('');
  const [drafts, setDrafts] = useState({});
  const timer = useRef();
  const digest = useRef('');
  const hasRunning = status?.jobs.some((job) => job.state === 'running') || false;
  const notify = useCallback((message) => {
    setToast(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), 3500);
  }, []);
  const refresh = useCallback(async (signal) => {
    try {
      const value = await request('/status', { signal, timeout: 8000 });
      const next = JSON.stringify(value.jobs.map((job) => [job.id, job.done, job.state]));
      if (digest.current !== next) {
        digest.current = next;
        setVersion((value) => value + 1);
      }
      setStatus(value);
      setError('');
      return value;
    } catch (failure) {
      if (!signal?.aborted) setError(failure.message);
      return null;
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    let timer;
    const poll = async () => {
      const current = await refresh(controller.signal);
      if (!controller.signal.aborted)
        timer = setTimeout(
          poll,
          current?.jobs.some((job) => job.state === 'running') ? 1000 : 15000,
        );
    };
    poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [refresh, hasRunning]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    const leave = (event) => {
      if (Object.keys(drafts).length) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', leave);
    return () => window.removeEventListener('beforeunload', leave);
  }, [drafts]);
  const setDraft = useCallback(
    (id, value) =>
      setDrafts((current) => {
        const next = { ...current };
        if (value === undefined) delete next[id];
        else next[id] = value;
        return next;
      }),
    [],
  );
  const changed = useCallback(() => {
    setVersion((value) => value + 1);
    return refresh();
  }, [refresh]);
  const [starting, setStarting] = useState(false);
  const start = async (kind, payload = {}) => {
    if (starting) return null;
    setStarting(true);
    try {
      const job = await request(kind === 'fetch' ? '/fetch' : '/research', {
        method: 'POST',
        body: payload,
      });
      await refresh();
      notify(kind === 'fetch' ? '已开始获取启用的 RSS 信源' : '研究任务已启动');
      return job;
    } catch (failure) {
      notify(failure.message);
      return null;
    } finally {
      setStarting(false);
    }
  };
  return (
    <Context.Provider
      value={{
        status,
        error,
        refresh,
        version,
        changed,
        toast,
        notify,
        start,
        starting,
        drafts,
        setDraft,
      }}
    >
      {children}
    </Context.Provider>
  );
}
