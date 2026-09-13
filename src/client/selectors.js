export function filterIntelligence(
  articles,
  {
    source = '',
    tag = '',
    sort = 'weighted',
    scope = 'all',
    query = '',
    entries = {},
    sources = [],
  } = {},
) {
  const q = query.trim().toLowerCase();
  const configuredSource = (article) => sources.find((item) => article.source.includes(item.match));
  return articles
    .filter((article) => {
      if (configuredSource(article)?.enabled === false) return false;
      if (source && !article.source.includes(source)) return false;
      if (tag && !article.tags.includes(tag) && !article.topics.includes(tag)) return false;
      if (scope === 'breaking' && !article.date.startsWith('2026-09-08')) return false;
      if (scope === 'deep' && article.score < 90) return false;
      if (scope === 'followed' && !entries[article.id]?.followed) return false;
      return (
        !q ||
        `${article.title} ${article.source} ${article.body} ${article.tags.join(' ')} ${entries[article.id]?.note || ''}`
          .toLowerCase()
          .includes(q)
      );
    })
    .sort((a, b) => {
      if (sort === 'time') return b.date.localeCompare(a.date) || a.id.localeCompare(b.id);
      if (sort === 'score') return b.score - a.score || a.id.localeCompare(b.id);
      const weight = (article) =>
        (configuredSource(article)?.weight ?? article.score) * 0.6 + article.score * 0.4;
      return weight(b) - weight(a) || b.date.localeCompare(a.date);
    });
}
