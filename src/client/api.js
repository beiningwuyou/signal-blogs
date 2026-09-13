export async function getHealth() {
  const response = await fetch('/api/health', {
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`本地服务返回 ${response.status}`);
  const data = await response.json();
  if (data.status !== 'ok' || data.database !== 'ready') {
    throw new Error('本地服务尚未就绪');
  }
  return data;
}
