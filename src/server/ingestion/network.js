import http from 'node:http';
import https from 'node:https';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { createGunzip, createInflate, createBrotliDecompress } from 'node:zlib';
import { AppError } from '../errors.js';

async function resolveAddress(hostname,signal) {
  signal.throwIfAborted();
  let cancel;
  try {
    return await Promise.race([lookup(hostname,{all:true}),new Promise((_,reject)=>{cancel=()=>reject(signal.reason);signal.addEventListener('abort',cancel,{once:true});})]);
  } finally {signal.removeEventListener('abort',cancel);}
}

export function normalizeUrl(value, { article = false, base } = {}) {
  let url;
  try { url = new URL(value, base); } catch { throw new AppError('请输入有效的 HTTP 或 HTTPS 地址'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.href.length > 2048) {
    throw new AppError('地址必须为 HTTP/HTTPS，且不能包含用户名或密码');
  }
  url.hash = '';
  if (article) {
    for (const key of [...url.searchParams.keys()]) if (/^(utm_|fbclid$|gclid$)/i.test(key)) url.searchParams.delete(key);
    if (url.pathname === '/' && !url.search) return null;
  }
  return url.href;
}

export function isPublicAddress(address) {
  if (isIP(address) === 4) {
    const [a,b] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && [0,168].includes(b)) || (a === 100 && b >= 64 && b <= 127) || (a === 198 && [18,19,51].includes(b)) || (a === 203 && b === 0));
  }
  if (isIP(address) === 6) {
    const normalized = address.toLowerCase();
    // Restrict IPv6 to global unicast; this also excludes mapped private IPv4.
    return /^[23][0-9a-f]{3}:/.test(normalized) && !normalized.startsWith('2001:db8:');
  }
  return false;
}

export async function readRemote(input, { signal, headers = {}, timeoutMs = 12000, maxBytes = 2 * 1024 * 1024, allowLocalNetwork = false, redirects = 0 } = {}) {
  if (redirects > 4) throw new AppError('重定向次数过多', 502, 'feed_redirect');
  const url = new URL(normalizeUrl(input));
  const requestSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs);
  let addresses;
  try { addresses = await resolveAddress(url.hostname.replace(/^\[|\]$/g, ''), requestSignal); }
  catch { throw new AppError(requestSignal.aborted?'请求超时或任务已取消':'域名解析失败，请检查信源地址或网络', 502, 'dns_failed'); }
  if (!addresses.length || (!allowLocalNetwork && addresses.some(({address}) => !isPublicAddress(address)))) {
    throw new AppError('信源必须使用公网地址，不能访问本机或内网服务', 400, 'private_address');
  }
  const address = addresses[0];
  return new Promise((resolve, reject) => {
    const request = (url.protocol === 'https:' ? https : http).request(url, {
      method: 'GET', signal: requestSignal,
      headers: { 'User-Agent': 'SignalDesk/0.1 RSS Reader', Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5', 'Accept-Encoding': 'identity', ...headers },
      lookup: (_host, options, callback) => options?.all ? callback(null, [address]) : callback(null, address.address, address.family),
    }, response => {
      const status = response.statusCode;
      if ([301,302,303,307,308].includes(status)) {
        response.resume();
        if (!response.headers.location) return reject(new AppError('信源重定向缺少地址', 502, 'feed_redirect'));
        let next;
        try { next = normalizeUrl(response.headers.location, {base: url.href}); } catch (error) { return reject(error); }
        readRemote(next, {signal: requestSignal, headers, timeoutMs, maxBytes, allowLocalNetwork, redirects: redirects + 1}).then(resolve, reject);
        return;
      }
      if (status === 304) { response.resume(); return resolve({ status, headers: response.headers, text: '', url: url.href }); }
      if (status < 200 || status >= 300) { response.resume(); return reject(new AppError(`信源返回 HTTP ${status}`, 502, 'feed_http')); }
      if (Number(response.headers['content-length']) > maxBytes) { response.destroy(); return reject(new AppError('信源响应过大，请使用较短的订阅源', 502, 'feed_size')); }
      const encoding = response.headers['content-encoding'];
      const decoder = encoding === 'gzip' ? createGunzip() : encoding === 'deflate' ? createInflate() : encoding === 'br' ? createBrotliDecompress() : null;
      let rawBytes = 0;
      response.on('data', chunk => { rawBytes += chunk.length; if (rawBytes > maxBytes) response.destroy(new AppError('信源响应超过大小限制', 502, 'feed_size')); });
      const stream = decoder ? response.pipe(decoder) : response;
      const chunks = []; let size = 0;
      stream.on('data', chunk => { size += chunk.length; if (size > maxBytes) { stream.destroy(); response.destroy(); reject(new AppError('解压后的内容过大', 502, 'feed_size')); } else chunks.push(chunk); });
      stream.once('end', () => resolve({status, text: Buffer.concat(chunks).toString('utf8'), headers: response.headers, url: url.href}));
      stream.once('error', reject); response.once('error', reject);
    });
    request.once('error', error => reject(error instanceof AppError ? error : new AppError(requestSignal.aborted ? '请求超时或任务已取消' : '无法连接信源，请检查网络后重试', 502, 'network_failed')));
    request.end();
  });
}
