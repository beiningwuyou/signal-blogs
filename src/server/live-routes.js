import { requireValue } from './errors.js';

export async function handleLiveRoute(req,url,live,readJson) {
  const pathname=url.pathname;
  if(!pathname.startsWith('/api/live/')) return null;
  if(['GET','HEAD'].includes(req.method)) {
    if(pathname==='/api/live/status') return {value:live.status()};
    if(pathname==='/api/live/sources') return {value:live.sources()};
    if(pathname==='/api/live/events') return {value:live.events(Object.fromEntries(url.searchParams))};
    if(pathname==='/api/live/visited-events') return {value:live.visitedEvents()};
    const event=pathname.match(/^\/api\/live\/events\/(evt-[a-f0-9-]+)$/);
    if(event)return {value:live.event(event[1])};
    const job=pathname.match(/^\/api\/live\/jobs\/(job-[a-f0-9-]+)$/);
    if(job)return {value:live.job(job[1])};
    return {status:404,value:{error:'not_found',message:'接口不存在'}};
  }
  if(pathname.startsWith('/api/live/sources/') && req.method==='DELETE') {
    const source=pathname.match(/^\/api\/live\/sources\/(src-[a-f0-9-]+)$/);
    if(source) return {value:live.deleteSource(source[1])};
  }
  requireValue(!req.headers.origin || req.headers.origin===`http://${req.headers.host}`,'只允许当前本机应用修改数据',403,'forbidden_origin');
  requireValue(req.headers['sec-fetch-site']!=='cross-site','拒绝跨站写入',403,'forbidden_origin');
  requireValue(req.headers['content-type']?.startsWith('application/json'),'请求需要使用 JSON',415,'json_required');
  const input=await readJson(req);
  if(req.method==='POST') {
    if(pathname==='/api/live/sources')return {status:201,value:live.saveSource(input)};
    if(pathname==='/api/live/sources/seed')return {value:live.seedSources(input)};
    if(pathname==='/api/live/sources/test')return {value:await live.testSource(input)};
    if(pathname==='/api/live/fetch')return {status:202,value:live.startJob('fetch',input)};
    if(pathname==='/api/live/research')return {status:202,value:live.startJob('research',input)};
  }
  const source=pathname.match(/^\/api\/live\/sources\/(src-[a-f0-9-]+)$/);
  if(req.method==='PUT' && source)return {value:live.saveSource(input,source[1])};
  const record=pathname.match(/^\/api\/live\/events\/(evt-[a-f0-9-]+)\/record$/);
  if(req.method==='PATCH' && record)return {value:live.record(record[1],input)};
  return {status:405,value:{error:'method_not_allowed',message:'不支持该操作'}};
}
