import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = fileURLToPath(new URL('../../', import.meta.url));

export function loadConfig() {
  try {
    process.loadEnvFile(path.join(projectRoot, '.env'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const port = Number(process.env.SIGNAL_DESK_PORT || 8080);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('SIGNAL_DESK_PORT 必须是 1 到 65535 之间的整数');
  }
  return {
    port,
    dataDir: path.resolve(projectRoot, process.env.SIGNAL_DESK_DATA_DIR || 'data/local'),
  };
}
