import { randomUUID } from 'node:crypto';
import { CATEGORIES, SOURCE_KINDS, MAX_NOTE_LENGTH } from '../shared/contracts.js';
import { AppError, requireValue } from './errors.js';
import * as store from './db.js';
import { normalizeUrl } from './ingestion/network.js';
import { fetchFeed, normalizedTitle } from './ingestion/rss.js';
import { titleSimilarity } from './ingestion/aggregation.js';

export function validateSource(input,id) {
  requireValue(input && typeof input==='object' && !Array.isArray(input),'信源配置格式无效');
  requireValue(Object.keys(input).every(key=>['name','url','kind','category','enabled'].includes(key)),'信源配置包含不支持的字段');
  requireValue(typeof input.name==='string' && input.name.trim().length>0 && input.name.trim().length<=120,'信源名称需要 1–120 个字符');
  requireValue(typeof input.url==='string','请填写订阅地址');
  requireValue(SOURCE_KINDS.includes(input.kind),'请选择 RSS、播客或长视频类型');
  requireValue(CATEGORIES.includes(input.category),'请选择有效分类');
  requireValue(typeof input.enabled==='boolean','启用状态无效');
  return {id:id || `src-${randomUUID()}`,name:input.name.trim(),url:normalizeUrl(input.url),kind:input.kind,category:input.category,enabled:input.enabled};
}

