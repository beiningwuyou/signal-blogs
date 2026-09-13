import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { migrateDatabase } from './migrations.js';

export function openDatabase(dataDir) {
  mkdirSync(dataDir, { recursive: true });
  const file = path.join(dataDir, 'signal-desk.sqlite');
  const existingDatabase = existsSync(file);
  const db = new DatabaseSync(file);
  try {
    db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
    db.exec(`CREATE TABLE IF NOT EXISTS workspace_entries (
      id TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    migrateDatabase(db, dataDir, existingDatabase);
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

export function readWorkspace(db) {
  return Object.fromEntries(db.prepare('SELECT id, value FROM workspace_entries').all().map(row => [row.id, JSON.parse(row.value)]));
}

export function saveWorkspaceEntry(db, id, value) {
  db.prepare(`INSERT INTO workspace_entries (id, value) VALUES (?, ?)
    ON CONFLICT(id) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`).run(id, JSON.stringify(value));
}

export function transaction(db, operation) {
  db.exec('BEGIN IMMEDIATE');
  try { const result = operation(); db.exec('COMMIT'); return result; }
  catch (error) { db.exec('ROLLBACK'); throw error; }
}

const nowIso = () => new Date().toISOString();
const decodeSource = row => row && ({id:row.id,name:row.name,url:row.url,kind:row.kind,category:row.category,enabled:!!row.enabled,createdAt:row.created_at,lastSuccessAt:row.last_success_at,lastAttemptAt:row.last_attempt_at,error:row.error,etag:row.etag,modified:row.modified});
export function listSources(db, kind) {
  return (kind ? db.prepare('SELECT * FROM sources WHERE kind=? ORDER BY created_at,id').all(kind) : db.prepare('SELECT * FROM sources ORDER BY created_at,id').all()).map(decodeSource);
}
export function getSource(db,id) { return decodeSource(db.prepare('SELECT * FROM sources WHERE id=?').get(id)); }
export function putSource(db, source) {
  db.prepare(`INSERT INTO sources (id,name,url,kind,category,enabled,created_at) VALUES (?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name,url=excluded.url,kind=excluded.kind,category=excluded.category,enabled=excluded.enabled,
    etag=CASE WHEN sources.url=excluded.url THEN sources.etag ELSE NULL END,
    modified=CASE WHEN sources.url=excluded.url THEN sources.modified ELSE NULL END,
    last_success_at=CASE WHEN sources.url=excluded.url THEN sources.last_success_at ELSE NULL END,
    error=CASE WHEN sources.url=excluded.url THEN sources.error ELSE NULL END`).run(source.id,source.name,source.url,source.kind,source.category,Number(source.enabled),nowIso());
  return getSource(db,source.id);
}
export function deleteSource(db, id) {
  return transaction(db, () => {
    const source = db.prepare('SELECT id FROM sources WHERE id = ?').get(id);
    if (!source) return false;
    db.prepare('DELETE FROM job_sources WHERE source_id = ?').run(id);
    const matRows = db.prepare('SELECT id FROM materials WHERE source_id = ?').all(id);
    for (const m of matRows) {
      db.prepare('DELETE FROM event_materials WHERE material_id = ?').run(m.id);
      db.prepare('DELETE FROM event_changes WHERE material_id = ?').run(m.id);
      db.prepare('DELETE FROM materials WHERE id = ?').run(m.id);
    }
    const res = db.prepare('DELETE FROM sources WHERE id = ?').run(id);
    return res.changes > 0;
  });
}
export function recordSourceAttempt(db,id,error=null) { db.prepare('UPDATE sources SET last_attempt_at=?,error=? WHERE id=?').run(nowIso(),error,id); }
export function metadata(db,key) { return db.prepare('SELECT value FROM app_meta WHERE key=?').get(key)?.value || null; }
export function setMetadata(db,key,value) { db.prepare('INSERT INTO app_meta VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key,value); }

export function createJob(db,{id,kind,sourceIds,tool='metadata',parentId=null}) {
  return transaction(db,()=>{
    db.prepare('INSERT INTO jobs(id,kind,state,started_at,total,tool,parent_id) VALUES (?,?,?,?,?,?,?)').run(id,kind,'running',nowIso(),sourceIds.length,tool,parentId);
    const statement = db.prepare('INSERT INTO job_sources(job_id,source_id) VALUES (?,?)');
    for(const sourceId of sourceIds) statement.run(id,sourceId);
    return getJob(db,id);
  });
}
export function getJob(db,id) {
  const row = db.prepare('SELECT * FROM jobs WHERE id=?').get(id);
  if(!row) return null;
  return {...row,sources:db.prepare('SELECT js.*,s.name,s.url FROM job_sources js JOIN sources s ON s.id=js.source_id WHERE job_id=? ORDER BY s.name').all(id),eventIds:db.prepare('SELECT event_id FROM job_events WHERE job_id=?').all(id).map(item=>item.event_id)};
}
export function listJobs(db) { return db.prepare('SELECT id FROM jobs ORDER BY started_at DESC LIMIT 30').all().map(({id})=>getJob(db,id)); }
export function sourceJobStarted(db,jobId,sourceId) { db.prepare("UPDATE job_sources SET state='running' WHERE job_id=? AND source_id=?").run(jobId,sourceId); }
export function sourceJobFailed(db,jobId,sourceId,message) {
  transaction(db,()=>{
    recordSourceAttempt(db,sourceId,message);
    db.prepare("UPDATE job_sources SET state='failed',error=? WHERE job_id=? AND source_id=?").run(message,jobId,sourceId);
    db.prepare('UPDATE jobs SET done=done+1,failed=failed+1 WHERE id=?').run(jobId);
  });
}
export function finishJob(db,id,interrupted=false) {
  const job=db.prepare('SELECT * FROM jobs WHERE id=?').get(id);
  const state=interrupted?'interrupted':job.failed ? (job.succeeded?'partial':'failed') : 'completed';
  transaction(db,()=>{
    db.prepare('UPDATE jobs SET state=?,completed_at=?,error=? WHERE id=?').run(state,nowIso(),interrupted?'任务因服务停止而中断，请手动重试':null,id);
    if(job.succeeded && !interrupted) {
      setMetadata(db,`last_${job.kind}_success_at`,nowIso());
      setMetadata(db,`last_${job.kind}_success_job`,id);
    }
  });
  return getJob(db,id);
}
export function recoverJobs(db) {
  for(const {id} of db.prepare("SELECT id FROM jobs WHERE state='running'").all()) finishJob(db,id,true);
}

export function ingestSource(db,source,result,job, { normalizeTitle, similarity, newId }) {
  return transaction(db,()=>{
    let newCount=0,updatedCount=0;
    const fetchedAt=nowIso();
    const canMark=!!source.lastSuccessAt;
    for(const item of result.items) {
      const existing=db.prepare('SELECT * FROM materials WHERE source_id=? AND identity=?').get(source.id,item.identity);
      let event=existing ? db.prepare('SELECT e.* FROM events e JOIN event_materials em ON em.event_id=e.id WHERE em.material_id=?').get(existing.id) : null;
      if(existing && existing.fingerprint===item.fingerprint) {
        if(event)db.prepare('INSERT OR IGNORE INTO job_events VALUES (?,?)').run(job.id,event.id);
        continue;
      }
      const normalized=normalizeTitle(item.title);
      if(!event && item.originalUrl) event=db.prepare('SELECT e.* FROM events e JOIN event_materials em ON em.event_id=e.id JOIN materials m ON m.id=em.material_id WHERE m.original_url=? LIMIT 1').get(item.originalUrl);
      if(!event && item.publishedAt && normalized.length>=12) event=db.prepare('SELECT * FROM events WHERE normalized_title=? AND category=? AND updated_at BETWEEN ? AND ? ORDER BY discovered_at LIMIT 1').get(normalized,source.category,new Date(Date.parse(item.publishedAt)-7*86400000).toISOString(),new Date(Date.parse(item.publishedAt)+7*86400000).toISOString());
      if(!event && item.publishedAt) {
        const candidates=db.prepare('SELECT * FROM events WHERE category=? AND updated_at BETWEEN ? AND ? ORDER BY updated_at DESC LIMIT 100').all(source.category,new Date(Date.parse(item.publishedAt)-7*86400000).toISOString(),new Date(Date.parse(item.publishedAt)+7*86400000).toISOString());
        event=candidates.find(candidate=>similarity(normalized,candidate.normalized_title)>=0.88);
      }
      const isNew=!event;
      const eventId=event?.id || newId();
      const summary=(item.description || item.content || '该条目未提供摘要，请查看原始材料。').slice(0,1800);
      if(isNew) {
        db.prepare(`INSERT INTO events(id,title,normalized_title,summary,category,updated_at,discovered_at,evidence_level,research_job_id)
          VALUES (?,?,?,?,?,?,?,?,?)`).run(eventId,item.title,normalized,summary,source.category,item.publishedAt,fetchedAt,item.evidenceLevel,job.kind==='research'?job.id:null);
        newCount++;
      } else {
        updatedCount++;
        db.prepare('UPDATE events SET updated_at=?,title=?,summary=?,normalized_title=?,evidence_level=?,research_job_id=COALESCE(?,research_job_id) WHERE id=?')
          .run(canMark?fetchedAt:(event.updated_at || item.publishedAt),existing?item.title:event.title,existing?summary:event.summary,existing?normalized:event.normalized_title,item.evidenceLevel==='feed-content'?'feed-content':event.evidence_level,job.kind==='research'?job.id:null,eventId);
      }
      const materialId=existing?.id || item.id;
      db.prepare(`INSERT INTO materials(id,source_id,identity,title,original_url,published_at,description,content,fingerprint,evidence_level,fetched_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(id) DO UPDATE SET title=excluded.title,original_url=excluded.original_url,published_at=COALESCE(materials.published_at,excluded.published_at),description=excluded.description,content=excluded.content,fingerprint=excluded.fingerprint,evidence_level=excluded.evidence_level,fetched_at=excluded.fetched_at`)
        .run(materialId,source.id,item.identity,item.title,item.originalUrl,item.publishedAt,item.description,item.content,item.fingerprint,item.evidenceLevel,fetchedAt);
      db.prepare('INSERT OR IGNORE INTO event_materials VALUES (?,?)').run(eventId,materialId);
      db.prepare('INSERT OR IGNORE INTO job_events VALUES (?,?)').run(job.id,eventId);
      // Persist provenance for all ingestions; first historical loading is kept out of marker queries.
      db.prepare('INSERT OR IGNORE INTO event_changes(event_id,material_id,job_id,kind,description,occurred_at) VALUES (?,?,?,?,?,?)')
        .run(eventId,materialId,job.id,isNew?'new':'updated',`${canMark?'':'首次收录：'}${isNew?'收录新事件':existing?'原文标题或正文发生变化':`补充 ${source.name} 的相关报道`}`,item.publishedAt);
    }
    if(job.kind==='research') {
      // Repeated metadata research remains idempotent but exposes the persisted result entry points.
      db.prepare(`UPDATE events SET research_job_id=? WHERE id IN (SELECT em.event_id FROM event_materials em JOIN materials m ON m.id=em.material_id WHERE m.source_id=?)`).run(job.id,source.id);
    }
    db.prepare('UPDATE sources SET last_success_at=?,last_attempt_at=?,error=NULL,etag=COALESCE(?,etag),modified=COALESCE(?,modified) WHERE id=?').run(fetchedAt,fetchedAt,result.etag,result.modified,source.id);
    db.prepare("UPDATE job_sources SET state='completed',error=NULL,material_count=? WHERE job_id=? AND source_id=?").run(result.items.length,job.id,source.id);
    db.prepare('UPDATE jobs SET done=done+1,succeeded=succeeded+1,new_count=new_count+?,updated_count=updated_count+? WHERE id=?').run(newCount,updatedCount,job.id);
    return {newCount,updatedCount};
  });
}

const recordValue=row=>({bookmarked:!!row?.bookmarked,note:row?.note || '',read:!!row?.read,visitedAt:row?.visited_at || null,revision:row?.revision || 0});
export function eventRecord(db,id) { return recordValue(db.prepare('SELECT * FROM event_records WHERE event_id=?').get(id)); }
export function saveEventRecord(db,id,patch,expectedRevision) {
  return transaction(db,()=>{
    if(!db.prepare('SELECT 1 FROM events WHERE id=?').get(id)) return {missing:true};
    const previous=eventRecord(db,id);
    if('note' in patch && previous.revision!==expectedRevision) return {conflict:true,current:previous};
    const value={...previous,...patch};
    db.prepare(`INSERT INTO event_records(event_id,bookmarked,note,read,visited_at,revision,updated_at) VALUES (?,?,?,?,?,?,?)
      ON CONFLICT(event_id) DO UPDATE SET bookmarked=excluded.bookmarked,note=excluded.note,read=excluded.read,visited_at=excluded.visited_at,revision=excluded.revision,updated_at=excluded.updated_at`)
      .run(id,Number(value.bookmarked),value.note,Number(value.read),value.visitedAt,previous.revision+1,nowIso());
    return eventRecord(db,id);
  });
}

export function listEvents(db,{scope='featured',q='',category='',jobId=''}={}) {
  const clauses=[];const values=[];
  if(scope==='bookmarks') clauses.push('r.bookmarked=1');
  if(category) {clauses.push('e.category=?');values.push(category);}
  if(jobId) {clauses.push('EXISTS(SELECT 1 FROM job_events je WHERE je.event_id=e.id AND je.job_id=?)');values.push(jobId);}
  if(q.trim()) {
    clauses.push("(e.title LIKE ? ESCAPE '\\' OR e.summary LIKE ? ESCAPE '\\' OR EXISTS(SELECT 1 FROM event_materials ex JOIN materials mx ON mx.id=ex.material_id JOIN sources sx ON sx.id=mx.source_id WHERE ex.event_id=e.id AND sx.name LIKE ? ESCAPE '\\'))");
    const pattern=`%${q.trim().replace(/[\\%_]/g,'\\$&')}%`;values.push(pattern,pattern,pattern);
  }
  const rows=db.prepare(`SELECT e.*,r.bookmarked,r.read,r.note,r.revision,r.visited_at,
    COUNT(DISTINCT m.id) AS article_count,COUNT(DISTINCT m.source_id) AS source_count,
    JSON_GROUP_ARRAY(DISTINCT s.name) AS source_names,
    (SELECT m2.original_url FROM materials m2 JOIN event_materials em2 ON em2.material_id=m2.id WHERE em2.event_id=e.id AND m2.original_url IS NOT NULL ORDER BY COALESCE(m2.published_at,m2.fetched_at) DESC LIMIT 1) AS primary_url
    FROM events e JOIN event_materials em ON em.event_id=e.id JOIN materials m ON m.id=em.material_id JOIN sources s ON s.id=m.source_id
    LEFT JOIN event_records r ON r.event_id=e.id ${clauses.length?`WHERE ${clauses.join(' AND ')}`:''}
    GROUP BY e.id ORDER BY ${scope==='featured'?'source_count DESC,':''} e.updated_at DESC,e.discovered_at DESC,e.id ${scope==='featured'?'LIMIT 10':''}`).all(...values);
  const latest=metadata(db,'last_fetch_success_job');
  const markers=latest?db.prepare("SELECT event_id,kind,description FROM event_changes WHERE job_id=? AND description NOT LIKE '首次收录：%' ORDER BY kind DESC").all(latest):[];
  const markerMap=new Map(markers.map(marker=>[marker.event_id,marker]));
  return rows.map(row=>({id:row.id,title:row.title,summary:row.summary,category:row.category,updatedAt:row.updated_at,discoveredAt:row.discovered_at,evidenceLevel:row.evidence_level,articleCount:row.article_count,sourceCount:row.source_count,sources:JSON.parse(row.source_names),primaryUrl:row.primary_url||null,record:recordValue(row),marker:markerMap.get(row.id)||null,researchJobId:row.research_job_id}));
}
export function getEvent(db,id) {
  const row=db.prepare('SELECT * FROM events WHERE id=?').get(id);
  if(!row)return null;
  const materials=db.prepare('SELECT m.*,s.name AS source_name,s.kind AS source_kind FROM materials m JOIN event_materials em ON em.material_id=m.id JOIN sources s ON s.id=m.source_id WHERE em.event_id=? ORDER BY COALESCE(m.published_at,m.fetched_at) DESC,m.id').all(id);
  return {id:row.id,title:row.title,summary:row.summary,category:row.category,updatedAt:row.updated_at,discoveredAt:row.discovered_at,evidenceLevel:row.evidence_level,inference:row.inference,inferenceMaterialIds:JSON.parse(row.inference_material_ids||'[]'),record:eventRecord(db,id),materials:materials.map(item=>({id:item.id,title:item.title,url:item.original_url,publishedAt:item.published_at,description:item.description,content:item.content,evidenceLevel:item.evidence_level,source:item.source_name,sourceId:item.source_id,kind:item.source_kind})),timeline:materials.filter(item=>item.published_at && item.original_url).map(item=>({date:item.published_at,text:`${item.source_name} 发布：${item.title}`,materialId:item.id,url:item.original_url})).sort((a,b)=>a.date.localeCompare(b.date))};
}

// 查询用户有实际浏览记录（visited_at 不为空）的事件列表，按访问时间倒序排列。
// 用于「浏览足迹」页面展示真实访问历史。
export function listVisitedEvents(db) {
  const rows = db.prepare(`
    SELECT e.id, e.title, e.summary, e.category, e.updated_at, e.discovered_at, e.evidence_level,
           r.bookmarked, r.read, r.note, r.revision, r.visited_at,
           COUNT(DISTINCT m.id) AS article_count,
           JSON_GROUP_ARRAY(DISTINCT s.name) AS source_names,
           (SELECT m2.original_url FROM materials m2 JOIN event_materials em2 ON em2.material_id=m2.id
            WHERE em2.event_id=e.id AND m2.original_url IS NOT NULL
            ORDER BY COALESCE(m2.published_at,m2.fetched_at) DESC LIMIT 1) AS primary_url
    FROM event_records r
    JOIN events e ON e.id = r.event_id
    JOIN event_materials em ON em.event_id = e.id
    JOIN materials m ON m.id = em.material_id
    JOIN sources s ON s.id = m.source_id
    WHERE r.visited_at IS NOT NULL
    GROUP BY e.id
    ORDER BY r.visited_at DESC
    LIMIT 200
  `).all();
  return rows.map(row => ({
    id: row.id,
    title: row.title,
    summary: row.summary,
    category: row.category,
    updatedAt: row.updated_at,
    discoveredAt: row.discovered_at,
    evidenceLevel: row.evidence_level,
    articleCount: row.article_count,
    sources: JSON.parse(row.source_names || '[]'),
    primaryUrl: row.primary_url || null,
    record: recordValue(row),
  }));
}
