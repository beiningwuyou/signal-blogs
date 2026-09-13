import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openDatabase, readWorkspace } from '../src/server/db.js';
import { startServer } from '../src/server/app.js';

const dataDir = await mkdtemp(path.join(tmpdir(), 'signal-desk-smoke-'));
let service;
try {
  let db = openDatabase(dataDir);
  db.exec('CREATE TABLE smoke_check (value TEXT NOT NULL)');
  db.prepare('INSERT INTO smoke_check (value) VALUES (?)').run('持久化检查');
  db.close();
  db = openDatabase(dataDir);
  assert.equal(db.prepare('SELECT value FROM smoke_check').get().value, '持久化检查');
  db.close();

  for (const dev of [false, true]) {
    service = await startServer({ dataDir, dev });
    const health = await fetch(`${service.url}/api/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).database, 'ready');
    const page = await fetch(service.url);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /Signal Desk/);
    const script = html.match(/<script[^>]+src="([^"]+)"/)[1];
    const asset = await fetch(new URL(script, service.url));
    assert.equal(asset.status, 200);
    assert.match(asset.headers.get('content-type'), /javascript/);
    assert.equal((await fetch(`${service.url}/api/missing`)).status, 404);
    assert.equal((await fetch(`${service.url}/api/health`, { method: 'POST' })).status, 405);
    for (const route of ['/events', '/all', '/bookmarks', '/daily/2026-09-07', '/following?tag=NVDA', '/settings', '/reading']) {
      const response = await fetch(`${service.url}${route}`);
      assert.equal(response.status, 200);
      assert.match(await response.text(), /id="root"/);
    }
    const save = (id, value, headers = {}) => fetch(`${service.url}/api/workspace/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(value),
    });
    assert.equal((await save('demo-cowos', { note: '独立事件笔记', bookmarked: true, read: true })).status, 200);
    assert.equal((await save('demo-rsd', { note: '另一篇文章' })).status, 200);
    assert.equal((await save('demo-cowos', { note: '超'.repeat(501) })).status, 400);
    assert.equal((await save('demo-cowos', { note: '拒绝跨域写入' }, { Origin: 'https://unrelated.example' })).status, 403);
    assert.equal((await save('demo-cowos', { note: '拒绝非 JSON' }, { 'Content-Type': 'text/plain' })).status, 415);
    assert.equal((await save('demo-cowos', { read: 'yes' })).status, 400);
    assert.equal((await save('invalid-id', { note: '无效 ID' })).status, 400);
    assert.equal((await save('preferences', { sources: [{ name: '缺少字段' }] })).status, 400);
    assert.equal((await save('preferences', { dark: true, wide: false })).status, 200);
    const workspace = await (await fetch(`${service.url}/api/workspace`)).json();
    assert.equal(workspace['demo-cowos'].note, '独立事件笔记');
    assert.equal(workspace['demo-rsd'].note, '另一篇文章');
    if (!dev) assert.equal((await fetch(`${service.url}/package.json`)).status, 404);
    await service.close();
    service = undefined;
    console.log(`${dev ? '开发' : '生产'}服务、页面和静态资源检查通过`);
  }
  db = openDatabase(dataDir);
  assert.equal(readWorkspace(db)['demo-cowos'].bookmarked, true);
  assert.equal(readWorkspace(db)['demo-cowos'].note, '独立事件笔记');
  assert.equal(readWorkspace(db).preferences.dark, true);
  db.close();
  console.log('页面深链接、个人记录持久化、输入校验与同源写入检查通过');
  console.log('SQLite 重开后数据读取检查通过');
} finally {
  await service?.close();
  await rm(dataDir, { recursive: true });
}
