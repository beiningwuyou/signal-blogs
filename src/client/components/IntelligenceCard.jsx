import { useLocation, useNavigate } from 'react-router-dom';
import { articleUrl } from '../data/catalog.js';
import { useWorkspace } from '../state.jsx';
import { Icon, IconButton } from './UI.jsx';

export function IntelligenceCard({ article, onTag }) {
  const { entries, toggleBookmark, copyLink, ready } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();
  const record = entries[article.id] || {};
  const daily = article.kind === 'daily';
  const open = () => {
    if (location.pathname === '/following' && !daily) {
      const next = new URLSearchParams(location.search);
      next.set('article', article.id);
      navigate({ pathname: location.pathname, search: next.toString() });
    } else navigate(articleUrl(article));
  };
  return (
    <article
      className={`intelligence-card ${daily ? 'daily-card' : 'feed-card'} ${record.read ? 'is-read' : ''}`}
      data-article-id={article.id}
    >
      <div className="card-meta">
        <div className="card-source">
          {daily ? (
            <>
              <span className="category-pill">{article.category}</span>
              <code>{article.code}</code>
            </>
          ) : (
            <>
              <span className="source-avatar">{article.source[0]}</span>
              <span>{article.source}</span>
              <small>· {article.time}</small>
            </>
          )}
        </div>
        <div className="card-actions">
          {record.read && (
            <span className="read-marker">
              <Icon name="check" size={12} />
              已读
            </span>
          )}
          <IconButton
            icon="bookmark"
            label={record.bookmarked ? '取消收藏' : '加入我的阅读'}
            aria-pressed={!!record.bookmarked}
            disabled={!ready}
            className={record.bookmarked ? 'is-bookmarked' : ''}
            onClick={() => toggleBookmark(article)}
          />
          {daily && (
            <IconButton
              icon="share"
              label="分享单篇研读"
              onClick={() => copyLink(articleUrl(article))}
            />
          )}
        </div>
      </div>
      {!daily && (
        <div className="score-label">
          <Icon name="shield" size={13} />
          {article.score} 分 ·{' '}
          {article.score >= 90 ? '极度重要' : article.score >= 85 ? '高度重要' : '算法前沿'}
          <span>原型评分</span>
        </div>
      )}
      <h2>
        <button onClick={open}>{article.title}</button>
      </h2>
      {daily ? (
        <>
          <p className="article-body">{article.body}</p>
          <div className="core-thesis">
            <strong>
              <Icon name="bulb" />
              核心研判与数据：
            </strong>
            <ul>
              {article.takeaways.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <>
          <div className="core-thesis">{article.core}</div>
          <div className="evidence-lines">
            {article.takeaways.map((text, index) => (
              <p key={text}>
                <span>{index === 0 ? '[事实]' : '[推论]'}</span>
                {text}
              </p>
            ))}
          </div>
        </>
      )}
      <footer className="card-footer">
        {daily ? (
          <div className="reading-meta">
            <span>
              <Icon name="clock" size={14} />
              {article.readTime}
            </span>
            <span>
              <Icon name="link" size={14} />
              {article.sourceSummary}
            </span>
          </div>
        ) : (
          <div className="ticker-list">
            {article.tags.map((tag) => (
              <button
                key={tag}
                title={`筛选 ${tag} 关联情报`}
                onClick={() => (onTag ? onTag(tag) : navigate(`/following?tag=${tag}`))}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
        <button className="text-button" onClick={open}>
          {daily ? '展开研读抽屉与交叉验证' : '展开全案'}
          <Icon name="arrowRight" size={14} />
        </button>
      </footer>
    </article>
  );
}
