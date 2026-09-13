import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtemp,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {startServer} from '../src/server/app.js';
import {openDatabase,readWorkspace} from '../src/server/db.js';
import {isPublicAddress,normalizeUrl} from '../src/server/ingestion/network.js';
import {parseFeed} from '../src/server/ingestion/rss.js';

const title='Anthropic 发布全新代码研究工具与开发者工作流';
const item=(id,label=title,body='官方介绍了开发者工作流，并提供使用示例。',date='Tue, 08 Sep 2026 08:00:00 GMT',link=`https://publisher.example/articles/${id}`)=>`<item><guid>${id}</guid><title>${label}</title>${link?`<link>${link}</link>`:''}${date?`<pubDate>${date}</pubDate>`:''}<description>${body}</description></item>`;
const rss=items=>`<?xml version="1.0"?><rss version="2.0"><channel><title>测试信源</title><link>https://publisher.example/</link><description>受控测试</description>${items}</channel></rss>`;
async function waitJob(api,id) {
  const deadline=Date.now()+10000;
  while(Date.now()<deadline) {const result=await api(`/jobs/${id}`); if(result.state!=='running')return result;await new Promise(resolve=>setTimeout(resolve,20));}
  throw new Error('任务未在期限内结束');
}

test('RSS真实HTTP闭环：去重聚合、个人记录、批次标记、失败保留与频道研究',async()=>{
  const dataDir=await mkdtemp(path.join(tmpdir(),'signal-live-test-'));
  let mode='initial'; let sourceBFailed=false; let allFailed=false; let requests=[];
  const feeds=http.createServer((req,res)=>{
    requests.push(req.url);
    if(allFailed || (sourceBFailed && req.url==='/b')) {res.writeHead(503);res.end('offline');return;}
    res.setHeader('Content-Type','application/rss+xml');
    if(req.url==='/channel') {res.end(rss(item('episode','工程播客：代码代理的可靠性与证据分析')));return;}
    if(req.url==='/empty') {res.end(rss(''));return;}
    if(req.url==='/b') {res.end(rss(item('b-report')));return;}
    const body=mode==='changed' || mode==='new' ? '更新后的官方说明新增了沙盒隔离和运行时验证的具体步骤。' : '官方介绍了开发者工作流，并提供使用示例。';
    const time=mode==='time-only'?'Tue, 08 Sep 2026 09:00:00 GMT':'Tue, 08 Sep 2026 08:00:00 GMT';
    res.end(rss(item('a-report',title,body,time)+item('unknown','没有发布时间或原文地址的测试事件','仅有摘要',null,null)+(mode==='new'?item('new-report','新发布的端侧语音芯片公布性能测试结果'):'')));
  });
  await new Promise(resolve=>feeds.listen(0,'127.0.0.1',resolve));
  const feedUrl=`http://127.0.0.1:${feeds.address().port}`;
  let server=await startServer({dataDir,ingestionOptions:{allowLocalNetwork:true,timeoutMs:1000}});
  const response=(endpoint,body,method='POST')=>fetch(`${server.url}/api/live${endpoint}`,body===undefined?{}:{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const api=async(endpoint,body,method)=>{const result=await response(endpoint,body,method);const data=await result.json();assert.ok(result.ok,JSON.stringify(data));return data;};
  const create=(name,endpoint,kind='rss')=>api('/sources',{name,url:`${feedUrl}${endpoint}`,kind,category:'AI 公司',enabled:true});
  try {
    assert.deepEqual(await api('/events'),[]);
    assert.equal((await response('/fetch',{})).status,400);
    const a=await create('信源甲','/a');const b=await create('信源乙','/b');const channel=await create('播客频道','/channel','podcast');
    assert.equal((await response('/sources',{name:'重复',url:`${feedUrl}/a#fragment`,kind:'rss',category:'AI 公司',enabled:true})).status,409);
    assert.equal((await response('/sources',{name:' ',url:`${feedUrl}/x`,kind:'rss',category:'AI 公司',enabled:true})).status,400);
    const test=await api('/sources/test',{name:'信源甲',url:`${feedUrl}/a`,kind:'rss',category:'AI 公司',enabled:true});assert.equal(test.itemCount,2);assert.deepEqual(await api('/events'),[]);
    requests=[];
    const first=await waitJob(api,(await api('/fetch',{})).id);
    assert.equal(first.state,'completed');assert.equal(requests.includes('/channel'),false);
    let events=await api('/events?scope=all');assert.equal(events.length,2);assert.ok(events.every(event=>!event.marker));
    const main=events.find(event=>event.title===title);assert.equal(main.articleCount,2);assert.equal(main.sourceCount,2);
    const unknown=await api(`/events/${events.find(event=>event.id!==main.id).id}`);assert.equal(unknown.materials[0].publishedAt,null);assert.equal(unknown.materials[0].url,null);assert.equal(unknown.timeline.length,0);
    const record=await api(`/events/${main.id}/record`,{note:'保留个人判断',expectedRevision:0},'PATCH');
    await api(`/events/${main.id}/record`,{bookmarked:true},'PATCH');
    await api(`/events/${main.id}/record`,{bookmarked:false},'PATCH');
    assert.equal((await api(`/events/${main.id}`)).record.note,'保留个人判断');
    assert.equal((await response(`/events/${main.id}/record`,{note:'冲突内容',expectedRevision:record.revision},'PATCH')).status,409);
    assert.equal((await response(`/events/${main.id}/record`,{note:'字'.repeat(501),expectedRevision:3},'PATCH')).status,400);
    const repeated=await waitJob(api,(await api('/fetch',{})).id);assert.equal(repeated.new_count,0);assert.equal(repeated.updated_count,0);
    mode='time-only';await waitJob(api,(await api('/fetch',{})).id);assert.ok((await api('/events?scope=all')).every(event=>!event.marker));
    mode='changed';await waitJob(api,(await api('/fetch',{})).id);events=await api('/events?scope=all');assert.equal(events.find(event=>event.id===main.id).marker.kind,'updated');assert.equal((await api(`/events/${main.id}`)).record.note,'保留个人判断');
    mode='new';await waitJob(api,(await api('/fetch',{})).id);events=await api('/events?scope=all');assert.equal(events.length,3);assert.equal(events.find(event=>event.title.startsWith('新发布')).marker.kind,'new');
    await waitJob(api,(await api('/fetch',{})).id);assert.ok((await api('/events?scope=all')).every(event=>!event.marker));
    sourceBFailed=true;const partial=await waitJob(api,(await api('/fetch',{})).id);assert.equal(partial.state,'partial');assert.equal(partial.failed,1);
    const successAt=(await api('/status')).lastFetchSuccessAt;
    allFailed=true;const failed=await waitJob(api,(await api('/fetch',{})).id);assert.equal(failed.state,'failed');assert.equal((await api('/status')).lastFetchSuccessAt,successAt);assert.equal((await api('/events?scope=all')).length,3);
    allFailed=false;sourceBFailed=false;requests=[];await waitJob(api,(await api('/fetch',{retryJobId:partial.id})).id);assert.deepEqual(requests,['/b']);
    assert.equal((await response('/research',{sourceIds:[]})).status,400);
    const research=await waitJob(api,(await api('/research',{sourceIds:[channel.id]})).id);assert.equal(research.state,'completed');assert.equal(research.eventIds.length,1);assert.equal((await api(`/events/${research.eventIds[0]}`)).evidenceLevel,'metadata');
    const researchedAgain=await waitJob(api,(await api('/research',{sourceIds:[channel.id]})).id);assert.equal(researchedAgain.eventIds[0],research.eventIds[0]);assert.equal((await api(`/jobs/${research.id}`)).eventIds[0],research.eventIds[0]);assert.equal((await api(`/events?scope=all&jobId=${research.id}`)).length,1);
    const empty=await create('空频道','/empty','video');const noResults=await waitJob(api,(await api('/research',{sourceIds:[empty.id]})).id);assert.equal(noResults.state,'failed');assert.equal(noResults.eventIds.length,0);
    await server.close();server=await startServer({dataDir,ingestionOptions:{allowLocalNetwork:true}});
    assert.equal((await api(`/events/${main.id}`)).record.note,'保留个人判断');assert.equal((await api('/sources')).length,4);
    assert.equal((await fetch(`${server.url}/api/live/fetch`,{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:'{}'})).status,403);
    assert.equal((await api(`/events/${main.id}`)).id,main.id);
  } finally {await server.close();await new Promise(resolve=>feeds.close(resolve));await rm(dataDir,{recursive:true,force:true});}
});

test('迁移备份保留原笔记且重开不重复迁移',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'signal-migrate-'));
  try {
    let db=new DatabaseSync(path.join(dir,'signal-desk.sqlite'));
    db.exec('CREATE TABLE workspace_entries(id TEXT PRIMARY KEY,value TEXT NOT NULL,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)');
    db.prepare('INSERT INTO workspace_entries(id,value) VALUES (?,?)').run('demo-preserved',JSON.stringify({note:'原型笔记不能丢失'}));db.close();
    db=openDatabase(dir);assert.equal(readWorkspace(db)['demo-preserved'].note,'原型笔记不能丢失');db.close();
    const backups=await readdir(path.join(dir,'backups'));assert.equal(backups.length,1);
    const backup=new DatabaseSync(path.join(dir,'backups',backups[0]),{readOnly:true});assert.equal(JSON.parse(backup.prepare('SELECT value FROM workspace_entries').get().value).note,'原型笔记不能丢失');backup.close();
    db=openDatabase(dir);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM schema_migrations').get().n,2);db.close();assert.equal((await readdir(path.join(dir,'backups'))).length,1);
  } finally {await rm(dir,{recursive:true,force:true});}
});

