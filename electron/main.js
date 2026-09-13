import { app, BrowserWindow, dialog, shell } from 'electron';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { startServer } from '../src/server/app.js';

const smoke = process.argv.includes('--smoke-test');
// 骨架使用独立名称，避免与上级旧原型的用户数据混用。
app.setName('Signal Desk Skeleton');
let service;
let smokeDir;
let stopping = false;
let exitCode = 0;

async function createWindow() {
  const win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 480, minHeight: 500,
    show: !smoke, title: 'Signal Desk', backgroundColor: '#faf9f5',
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url).catch(console.error);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (new URL(url).origin !== service.url) event.preventDefault();
  });
  await win.loadURL(service.url);
  if (smoke) {
    const result = await win.webContents.executeJavaScript(`
      (async () => {
        const deadline = Date.now() + 5000;
        while (document.querySelector('#status')?.dataset.state !== 'ready') {
          if (Date.now() > deadline) throw new Error('页面未进入就绪状态');
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        return { title: document.title, state: document.querySelector('#status').dataset.state };
      })()
    `);
    console.log('桌面启动检查通过：', JSON.stringify(result));
    app.quit();
  }
}

app.whenReady().then(async () => {
  smokeDir = smoke ? await mkdtemp(path.join(tmpdir(), 'signal-desk-desktop-')) : undefined;
  service = await startServer({ dataDir: smokeDir || path.join(app.getPath('userData'), 'data') });
  await createWindow();
}).catch(error => {
  exitCode = 1;
  console.error('桌面启动失败：', error.message);
  if (!smoke) dialog.showErrorBox('Signal Desk 启动失败', error.message);
  app.quit();
});

app.on('activate', () => {
  if (service && BrowserWindow.getAllWindows().length === 0) {
    createWindow().catch(error => dialog.showErrorBox('窗口启动失败', error.message));
  }
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' || smoke) app.quit();
});
app.on('before-quit', event => {
  if (stopping) return;
  event.preventDefault();
  stopping = true;
  (async () => {
    await service?.close();
    if (smokeDir) await rm(smokeDir, { recursive: true });
  })().catch(error => {
    exitCode = 1;
    console.error('桌面关闭失败：', error.message);
  }).finally(() => app.exit(exitCode));
});
