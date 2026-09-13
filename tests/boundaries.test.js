import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {readRemote} from '../src/server/ingestion/network.js';
import {openDatabase,createJob,listJobs} from '../src/server/db.js';
import {createLiveService} from '../src/server/live-service.js';

test('受限网络读取：拒绝私网、超时、压缩膨胀和重定向循环',async()=>{
  const server=http.createServer((req,res)=>{
    if(req.url==='/slow')return;
    if(req.url==='/redirect'){res.writeHead(302,{Location:'/redirect'});res.end();return;}
    if(req.url==='/compressed'){res.setHeader('Content-Encoding','gzip');res.end(gzipSync('x'.repeat(10000)));return;}
    res.end('x'.repeat(1000));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}`;
  const options={allowLocalNetwork:true,timeoutMs:200,maxBytes:500};
  try {
    await assert.rejects(readRemote(url),error=>error.code==='private_address');
    await assert.rejects(readRemote(`${url}/slow`,options),/超时/);
    await assert.rejects(readRemote(url,options),/大小|过大/);
    await assert.rejects(readRemote(`${url}/compressed`,options),/过大/);
    await assert.rejects(readRemote(`${url}/redirect`,options),/重定向/);
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});

test('任务防重复、关闭中断与异常退出恢复',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'signal-job-boundary-'));
  const db=openDatabase(dir);
  const blockingFetch=(_,{signal})=>new Promise((_,reject)=>{if(signal.aborted)reject(signal.reason);else signal.addEventListener('abort',()=>reject(signal.reason),{once:true});});
  let service=createLiveService(db,{fetchFeedImpl:blockingFetch});
  try{
    const source=service.saveSource({name:'中断测试',url:'https://example.com/rss',kind:'rss',category:'行业',enabled:true});
    const first=service.startJob('fetch',{});
    assert.throws(()=>service.startJob('fetch',{}),/正在运行/);
    await Promise.resolve();await service.close();assert.equal(service.job(first.id).state,'interrupted');
    createJob(db,{id:'job-crash',kind:'fetch',sourceIds:[source.id]});
    service=createLiveService(db,{fetchFeedImpl:blockingFetch});
    assert.equal(listJobs(db).find(job=>job.id==='job-crash').state,'interrupted');
    const retry=service.startJob('fetch',{retryJobId:first.id});assert.equal(retry.total,1);
  }finally{await service.close();db.close();await rm(dir,{recursive:true,force:true});}
});
