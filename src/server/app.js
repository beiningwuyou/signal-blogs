import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { projectRoot } from './config.js';
import { openDatabase, readWorkspace, saveWorkspaceEntry } from './db.js';
import { createLiveService } from './live-service.js';
import { handleLiveRoute } from './live-routes.js';
import { randomUUID } from 'node:crypto';

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 65536) throw Object.assign(new Error('请求过大'), { status: 413 });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('JSON 格式错误'), { status: 400 }); }
}

function validEntry(id, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (id === 'preferences') {
    if (Object.keys(value).some(k => !['sources', 'dark', 'wide', 'role', 'hiddenHistory'].includes(k))) return false;
    if (['dark', 'wide'].some(k => k in value && typeof value[k] !== 'boolean')) return false;
    if ('role' in value && (typeof value.role !== 'string' || value.role.length > 64)) return false;
    if ('hiddenHistory' in value && (!Array.isArray(value.hiddenHistory) || value.hiddenHistory.length > 500 || value.hiddenHistory.some(x => typeof x !== 'string'))) return false;
    return !('sources' in value) || (Array.isArray(value.sources) && value.sources.length <= 100 && value.sources.every(source =>
      source && ['id', 'name', 'match', 'url', 'category'].every(key => typeof source[key] === 'string' && source[key].length <= 2048) &&
      /^https?:\/\/[^\s]+$/.test(source.url) && Number.isInteger(source.weight) && source.weight >= 0 && source.weight <= 100 && typeof source.enabled === 'boolean'
    ) && new Set(value.sources.map(s => s.id)).size === value.sources.length);
  }
  if (id === 'review_memo') {
    return (!('text' in value) || (typeof value.text === 'string' && value.text.length <= 5000)) &&
      (!('updatedAt' in value) || (typeof value.updatedAt === 'string' && Number.isFinite(Date.parse(value.updatedAt))));
  }
  if (id === 'review_todos') {
    return Array.isArray(value.todos) && value.todos.length <= 100;
  }
  if (id === 'thesis_vault') {
    return Array.isArray(value.list) && value.list.length <= 100;
  }
  if (!/^(demo-[a-z0-9-]+|art-\d{4}-\d{4}-\d{2}|exp-[a-z0-9-]+|topic-[a-z0-9-]+|node-[a-z0-9-]+|weekly-[a-z0-9-]+|role-[a-z0-9-]+)$/.test(id)) return false;
  if (Object.keys(value).some(k => !['bookmarked', 'read', 'note', 'visitedAt', 'followed'].includes(k))) return false;
  return (!('note' in value) || (typeof value.note === 'string' && value.note.length <= 500)) &&
    ['bookmarked', 'read', 'followed'].every(k => !(k in value) || typeof value[k] === 'boolean') &&
    (!('visitedAt' in value) || value.visitedAt === null || (typeof value.visitedAt === 'string' && Number.isFinite(Date.parse(value.visitedAt))));
}

function json(res, code, value) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
}

export async function startServer({ dataDir, port = 0, dev = false, ingestionOptions }) {
  const db = openDatabase(dataDir);
  const live = createLiveService(db, ingestionOptions);
  const distDir = path.join(projectRoot, 'dist');
  let vite;
  const server = http.createServer(async (req, res) => {
    const requestId = randomUUID();
    res.setHeader('X-Request-Id', requestId);
    try {
      // 仅提供本机入口，拒绝通过其他主机名访问本地服务。
      const host = new URL(`http://${req.headers.host || ''}`).hostname;
      if (!['127.0.0.1', 'localhost'].includes(host)) return json(res, 403, { error: 'forbidden_host' });
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const liveResult = await handleLiveRoute(req, new URL(req.url, 'http://localhost'), live, readJson);
      if (liveResult) return json(res, liveResult.status || 200, liveResult.value);
      if (pathname.startsWith('/api/workspace/') && req.method === 'PUT') {
        // JSON writes are same-origin only, including when embedded in an unrelated site.
        if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) return json(res, 403, { error: 'forbidden_origin' });
        if (req.headers['sec-fetch-site'] === 'cross-site') return json(res, 403, { error: 'forbidden_origin' });
        if (!req.headers['content-type']?.startsWith('application/json')) return json(res, 415, { error: 'json_required' });
        const id = pathname.slice('/api/workspace/'.length);
        const value = await readJson(req);
        if (!validEntry(id, value)) return json(res, 400, { error: 'invalid_entry' });
        saveWorkspaceEntry(db, id, value);
        return json(res, 200, { saved: true });
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.setHeader('Allow', 'GET, HEAD');
        return json(res, 405, { error: 'method_not_allowed' });
      }
      if (pathname === '/api/health') {
        db.prepare('SELECT 1').get();
        return json(res, 200, { status: 'ok', database: 'ready', stage: 'live', port: server.address()?.port || port });
      }
      if (pathname === '/api/workspace') return json(res, 200, readWorkspace(db));
      if (pathname.startsWith('/api/')) return json(res, 404, { error: 'not_found' });
      if (vite) return vite.middlewares(req, res);

      const appRoute = /^\/(personal|following|reading|history|review|events|all|bookmarks|explore|daily|weekly|topics|timeline|podcast|settings)(\/[^.]*)?\/?$/.test(pathname);
      const file = path.resolve(distDir, `.${pathname === '/' || appRoute ? '/index.html' : pathname}`);
      if (!file.startsWith(`${distDir}${path.sep}`)) return json(res, 404, { error: 'not_found' });
      const content = await readFile(file);
      res.writeHead(200, {
        'Content-Type': contentTypes[path.extname(file)] || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self'; img-src 'self' data: https:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
      });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) {
      if (error.status) return json(res, error.status, { error: error.code || 'request_failed', message: error.message, ...(error.current ? { current: error.current } : {}), requestId });
      if (error.code === 'ENOENT' || error.code === 'EISDIR') return json(res, 404, { error: 'not_found' });
      if (error instanceof URIError || error.code === 'ERR_INVALID_URL') return json(res, 400, { error: 'bad_request' });
      console.error(JSON.stringify({ level: 'error', message: '本地请求失败', requestId, code: error.code || 'internal_error' }));
      json(res, 500, { error: 'internal_error' });
    }
  });

  try {
    if (dev) {
      const { createServer } = await import('vite');
      vite = await createServer({
        root: projectRoot,
        server: { middlewareMode: true, hmr: { server }, fs: { strict: true, allow: [projectRoot] } },
        appType: 'spa',
      });
    } else {
      await readFile(path.join(distDir, 'index.html'));
    }
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '127.0.0.1', resolve);
    });
  } catch (error) {
    await live.close();
    await vite?.close();
    db.close();
    throw error;
  }

  let closed = false;
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    async close() {
      if (closed) return;
      closed = true;
      await live.close();
      await vite?.close();
      await new Promise((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
        server.closeAllConnections();
      });
      db.close();
    },
  };
}