test('地址、XML与Atom标准化边界',async()=>{
  for(const ip of ['127.0.0.1','10.0.0.1','192.168.1.1','169.254.169.254','::1','::ffff:127.0.0.1'])assert.equal(isPublicAddress(ip),false);
  assert.equal(isPublicAddress('8.8.8.8'),true);
  assert.equal(normalizeUrl('https://example.com/a?utm_source=x#x',{article:true}),'https://example.com/a');
  const missingIdFeed=date=>`<rss version="2.0"><channel><title>无ID</title><description>测试</description><item><title>只有标题的稳定条目</title><pubDate>${date}</pubDate><description>相同正文</description></item></channel></rss>`;
  const one=await parseFeed(missingIdFeed('Tue, 08 Sep 2026 08:00:00 GMT'),{id:'missing',url:'https://example.com/feed'});
  const two=await parseFeed(missingIdFeed('Tue, 08 Sep 2026 09:00:00 GMT'),{id:'missing',url:'https://example.com/feed'});
  assert.equal(one.items[0].id,two.items[0].id);assert.equal(one.items[0].fingerprint,two.items[0].fingerprint);
  assert.throws(()=>normalizeUrl('file:///etc/passwd'));assert.throws(()=>normalizeUrl('http://user:pass@example.com/rss'));
  const source={id:'atom',url:'https://example.com/feed'};
  const feed=await parseFeed('<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><title>Atom</title><entry><id>abc</id><title>测试 Atom 条目</title><link href="https://example.com/article"/><summary>&lt;script&gt;alert(1)&lt;/script&gt;安全摘要</summary></entry></feed>',source);
  assert.equal(feed.items[0].originalUrl,'https://example.com/article');assert.equal(feed.items[0].publishedAt,null);assert.equal(feed.items[0].description.includes('<script>'),false);
  await assert.rejects(parseFeed('<!DOCTYPE rss [<!ENTITY x SYSTEM "file:///etc/passwd">]><rss/>',source),/外部实体/);
});
