import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { issues } from '../data/catalog.js';
import { useWorkspace } from '../state.jsx';

export function DailyPage() {
  const { date } = useParams();
  const navigate = useNavigate();
  const [, setParams] = useSearchParams();
  const { toggleBookmark, entries } = useWorkspace();
  const [filterQuery, setFilterQuery] = useState('');

  const issueKeys = Object.keys(issues).sort().reverse();
  const activeDate = date && issues[date] ? date : issueKeys[0] || '2026-09-08';
  const issue = issues[activeDate] || {
    date: activeDate,
    title: `日报 —— ${activeDate}`,
    summary: '今日无新增已发布早报。',
    articles: [],
  };

  const openDrawer = (articleId) => {
    setParams({ article: articleId });
  };

  const filteredIssueKeys = issueKeys.filter(
    (k) => k.includes(filterQuery) || issues[k]?.title?.includes(filterQuery),
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full max-w-5xl mx-auto pb-12 select-none">
      {/* 往期早报树形归档栏 (桌面端左侧) */}
      <aside
        aria-label="往期早报归档"
        className="w-full lg:w-72 shrink-0 border border-hairline bg-[#fdfbf8] rounded-xl flex flex-col select-none shadow-2xs overflow-hidden"
      >
        <div className="p-3.5 border-b border-hairline bg-surface-card/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-muted text-[17px]">
                calendar_month
              </span>
              <h2 className="text-xs font-semibold text-ink uppercase tracking-wider font-mono">
                往期日报
              </h2>
            </div>
            <span className="text-[11px] text-muted font-mono">共 142 期</span>
          </div>

          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-muted text-[16px]">
              filter_list
            </span>
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="按日期或期数过滤..."
              className="w-full bg-surface-card border border-hairline rounded-lg pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* 归档列表 */}
        <div className="p-2 space-y-1 max-h-[480px] overflow-y-auto">
          <div className="px-2 py-1 text-[11px] font-mono text-muted font-semibold uppercase">
            2026 年 09 月
          </div>
          {filteredIssueKeys.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => navigate(`/daily/${k}`)}
              className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-center justify-between group ${
                activeDate === k
                  ? 'bg-amber-500/10 text-primary font-semibold border-l-2 border-primary shadow-2xs'
                  : 'hover:bg-surface text-body'
              }`}
            >
              <div className="flex flex-col min-w-0 pr-1">
                <span className="font-mono font-medium truncate">{k} · 第142期</span>
                <span className="text-[10px] text-muted truncate mt-0.5">
                  {issues[k]?.title || '出版级精选研报'}
                </span>
              </div>
              {activeDate === k && (
                <span className="text-[10px] bg-primary text-white px-1 rounded font-mono shrink-0">
                  当前
                </span>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* 主日报视窗 (右侧) */}
      <main className="flex-1 w-full min-w-0 space-y-5">
        {/* 日报报头 */}
        <header className="border-b border-hairline pb-4 space-y-2 bg-surface-card p-5 rounded-xl border shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted font-mono">
            <span className="px-2 py-0.5 bg-amber-500/10 text-primary font-semibold rounded">
              #142 期 · 每日早报
            </span>
            <span>
              发布于 {activeDate} 08:00 · {issue.articles?.length || 0} 篇文章
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-ink tracking-tight pt-1">
            {issue.title}
          </h1>
          <p className="text-xs text-body leading-relaxed pt-1">{issue.summary}</p>
        </header>

        {/* 日报文章列表 */}
        <div className="space-y-4">
          {issue.articles?.map((art) => (
            <article
              key={art.id}
              className="bg-surface-card rounded-xl border border-hairline hover:border-hairline-strong hover:shadow-xs transition-all p-5 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-surface border border-hairline font-mono text-[11px] text-primary font-semibold">
                    {art.category || '硬科技与芯片'}
                  </span>
                  <span className="text-muted">{art.source}</span>
                </div>
                <span className="font-mono text-[11px] text-muted">阅读用时约 5 分钟</span>
              </div>

              <div>
                <h2
                  onClick={() => openDrawer(art.id)}
                  className="text-lg font-serif font-bold text-ink leading-snug hover:text-primary transition-colors cursor-pointer"
                >
                  {art.title}
                </h2>
                <p className="text-xs text-body leading-relaxed pt-2">{art.body}</p>
              </div>

              {/* 核心研判要点引言 */}
              {art.takeaways?.length > 0 && (
                <div className="p-3 bg-[#fbf9f5] rounded-lg border-l-2 border-primary space-y-1">
                  <div className="text-[11px] font-mono font-semibold text-primary">
                    【核心研判结论】
                  </div>
                  <ul className="text-xs text-body space-y-1 pl-4 list-disc marker:text-primary">
                    {art.takeaways.map((t, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-hairline-soft text-xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleBookmark(art.id)}
                    className="flex items-center gap-1 text-muted hover:text-ink transition-colors"
                  >
                    <span
                      className="material-symbols-outlined text-[16px]"
                      style={{
                        fontVariationSettings: entries[art.id]?.bookmarked ? 'FILL 1' : 'FILL 0',
                      }}
                    >
                      {entries[art.id]?.bookmarked ? 'bookmark_added' : 'bookmark_add'}
                    </span>
                    <span>{entries[art.id]?.bookmarked ? '已存入研读' : '存入稍后读'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => openDrawer(art.id)}
                  className="px-3 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-primary font-medium flex items-center gap-1 transition-all"
                >
                  <span>阅读全文与证据链</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
