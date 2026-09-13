import Parser from 'rss-parser';
import { createHash } from 'node:crypto';
import { normalizeUrl, readRemote } from './network.js';
import { AppError } from '../errors.js';

const parser = new Parser({ customFields: { item: ['content:encoded', 'media:description'] } });
export const hash = value => createHash('sha256').update(value).digest('hex');
export function plainText(value, limit = 30000) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|h[1-6]|li|blockquote|section|article)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, code) => { const number = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1),16) : Number(code); return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : ''; })
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, key) => ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '}[key]))
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, limit);
}
export function normalizedTitle(title) { return plainText(title).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ''); }
function validDate(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
}
export async function parseFeed(xml, source) {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new AppError('不支持带外部实体的订阅文件', 422, 'unsafe_xml');
  let feed;
  try { feed = await parser.parseString(xml); } catch { throw new AppError('无法解析 RSS/Atom，请确认这是订阅地址而非网页', 422, 'invalid_feed'); }
  if (!Array.isArray(feed.items)) throw new AppError('订阅内容缺少条目列表',422,'invalid_feed');
  const items = [];
  let skipped = 0;
  for (const item of feed.items.slice(0,200)) {
    const title = plainText(item.title,500);
    if (!title) { skipped++; continue; }
    let originalUrl = null;
    if (item.link) {
      try { originalUrl = normalizeUrl(item.link,{article:true,base:source.url}); } catch { originalUrl = null; }
    }
    const publishedAt = validDate(item.isoDate || item.pubDate);
    const description = plainText(item.contentSnippet || item.summary || item.description || item['media:description'],3000);
    const content = plainText(item['content:encoded'] || item.content || '',30000);
    const evidenceLevel = content.length > description.length + 160 ? 'feed-content' : 'metadata';
    const identity = originalUrl || (item.guid ? `guid:${String(item.guid).slice(0,2048)}` : `title:${normalizedTitle(title)}`);
    const fingerprint = hash(JSON.stringify([title,description,content,originalUrl]));
    items.push({id:`mat-${hash(`${source.id}|${identity}`).slice(0,32)}`,identity,title,originalUrl,publishedAt,description,content,fingerprint,evidenceLevel});
  }
  if (feed.items.length && !items.length) throw new AppError('订阅条目均缺少有效标题',422,'empty_feed');
  return {title:plainText(feed.title,200),items,skipped,truncated:feed.items.length > 200};
}
export async function fetchFeed(source, options = {}) {
  const headers = options.test ? {} : { ...(source.etag ? {'If-None-Match':source.etag} : {}), ...(source.modified ? {'If-Modified-Since':source.modified} : {}) };
  const response = await readRemote(source.url,{...options,headers});
  const data = response.status === 304 ? {items:[],title:source.name,skipped:0,truncated:false} : await parseFeed(response.text,source);
  return {...data,notModified:response.status===304,etag:response.headers.etag || null,modified:response.headers['last-modified'] || null};
}
