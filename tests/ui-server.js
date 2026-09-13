// Explicit manual UI test harness: temporary storage and clearly labelled fixtures only.
// Never imported by the application or enabled by a production environment variable.
import http from 'node:http';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {startServer} from '../src/server/app.js';

const titles=['代码研究工具新增沙盒验证与证据回溯','端侧语音芯片公布开发者测试方案','云基础设施更新密钥交换协议','多模态模型发布图像推理评估报告','开源数据库增加事件订阅接口','智能硬件团队公布机器人研究进展','浏览器发布隐私保护机制说明','开发平台推出离线任务运行环境','行业观察：从模型评测到实际交付','研究团队发布长文本证据分析方法','新一代传感器进入技术验证阶段','科技产品团队分享可访问性实践'];
const dataDir=await mkdtemp(path.join(tmpdir(),'signal-live-ui-'));
const feeds=http.createServer((req,res)=>{
  if(req.url==='/failed'){res.writeHead(503);res.end('fixture failure');return;}
  res.setHeader('Content-Type','application/rss+xml');
  const list=req.url==='/channel'?['播客测试：如何验证代码代理的真实能力']:titles;
  const items=list.map((title,index)=>`<item><guid>${req.url}-${index}</guid><title>【测试数据】${title}</title><link>https://example.com/test-material/${req.url.slice(1)}/${index}</link><pubDate>${new Date(Date.UTC(2026,8,8,8-index)).toUTCString()}</pubDate><description>这是用于界面验收的受控 RSS 样本，不是真实新闻。材料介绍了${title}，并列出实验背景、验证过程与尚待确认的问题。个人判断应与来源观点分别记录。</description></item>`).join('');
  setTimeout(()=>res.end(`<rss version="2.0"><channel><title>界面测试信源</title><link>https://example.com/</link><description>受控样本</description>${items}</channel></rss>`),350);
});
await new Promise(resolve=>feeds.listen(0,'127.0.0.1',resolve));
const service=await startServer({dataDir,dev:true,ingestionOptions:{allowLocalNetwork:true,timeoutMs:2000}});
console.log(JSON.stringify({url:service.url,feedUrl:`http://127.0.0.1:${feeds.address().port}`,dataDir}));
let closing=false;
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{if(closing)return;closing=true;await service.close();await new Promise(resolve=>feeds.close(resolve));await rm(dataDir,{recursive:true,force:true});process.exit(0);});
