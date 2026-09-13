import { test } from 'node:test';
import assert from 'node:assert/strict';
import intelligence from '../src/client/data/intelligence.json' with { type: 'json' };
import issues from '../src/client/data/issues.json' with { type: 'json' };
import { filterIntelligence } from '../src/client/selectors.js';

test('筛选依据主题、信源和笔记内容，组合条件不命中时返回空列表', () => {
  assert.deepEqual(filterIntelligence(intelligence, { tag: '先进封装' }).map(a => a.id), ['demo-cowos']);
  assert.deepEqual(filterIntelligence(intelligence, { source: 'Latent.Space' }).map(a => a.id), ['demo-rsd']);
  assert.equal(filterIntelligence(intelligence, { source: 'Latent.Space', tag: '先进封装' }).length, 0);
  assert.deepEqual(filterIntelligence(intelligence, { query: '独家备忘', entries: { 'demo-rsd': { note: '独家备忘' } } }).map(a => a.id), ['demo-rsd']);
  assert.equal(filterIntelligence(intelligence, { query: '不存在的关键词' }).length, 0);
});

test('时间与权重排序可区分，停用信源不显示，主题关注可过滤', () => {
  assert.equal(filterIntelligence(intelligence, { sort: 'time' })[0].id, 'demo-sama-compute');
  assert.equal(filterIntelligence(intelligence, { sort: 'score' })[0].id, 'demo-cowos');
  assert.equal(filterIntelligence(intelligence, { sources: [{ match: 'Latent.Space', weight: 100, enabled: true }, { match: 'SemiAnalysis', weight: 80, enabled: true }] })[0].id, 'demo-rsd');
  assert.equal(filterIntelligence(intelligence, { sources: [{ match: 'SemiAnalysis', enabled: false }] }).some(a => a.id === 'demo-cowos'), false);
  assert.deepEqual(filterIntelligence(intelligence, { scope: 'followed', entries: { 'demo-operator': { followed: true } } }).map(a => a.id), ['demo-operator']);
});

test('日报与情报 ID 唯一，文章属于各自日期，原型正文完整提取', () => {
  const daily = Object.values(issues).flatMap(issue => issue.articles);
  const all = [...daily, ...intelligence];
  assert.equal(new Set(all.map(article => article.id)).size, all.length);
  assert.equal(daily.length, 6);
  assert.equal(intelligence.length, 8);
  for (const [date, issue] of Object.entries(issues)) {
    assert.equal(issue.articles.length, 2);
    assert.equal(issue.summary.length, 2);
    for (const article of issue.articles) { assert.equal(article.date, date); assert.ok(article.title && article.body && article.takeaways.length); }
  }
});
