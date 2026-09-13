import { useRef, useState } from 'react';
import { CATEGORIES } from '../../shared/contracts.js';
import { Modal } from './Modal.jsx';
import { JobPanel } from './JobPanel.jsx';
import { useLive } from './LiveProvider.jsx';
import { request, displayTime } from './api.js';
import { Icon } from '../components/UI.jsx';

const blank = (kind) => ({ name: '', url: '', kind, category: '科技产品', enabled: true });
const sourceFields = (source) =>
  Object.fromEntries(
    ['name', 'url', 'kind', 'category', 'enabled'].map((key) => [key, source[key]]),
  );
export function LiveSettings({ tab, onTab, onClose }) {
  const { status, refresh, start, starting, notify } = useLive();
  const [forms, setForms] = useState({});
  const [editing, setEditing] = useState({});
  const [message, setMessage] = useState('');
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState([]);
  const fileRef = useRef(null);
  const currentTab = ['rss', 'channels', 'tools'].includes(tab) ? tab : 'rss';
  const form = forms[currentTab] || blank(currentTab === 'rss' ? 'rss' : 'podcast');
  const sources = (status?.sources || []).filter((source) =>
    currentTab === 'rss' ? source.kind === 'rss' : source.kind !== 'rss',
  );
  const update = (patch) => {
    setForms((values) => ({ ...values, [currentTab]: { ...form, ...patch } }));
    setMessage('');
    setFailure('');
  };
  const operation = async (action) => {
    setBusy(true);
    setMessage('');
    setFailure('');
    try {
      await action();
    } catch (error) {
      setFailure(error.message);
    } finally {
      setBusy(false);
    }
  };
  const test = () =>
    operation(async () => {
      const result = await request('/sources/test', { method: 'POST', body: form });
      setMessage(
        `连接成功：${result.title || form.name}，${result.itemCount} 篇可用材料${result.skipped ? `，跳过 ${result.skipped} 篇无标题条目` : ''}。测试未保存配置。`,
      );
    });
  const save = (event) => {
    event.preventDefault();
    operation(async () => {
      await request(editing[currentTab] ? `/sources/${editing[currentTab]}` : '/sources', {
        method: editing[currentTab] ? 'PUT' : 'POST',
        body: form,
      });
      await refresh();
      setMessage('信源已保存');
      setForms((values) => ({ ...values, [currentTab]: blank(form.kind) }));
      setEditing((values) => ({ ...values, [currentTab]: null }));
    });
  };
  const exportSources = () => {
    const escape = (value) =>
      String(value).replace(
        /[&<>"']/g,
        (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char],
      );
    const xml = `<?xml version="1.0" encoding="UTF-8"?><opml version="2.0"><head><title>Signal Desk 信源</title></head><body>${sources.map((source) => `<outline text="${escape(source.name)}" type="rss" xmlUrl="${escape(source.url)}" category="${escape(source.category)}" kind="${source.kind}" enabled="${source.enabled}"/>`).join('')}</body></opml>`;
    const url = URL.createObjectURL(new Blob([xml], { type: 'text/xml' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'SignalDesk-live-sources.opml';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importSources = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    operation(async () => {
      if (file.size > 1024 * 1024) throw new Error('OPML 文件最多 1 MB');
      const xml = await file.text();
      if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('不支持包含外部实体的 OPML');
      const parsed = new DOMParser().parseFromString(xml, 'text/xml');
      if (parsed.querySelector('parsererror') || !parsed.querySelector('opml'))
        throw new Error('无法解析 OPML，请检查文件格式');
      const entries = [...parsed.querySelectorAll('outline[xmlUrl]')];
      if (!entries.length || entries.length > 100)
        throw new Error('请导入包含 1–100 个信源的 OPML');
      let saved = 0;
      const errors = [];
      for (const entry of entries) {
        const name = entry.getAttribute('text') || entry.getAttribute('title') || '';
        try {
          await request('/sources', {
            method: 'POST',
            body: {
              name,
              url: entry.getAttribute('xmlUrl'),
              kind:
                currentTab === 'rss'
                  ? 'rss'
                  : entry.getAttribute('kind') === 'video'
                    ? 'video'
                    : 'podcast',
              category: CATEGORIES.includes(entry.getAttribute('category'))
                ? entry.getAttribute('category')
                : '科技产品',
              enabled: entry.getAttribute('enabled') !== 'false',
            },
          });
          saved++;
        } catch (error) {
          errors.push(`${name || '未命名信源'}：${error.message}`);
        }
      }
      await refresh();
      setMessage(`已导入 ${saved} 个信源。`);
      if (errors.length) setFailure(errors.join('；'));
    });
  };
  return (
    <Modal title="工作台设置" onClose={onClose} className="live-settings">
      <div className="live-settings-tabs" role="tablist" aria-label="设置分类">
        {[
          ['rss', 'RSS 信源'],
          ['channels', '播客 / 长视频'],
          ['tools', '研究工具'],
        ].map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={key === currentTab}
            onClick={() => {
              onTab(key);
              setFailure('');
              setMessage('');
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="live-settings-content">
        {currentTab === 'tools' ? (
          <>
            <h3>频道元数据研究</h3>
            <p>
              读取所选频道 RSS / Atom
              中的标题、简介与订阅内正文，整理成可回溯的事件。结果标注「基于元数据」，不会声称已观看视频或听完播客。
            </p>
            <div className="live-tool">
              <Icon name="check" />
              <strong>已内置，无需密钥</strong>
              <span>在「播客 / 长视频」选择频道后手动运行。</span>
            </div>
            <p className="muted">
              当前未接入外部模型服务；个人判断仅保存在本机，不会作为研究输入发送。
            </p>
            <JobPanel compact />
          </>
        ) : (
          <>
            <div className="section-title">
              <span>
                {currentTab === 'rss' ? '订阅信源' : '研究频道'} · {sources.length}
              </span>
              <div className="live-inline-actions">
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => fileRef.current.click()}
                >
                  导入 OPML
                </button>
                <button className="text-button" disabled={!sources.length} onClick={exportSources}>
                  导出 OPML
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".opml,.xml,text/xml"
                  hidden
                  onChange={importSources}
                />
              </div>
            </div>
            <p className="muted">
              {currentTab === 'rss'
                ? '添加实际 RSS / Atom 订阅地址，保存后在工作台手动获取。'
                : '添加播客 RSS 或视频频道 Atom 订阅地址。普通频道主页无法作为订阅解析。'}{' '}
              未预置未经确认的地址。
            </p>
            <div className="live-source-list">
              {!sources.length ? (
                <p className="live-source-empty">
                  还没有{currentTab === 'rss' ? '信源' : '频道'}，从下方添加。
                </p>
              ) : (
                sources.map((source) => (
                  <article className="live-source" key={source.id}>
                    <div className="live-source-title">
                      {currentTab === 'channels' && (
                        <input
                          aria-label={`选择频道 ${source.name}`}
                          type="checkbox"
                          checked={selected.includes(source.id)}
                          disabled={!source.enabled}
                          onChange={(event) =>
                            setSelected((values) =>
                              event.target.checked
                                ? [...values, source.id]
                                : values.filter((id) => id !== source.id),
                            )
                          }
                        />
                      )}
                      <strong>{source.name}</strong>
                      <span className="tag">{source.category}</span>
                      <label className="live-enable">
                        <input
                          type="checkbox"
                          checked={source.enabled}
                          disabled={busy}
                          onChange={() =>
                            operation(async () => {
                              await request(`/sources/${source.id}`, {
                                method: 'PUT',
                                body: { ...sourceFields(source), enabled: !source.enabled },
                              });
                              await refresh();
                            })
                          }
                        />
                        启用
                      </label>
                      <button
                        className="text-button"
                        disabled={busy}
                        onClick={() => {
                          setForms((values) => ({ ...values, [currentTab]: sourceFields(source) }));
                          setEditing((values) => ({ ...values, [currentTab]: source.id }));
                          setFailure('');
                          setMessage('');
                        }}
                      >
                        编辑
                      </button>
                    </div>
                    <p className="live-source-url">{source.url}</p>
                    <small className="muted">上次成功：{displayTime(source.lastSuccessAt)}</small>
                    {source.error && <p className="field-error">{source.error}</p>}
                  </article>
                ))
              )}
            </div>
            {currentTab === 'channels' && (
              <div className="live-research-start">
                <p>
                  已选{' '}
                  {
                    sources.filter((source) => source.enabled && selected.includes(source.id))
                      .length
                  }{' '}
                  个频道 · 基于元数据
                </p>
                <button
                  className="button primary"
                  disabled={
                    starting ||
                    !sources.some((source) => source.enabled && selected.includes(source.id)) ||
                    status?.jobs.some((job) => job.kind === 'research' && job.state === 'running')
                  }
                  onClick={async () => {
                    const job = await start('research', {
                      sourceIds: sources
                        .filter((source) => source.enabled && selected.includes(source.id))
                        .map((source) => source.id),
                      tool: 'metadata',
                    });
                    if (job) notify('研究已启动，可在下方查看进度与结果');
                  }}
                >
                  开始研究
                  <Icon name="arrowRight" />
                </button>
              </div>
            )}
            <form onSubmit={save} className="live-source-form">
              <h3>{editing[currentTab] ? '编辑信源' : '添加信源'}</h3>
              <div className="live-form-grid">
                <label>
                  名称
                  <input
                    required
                    maxLength={120}
                    value={form.name}
                    onChange={(event) => update({ name: event.target.value })}
                    placeholder="信源或频道名称"
                  />
                </label>
                <label>
                  分类
                  <select
                    value={form.category}
                    onChange={(event) => update({ category: event.target.value })}
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>
                <label className="full-width">
                  订阅地址
                  <input
                    required
                    type="url"
                    maxLength={2048}
                    value={form.url}
                    onChange={(event) => update({ url: event.target.value })}
                    placeholder="https://… /rss 或 /feed"
                  />
                </label>
                {currentTab === 'channels' && (
                  <label>
                    频道类型
                    <select
                      value={form.kind}
                      onChange={(event) => update({ kind: event.target.value })}
                    >
                      <option value="podcast">播客</option>
                      <option value="video">长视频</option>
                    </select>
                  </label>
                )}
              </div>
              <div className="live-inline-actions">
                <button
                  type="button"
                  className="button"
                  disabled={busy || !form.name.trim() || !form.url.trim()}
                  onClick={test}
                >
                  {busy ? '处理中…' : '测试连接'}
                </button>
                <button type="submit" className="button primary" disabled={busy}>
                  保存信源
                </button>
                {editing[currentTab] && (
                  <button
                    type="button"
                    className="text-button"
                    disabled={busy}
                    onClick={() => {
                      setEditing((values) => ({ ...values, [currentTab]: null }));
                      setForms((values) => ({ ...values, [currentTab]: blank(form.kind) }));
                    }}
                  >
                    取消编辑
                  </button>
                )}
              </div>
            </form>
            {message && (
              <p className="live-success" role="status">
                {message}
              </p>
            )}
            {failure && (
              <p className="field-error" role="alert">
                {failure}
              </p>
            )}
            <JobPanel compact />
          </>
        )}
      </div>
    </Modal>
  );
}