export function createLiveService(db, {allowLocalNetwork=false,timeoutMs=12000,fetchFeedImpl=fetchFeed}={}) {
  store.recoverJobs(db);
  const active=new Map();
  let closing=false;
  const fetchOptions={allowLocalNetwork,timeoutMs};
  const sourceInput=(input,id)=>{
    const source=validateSource(input,id);
    if(id) requireValue(store.getSource(db,id),'没有找到这个信源',404);
    requireValue(!store.listSources(db).some(other=>other.id!==id && other.url===source.url),'该订阅地址已存在',409,'duplicate_source');
    return source;
  };
  const status=()=>({sources:store.listSources(db),jobs:store.listJobs(db),lastFetchSuccessAt:store.metadata(db,'last_fetch_success_at'),lastResearchSuccessAt:store.metadata(db,'last_research_success_at'),tools:[{id:'metadata',name:'频道元数据研究',available:true,description:'分析 RSS/Atom 标题、简介和订阅内正文；不冒充完整音视频内容。'}]});

  async function run(job,controller) {
    const queue=[...job.sources];
    const worker=async()=>{
      while(queue.length && !controller.signal.aborted) {
        const entry=queue.shift();
        const source=store.getSource(db,entry.source_id);
        store.sourceJobStarted(db,job.id,source.id);
        try {
          const result=await fetchFeedImpl(source,{...fetchOptions,signal:controller.signal,test:job.kind==='research'});
          if(controller.signal.aborted) break;
          if(job.kind==='research' && !result.items.length) throw new AppError('频道没有可研究的条目，请检查订阅内容',422,'empty_channel');
          store.ingestSource(db,source,result,job,{normalizeTitle:normalizedTitle,similarity:titleSimilarity,newId:()=>`evt-${randomUUID()}`});
        } catch(error) {
          if(controller.signal.aborted) break;
          const message=error instanceof AppError ? error.message : '处理信源失败，已有内容已保留，请重试';
          store.sourceJobFailed(db,job.id,source.id,message);
        }
      }
    };
    try { await Promise.all(Array.from({length:Math.min(3,queue.length)},worker)); }
    finally { store.finishJob(db,job.id,controller.signal.aborted); active.delete(job.id); }
  }
  function startJob(kind,input={}) {
    requireValue(!closing,'服务正在关闭，请稍后重试',503);
    requireValue(!store.listJobs(db).some(job=>job.kind===kind && job.state==='running'),'同类任务正在运行，请等待完成',409,'job_running');
    requireValue(input && typeof input==='object' && Object.keys(input).every(key=>['sourceIds','retryJobId','tool'].includes(key)),'任务参数无效');
    let selected;
    if(input.retryJobId) {
      requireValue(typeof input.retryJobId==='string','重试任务编号无效');
      const previous=store.getJob(db,input.retryJobId);
      requireValue(previous && previous.kind===kind,'没有找到可重试的任务',404);
      requireValue(previous.state!=='running','任务仍在运行',409);
      selected=previous.sources.filter(source=>source.state!=='completed').map(source=>source.source_id);
    } else if(kind==='fetch') selected=store.listSources(db,'rss').filter(source=>source.enabled).map(source=>source.id);
    else {
      requireValue(Array.isArray(input.sourceIds) && input.sourceIds.length>0 && input.sourceIds.length<=100,'请至少选择一个频道');
      selected=[...new Set(input.sourceIds)];
    }
    requireValue(selected.length>0,kind==='fetch'?'请先添加并启用 RSS 信源':'没有待研究或可重试的频道');
    for(const id of selected) {
      requireValue(typeof id==='string','信源编号无效');
      const source=store.getSource(db,id);
      requireValue(source && source.enabled,'所选信源不存在或已停用');
      requireValue(kind==='fetch'?source.kind==='rss':source.kind!=='rss','RSS 获取与频道研究需要分别操作');
    }
    requireValue(!input.tool || input.tool==='metadata','所选研究工具未配置或不可用');
    const job=store.createJob(db,{id:`job-${randomUUID()}`,kind,sourceIds:selected,parentId:input.retryJobId || null});
    const controller=new AbortController();
    const promise=Promise.resolve().then(()=>run(job,controller));
    active.set(job.id,{controller,promise});
    return job;
  }

  return {
    status,
    sources:()=>store.listSources(db),
    saveSource(input,id) {return store.putSource(db,sourceInput(input,id));},
    deleteSource(id) {
      requireValue(id && typeof id === 'string', '信源编号无效');
      const ok = store.deleteSource(db, id);
      requireValue(ok, '信源不存在', 404);
      return { deleted: true, id };
    },
    seedSources(list) {
      requireValue(Array.isArray(list), '信源列表无效');
      let added = 0;
      for (const item of list) {
        try {
          const valid = sourceInput(item, item.id);
          store.putSource(db, valid);
          added++;
        } catch {
          // ignore duplicate or validation error
        }
      }
      return { seeded: added, total: store.listSources(db).length };
    },
    async testSource(input) {
      const source=validateSource(input,'test-source');
      const started=Date.now();
      const result=await fetchFeedImpl(source,{...fetchOptions,test:true});
      return {title:result.title,itemCount:result.items.length,skipped:result.skipped,truncated:result.truncated,durationMs:Date.now()-started,checkedAt:new Date().toISOString()};
    },
    startJob,
    job(id) {const result=store.getJob(db,id);requireValue(result,'任务不存在',404);return result;},
    events(query) {
      requireValue(['featured','all','bookmarks'].includes(query.scope || 'featured'),'事件范围无效');
      requireValue(!query.category || CATEGORIES.includes(query.category),'分类无效');
      requireValue(!query.q || query.q.length<=200,'搜索内容最多 200 个字符');
      return store.listEvents(db,query);
    },
    event(id) {const result=store.getEvent(db,id);requireValue(result,'事件不存在',404);return result;},
    visitedEvents() { return store.listVisitedEvents(db); },
    record(id,input) {
      requireValue(input && typeof input==='object' && !Array.isArray(input),'记录格式无效');
      requireValue(Object.keys(input).every(key=>['bookmarked','read','note','visitedAt','expectedRevision'].includes(key)),'记录包含未知字段');
      const {expectedRevision,...patch}=input;
      requireValue(Object.keys(patch).length>0,'没有需要保存的改动');
      for(const key of ['bookmarked','read']) requireValue(!(key in patch) || typeof patch[key]==='boolean','状态值必须是布尔值');
      if('note' in patch) {
        requireValue(typeof patch.note==='string' && patch.note.length<=MAX_NOTE_LENGTH,'个人判断最多 500 字');
        requireValue(Number.isInteger(expectedRevision) && expectedRevision>=0,'保存笔记需要当前记录版本');
      }
      requireValue(!('visitedAt' in patch) || (typeof patch.visitedAt==='string' && Number.isFinite(Date.parse(patch.visitedAt))),'访问时间无效');
      const result=store.saveEventRecord(db,id,patch,expectedRevision);
      requireValue(!result.missing,'事件不存在',404);
      if(result.conflict) {const error=new AppError('这篇事件的记录已被其他窗口修改。草稿已保留，请载入最新记录后重试。',409,'record_conflict');error.current=result.current;throw error;}
      return result;
    },
    async close() {
      closing=true;
      const jobs=[...active.values()];
      jobs.forEach(({controller})=>controller.abort());
      await Promise.allSettled(jobs.map(({promise})=>promise));
    },
  };
}
