export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}
export async function request(endpoint, { method = 'GET', body, signal, timeout = 20000 } = {}) {
  let response;
  try {
    response = await fetch(`/api/live${endpoint}`, {
      method,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(timeout)])
        : AbortSignal.timeout(timeout),
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError('无法连接本地服务，请检查服务和网络后重试。', 0);
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError('服务响应格式异常，请重试。', response.status);
  }
  if (!response.ok) throw new ApiError(data.message || '操作失败，请重试。', response.status, data);
  return data;
}
export function displayTime(value, { dateOnly = false } = {}) {
  if (!value || !Number.isFinite(Date.parse(value))) return '未知';
  return new Intl.DateTimeFormat(
    'zh-CN',
    dateOnly
      ? { year: 'numeric', month: '2-digit', day: '2-digit' }
      : { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false },
  ).format(new Date(value));
}
export function copyEventText(event) {
  return `${event.title}\n\n${event.summary}\n\n原始材料：\n${event.materials.map((material) => `${material.source} · ${material.title}\n${material.url || '原文地址缺失'}`).join('\n\n')}`;
}

export async function copyText(text, { clipboard = navigator.clipboard, timeoutMs = 5000 } = {}) {
  if (!clipboard?.writeText) throw new Error('浏览器不支持剪贴板访问，请手动复制。');
  let timer;
  try {
    await Promise.race([
      clipboard.writeText(text),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('剪贴板访问未完成，请检查浏览器权限后重试。')),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export const getLiveSources = () => request('/sources');
export const saveLiveSource = (source, id) =>
  request(id ? `/sources/${id}` : '/sources', { method: id ? 'PUT' : 'POST', body: source });
export const deleteLiveSource = (id) => request(`/sources/${id}`, { method: 'DELETE' });
export const testLiveSource = (source) =>
  request('/sources/test', { method: 'POST', body: source });
export const seedLiveSources = (list) => request('/sources/seed', { method: 'POST', body: list });
export const startFetchJob = (input = {}) => request('/fetch', { method: 'POST', body: input });
export const getLiveJob = (id) => request(`/jobs/${id}`);
export const getLiveStatus = () => request('/status');
export const getLiveEvents = (query = {}) => {
  const params = new URLSearchParams(query);
  const qStr = params.toString();
  return request(qStr ? `/events?${qStr}` : '/events');
};
export const getLiveEvent = (id) => request(`/events/${id}`);
export const saveEventRecord = (id, patch) =>
  request(`/events/${id}/record`, { method: 'PATCH', body: patch });
export const getVisitedEvents = () => request('/visited-events');
