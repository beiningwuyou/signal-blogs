import { useState } from 'react';
import { articles } from '../data/catalog.js';
import { useWorkspace } from '../state.jsx';
import { IntelligenceCard } from '../components/IntelligenceCard.jsx';
import { EmptyState, Icon } from '../components/UI.jsx';

export function LibraryPage({ history = false }) {
  const { entries } = useWorkspace();
  const [query, setQuery] = useState('');
  const items = articles
    .filter((article) =>
      history ? entries[article.id]?.visitedAt : entries[article.id]?.bookmarked,
    )
    .filter((article) =>
      `${article.title} ${entries[article.id]?.note || ''}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      history ? (entries[b.id]?.visitedAt || '').localeCompare(entries[a.id]?.visitedAt || '') : 0,
    );
  return (
    <div className="library-page">
      <div className="page-heading">
        <p className="eyebrow">YOUR PERSONAL SPACE</p>
        <h1>{history ? '浏览足迹' : '我的阅读'}</h1>
        <p>
          {history ? '回到读过的内容，继续未完成的思考。' : '留住值得再读的情报，积累自己的判断。'}
        </p>
      </div>
      <label className="rail-search">
        <Icon name="search" />
        <input
          aria-label="搜索个人阅读"
          placeholder="搜索标题与个人笔记…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <span>{items.length} 篇</span>
      </label>
      <div className="library-grid">
        {items.map((article) => (
          <div key={article.id}>
            {history && (
              <p className="history-date">
                {new Date(entries[article.id].visitedAt).toLocaleString('zh-CN')}
              </p>
            )}
            <IntelligenceCard article={article} />
          </div>
        ))}
      </div>
      {!items.length && (
        <EmptyState
          title={history ? '还没有匹配的浏览足迹' : '还没有匹配的阅读书签'}
          detail={
            history
              ? '打开任意情报的研读抽屉后，会在这里留下足迹。'
              : '在卡片或研读抽屉中点击书签，将内容加入我的阅读。'
          }
        />
      )}
    </div>
  );
}
