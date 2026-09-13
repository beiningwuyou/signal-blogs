import { useEffect, useRef, useState } from 'react';
import { Icon, IconButton } from '../components/UI.jsx';
import { trapDialogFocus } from '../components/dialog.js';
import { Modal } from './Modal.jsx';
import { useLive } from './LiveProvider.jsx';
import { copyEventText, copyText, displayTime, request } from './api.js';

function Materials({ items }) {
  return (
    <ol className="live-materials">
      {items.map((item) => (
        <li key={item.id}>
          <div>
            <span>{item.source}</span>
            <time>{displayTime(item.publishedAt)}</time>
          </div>
          {item.url ? (
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              {item.title}
              <Icon name="external" size={13} />
            </a>
          ) : (
            <>
              <strong>{item.title}</strong>
              <p className="muted">原文地址缺失</p>
            </>
          )}
          {item.description && (
            <details>
              <summary>查看来源简介</summary>
              <p>{item.description}</p>
            </details>
          )}
        </li>
      ))}
    </ol>
  );
}

export function EventDetail({ id, onClose }) {
  const { version, changed, notify, drafts, setDraft } = useLive();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [conflict, setConflict] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [allMaterials, setAllMaterials] = useState(false);
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 1050px)').matches);
  const dialog = useRef(null);
  const panel = useRef(null);
  const currentId = useRef(id);
  currentId.current = id;
  useEffect(() => {
    const media = window.matchMedia('(max-width: 1050px)');
    const update = () => setNarrow(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    setEvent(null);
    setSaveError('');
    setConflict(null);
    setSaveMessage('');
    setAllMaterials(false);
    panel.current?.scrollTo({ top: 0 });
  }, [id]);
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setError('');
    request(`/events/${id}`, { signal: controller.signal })
      .then(setEvent)
      .catch((failure) => {
        if (!controller.signal.aborted) setError(failure.message);
      });
    return () => controller.abort();
  }, [id, version, retry]);
  useEffect(() => {
    if (!narrow || !id) return;
    const element = dialog.current;
    const previous = document.activeElement;
    element.showModal();
    return () => {
      element.close();
      if (previous?.isConnected) previous.focus();
    };
  }, [narrow, id]);
  const note = event ? (drafts[id]?.text ?? event.record.note) : '';
  const dirty = event && note !== event.record.note;
  const save = async () => {
    if (!event || busy) return;
    const target = id;
    const text = note;
    setBusy(true);
    setSaveError('');
    setSaveMessage('');
    try {
      const record = await request(`/events/${target}/record`, {
        method: 'PATCH',
        body: { note: text, expectedRevision: drafts[id]?.revision ?? event.record.revision },
      });
      setDraft(target, undefined);
      if (currentId.current === target) {
        setEvent((previous) => ({ ...previous, record }));
        setSaveMessage('个人判断已保存');
        setConflict(null);
      }
      await changed();
      notify('个人判断已保存');
    } catch (failure) {
      if (currentId.current === target) {
        setSaveError(failure.message);
        if (failure.status === 409) setConflict(failure.body.current);
      }
    } finally {
      setBusy(false);
    }
  };
  const bookmark = async () => {
    if (!event || busy) return;
    setBusy(true);
    try {
      await request(`/events/${id}/record`, {
        method: 'PATCH',
        body: { bookmarked: !event.record.bookmarked },
      });
      await changed();
    } catch (failure) {
      notify(failure.message);
    } finally {
      setBusy(false);
    }
  };
  const copy = async () => {
    try {
      await copyText(copyEventText(event));
      notify('已复制标题、摘要和原始材料链接');
    } catch {
      notify('复制失败，请允许剪贴板访问后重试');
    }
  };
  const content = !id ? (
    <div className="live-detail-empty">
      <Icon name="book" size={32} />
      <h2>留一点时间，读懂一件事</h2>
      <p>选择左侧事件，查看来源、材料与个人判断。</p>
    </div>
  ) : (
    <>
      <div className="live-detail-top">
        <span>
          <Icon name="book" />
          事件研读
        </span>
        <IconButton icon="close" label="关闭事件研读" onClick={onClose} />
      </div>
      <div className="live-detail-scroll" ref={panel}>
        {error ? (
          <div className="error-banner" role="alert">
            {error}
            <button onClick={() => setRetry((value) => value + 1)}>重试</button>
          </div>
        ) : !event ? (
          <p role="status">正在读取事件…</p>
        ) : (
          <>
            <div className="live-detail-meta">
              <span className="tag">{event.category}</span>
              <span>更新于 {displayTime(event.updatedAt)}</span>
            </div>
            <h1>{event.title}</h1>
            <button
              className={`button ${event.record.bookmarked ? 'is-saved' : ''}`}
              aria-pressed={event.record.bookmarked}
              disabled={busy}
              onClick={bookmark}
            >
              <Icon name="bookmark" />
              {event.record.bookmarked ? '已收藏' : '收藏事件'}
            </button>
            <section>
              <h2>
                <Icon name="summary" />
                事件摘要
              </h2>
              <p className="live-evidence">
                {event.evidenceLevel === 'metadata' ? '基于元数据' : '含订阅内正文'} ·
                未经独立事实核验
              </p>
              <h3>来源陈述</h3>
              <p className="live-summary">{event.summary}</p>
              <p className="muted">
                以上内容来自信源简介或订阅正文，可能包含来源观点。查看下方原始材料判断其依据。
              </p>
              <h3>模型推断</h3>
              <p className="muted">{event.inference || '未生成模型推断。'}</p>
            </section>
            <section>
              <div className="section-title">
                <span>
                  <Icon name="link" />
                  相关材料 · {event.materials.length}
                </span>
                {event.materials.length > 4 && (
                  <button className="text-button" onClick={() => setAllMaterials(true)}>
                    查看全部
                  </button>
                )}
              </div>
              <Materials items={event.materials.slice(0, 4)} />
            </section>
            {event.timeline.length > 0 && (
              <section>
                <h2>
                  <Icon name="timeline" />
                  材料时间线
                </h2>
                <p className="muted">按来源发布时间排列，不代表事件实际发生时间。</p>
                <ol className="live-timeline">
                  {event.timeline.map((item) => (
                    <li key={item.materialId}>
                      <time>{displayTime(item.date)}</time>
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        {item.text}
                        <Icon name="external" size={12} />
                      </a>
                    </li>
                  ))}
                </ol>
              </section>
            )}
            <section className="live-judgment">
              <h2>
                <Icon name="edit" />
                个人判断
              </h2>
              <p className="muted">仅保存在本机，记录你的想法与待验证的问题。</p>
              <label className="sr-only" htmlFor="event-note">
                个人判断
              </label>
              <textarea
                id="event-note"
                rows={6}
                maxLength={500}
                disabled={busy}
                value={note}
                placeholder="这件事为什么值得关注？还有什么需要验证？"
                onChange={(change) => {
                  setDraft(
                    id,
                    change.target.value === event.record.note
                      ? undefined
                      : {
                          text: change.target.value,
                          revision: drafts[id]?.revision ?? event.record.revision,
                        },
                  );
                  setSaveMessage('');
                }}
              />
              <div className="live-note-actions">
                <small>
                  {note.length} / 500{dirty ? ' · 未保存' : ''}
                </small>
                <button
                  className="button primary"
                  disabled={busy || !dirty || !!conflict}
                  onClick={save}
                >
                  <Icon name="save" />
                  {busy ? '保存中…' : saveError ? '重试保存' : '保存判断'}
                </button>
              </div>
              {saveMessage && (
                <p className="live-success" role="status">
                  {saveMessage}
                </p>
              )}
              {saveError && (
                <p className="field-error" role="alert">
                  {saveError}
                </p>
              )}
              {conflict && (
                <div className="live-conflict">
                  <p>其他窗口保存的内容：</p>
                  <blockquote>{conflict.note || '（空白）'}</blockquote>
                  <button
                    className="button"
                    onClick={() => {
                      setEvent((previous) => ({ ...previous, record: conflict }));
                      setDraft(id, { text: note, revision: conflict.revision });
                      setConflict(null);
                      setSaveError('已载入最新版本，草稿保留。确认后可重新保存。');
                    }}
                  >
                    载入最新版本并保留草稿
                  </button>
                </div>
              )}
            </section>
            <button className="button live-copy" onClick={copy}>
              <Icon name="share" />
              复制事件信息
            </button>
          </>
        )}
      </div>
    </>
  );
  return (
    <>
      {narrow ? (
        id && (
          <dialog
            ref={dialog}
            className="live-detail-dialog"
            aria-label="事件研读"
            onKeyDown={trapDialogFocus}
            onCancel={(event) => {
              event.preventDefault();
              onClose();
            }}
            onClick={(event) => {
              if (event.target === dialog.current) onClose();
            }}
          >
            {content}
          </dialog>
        )
      ) : (
        <aside className="live-detail" aria-label="事件研读">
          {content}
        </aside>
      )}
      {allMaterials && event && (
        <Modal title="全部相关材料" onClose={() => setAllMaterials(false)}>
          <div className="live-settings-content">
            <Materials items={event.materials} />
          </div>
        </Modal>
      )}
    </>
  );
}
