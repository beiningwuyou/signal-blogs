import { Fragment, useEffect, useRef, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { CATEGORIES } from '../../shared/contracts.js';
import { Icon, IconButton } from '../components/UI.jsx';
import { useLive } from './LiveProvider.jsx';
import { request, displayTime } from './api.js';
import { EventDetail } from './EventDetail.jsx';
import { jobStateLabels } from './JobPanel.jsx';

export function Workbench({ scope }) {
  const { status, version, start, starting, changed, notify } = useLive();
  const { openSettings, openJobs } = useOutletContext();
  const [params, setParams] = useSearchParams();
  const selected = params.get('event');
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const jobId = params.get('jobId') || '';
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState({});
  const feed = useRef();
  const patchParams = (patch) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        for (const [key, value] of Object.entries(patch)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace: true },
    );
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    const query = new URLSearchParams({ scope, q, category, jobId });
    const timeout = setTimeout(
      () =>
        request(`/events?${query}`, { signal: controller.signal })
          .then((result) => {
            setEvents(result);
            setLoading(false);
            if (selected && !result.some((event) => event.id === selected))
              setParams(
                (previous) => {
                  const next = new URLSearchParams(previous);
                  next.delete('event');
                  return next;
                },
                { replace: true },
              );
          })
          .catch((failure) => {
            if (!controller.signal.aborted) {
              setError(failure.message);
              setLoading(false);
            }
          }),
      q ? 200 : 0,
    );
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [scope, q, category, jobId, version, retry, setParams]);
  useEffect(() => {
    feed.current?.scrollTo({ top: 0 });
  }, [scope, q, category, jobId]);
  const bookmark = async (event) => {
    if (saving[event.id]) return;
    setSaving((values) => ({ ...values, [event.id]: true }));
    try {
      await request(`/events/${event.id}/record`, {
        method: 'PATCH',
        body: { bookmarked: !event.record.bookmarked },
      });
      await changed();
      notify(event.record.bookmarked ? '已取消收藏，个人判断已保留' : '已收藏');
    } catch (failure) {
      notify(failure.message);
    } finally {
      setSaving((values) => ({ ...values, [event.id]: false }));
    }
  };
  const running = status?.jobs.some((job) => job.kind === 'fetch' && job.state === 'running');
  const latestFetch = status?.jobs.find((job) => job.kind === 'fetch');
  const enabled = status?.sources.some((source) => source.enabled && source.kind === 'rss');
  const title = { featured: '精选', all: '全部事件', bookmarks: '收藏' }[scope];
  let previousDate;
  return (
    <main id="live-content" className="live-workbench">
      <section className="live-feed-column" aria-label={`${title}事件列表`}>
        <div className="live-feed-heading">
          <div className="live-heading-row">
            <div>
              <span className="live-kicker">让信息，成为判断</span>
              <h1>
                {title}
                <span>{events.length}</span>
              </h1>
            </div>
            <button
              className="button primary"
              disabled={starting || running || !status}
              onClick={() => (enabled ? start('fetch') : openSettings('rss'))}
            >
              <Icon name="refresh" />
              {running ? '正在获取…' : enabled ? '获取最新' : '配置信源'}
            </button>
          </div>
          <p className="live-ranking">
            {scope === 'featured'
              ? '最多展示 10 个事件，按独立信源数、更新时间排序。'
              : scope === 'bookmarks'
                ? '留存值得回看的事件与个人判断。'
                : '按更新时间倒序，按日期归档。'}
            <br />
            <span>最近成功获取：{displayTime(status?.lastFetchSuccessAt)}</span>
          </p>
          <label className="live-search">
            <Icon name="search" />
            <input
              aria-label="搜索事件"
              placeholder="搜索标题、摘要或信源"
              maxLength={200}
              value={q}
              onChange={(event) => patchParams({ q: event.target.value, event: null })}
            />
            {q && (
              <IconButton
                icon="close"
                label="清空搜索"
                onClick={() => patchParams({ q: null, event: null })}
              />
            )}
          </label>
          <div className="live-categories" aria-label="事件分类">
            {['全部', ...CATEGORIES].map((value) => (
              <button
                key={value}
                aria-pressed={value === (category || '全部')}
                onClick={() =>
                  patchParams({ category: value === '全部' ? null : value, event: null })
                }
              >
                {value}
              </button>
            ))}
          </div>
          {latestFetch && latestFetch.state !== 'completed' && (
            <div className="live-job-filter" role="status">
              <span>
                最近获取：{jobStateLabels[latestFetch.state]} · {latestFetch.done} /{' '}
                {latestFetch.total}
                {latestFetch.failed ? ` · ${latestFetch.failed} 个信源失败` : ''}
              </span>
              <button onClick={openJobs}>查看进度与详情</button>
            </div>
          )}
          {jobId && (
            <div className="live-job-filter">
              正在查看任务结果
              <button onClick={() => patchParams({ jobId: null, event: null })}>
                显示全部事件
              </button>
            </div>
          )}
        </div>
        <div className="live-feed-scroll" ref={feed} aria-busy={loading}>
          {error && (
            <div className="error-banner" role="alert">
              {error}
              <button onClick={() => setRetry((value) => value + 1)}>重试</button>
            </div>
          )}
          {loading && !events.length ? (
            <p className="live-placeholder" role="status">
              正在读取本地事件…
            </p>
          ) : !events.length && !error ? (
            <div className="live-empty">
              <Icon name={scope === 'bookmarks' ? 'bookmark' : 'rss'} size={32} />
              <h2>
                {q || category || jobId
                  ? '没有匹配的事件'
                  : scope === 'bookmarks'
                    ? '把值得回看的事件留在这里'
                    : '从一个可靠信源开始'}
              </h2>
              <p>
                {q || category || jobId
                  ? '尝试其他关键词，或清空筛选条件。'
                  : scope === 'bookmarks'
                    ? '点击事件卡片上的收藏按钮，稍后在这里继续研读。'
                    : '添加 RSS 订阅并手动获取，真实内容会出现在这里。'}
              </p>
              {q || category || jobId ? (
                <button
                  className="button"
                  onClick={() => patchParams({ q: null, category: null, jobId: null, event: null })}
                >
                  重置筛选
                </button>
              ) : (
                scope !== 'bookmarks' && (
                  <button className="button primary" onClick={() => openSettings('rss')}>
                    添加信源
                    <Icon name="plus" />
                  </button>
                )
              )}
            </div>
          ) : (
            events.map((event) => {
              const date = displayTime(event.updatedAt, { dateOnly: true });
              const showDate = scope === 'all' && date !== previousDate;
              previousDate = date;
              return (
                <Fragment key={event.id}>
                  {showDate && (
                    <h2 className="live-date-group">{date === '未知' ? '时间未知' : date}</h2>
                  )}
                  <article className={`live-event-card ${selected === event.id ? 'selected' : ''}`}>
                    <button
                      className="live-card-main"
                      aria-label={`研读 ${event.title}`}
                      aria-pressed={selected === event.id}
                      onClick={() => patchParams({ event: event.id })}
                    >
                      <div className="live-card-meta">
                        <span>{event.category}</span>
                        <time>{displayTime(event.updatedAt)}</time>
                        {event.marker && (
                          <span className="live-marker" title={event.marker.description}>
                            {event.marker.kind === 'new' ? '新增' : '有进展'}
                          </span>
                        )}
                      </div>
                      <h2>{event.title}</h2>
                      <p>{event.summary}</p>
                      <div className="live-card-foot">
                        <span>{event.sources.join(' · ')}</span>
                        <span>
                          {event.articleCount} 篇材料 · {event.sourceCount} 个信源
                        </span>
                      </div>
                    </button>
                    <IconButton
                      className={`live-bookmark ${event.record.bookmarked ? 'is-saved' : ''}`}
                      icon="bookmark"
                      label={`${event.record.bookmarked ? '取消收藏' : '收藏'} ${event.title}`}
                      aria-pressed={event.record.bookmarked}
                      disabled={saving[event.id]}
                      onClick={() => bookmark(event)}
                    />
                  </article>
                </Fragment>
              );
            })
          )}
        </div>
      </section>
      <EventDetail id={selected} onClose={() => patchParams({ event: null })} />
    </main>
  );
}
