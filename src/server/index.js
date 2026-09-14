import { loadConfig } from './config.js';
import { startServer } from './app.js';

try {
  const service = await startServer({ ...loadConfig(), dev: process.argv.includes('--dev') });
  console.log(`Signal Blogs (私人日报) 已启动：${service.url}`);
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      service.close().then(() => process.exit(0)).catch(error => {
        console.error('关闭失败：', error.message);
        process.exit(1);
      });
    });
  }
} catch (error) {
  console.error('启动失败：', error.message);
  console.error('请确认依赖已安装；生产模式需要先运行 npm run build。');
  process.exitCode = 1;
}
