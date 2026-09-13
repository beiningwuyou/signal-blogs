import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { startServer } from "../src/server/app.js";

test("端到端整合测试：信源增删、种子装载、连接测试、全量抓取与研判记录保存", async () => {
  const dataDir = await mkdtemp(path.join(tmpdir(), "signal-integration-test-"));

  const testFeedServer = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
    res.end(`<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>极客智能前线</title>
          <link>https://geek.example.com</link>
          <description>端侧架构测试信源</description>
          <item>
            <guid>geek-item-001</guid>
            <title>端侧投机解码与显存带宽优化实践</title>
            <link>https://geek.example.com/post/001</link>
            <pubDate>Fri, 11 Sep 2026 04:00:00 GMT</pubDate>
            <description>详细解构在单卡消费级 GPU 上进行 70B 大模型推理吞吐提升的技术实现路径。</description>
          </item>
        </channel>
      </rss>`);
  });

  await new Promise((resolve) => testFeedServer.listen(0, "127.0.0.1", resolve));
  const feedUrl = `http://127.0.0.1:${testFeedServer.address().port}/rss.xml`;

  let server;
  try {
    server = await startServer({
      dataDir,
      ingestionOptions: { allowLocalNetwork: true, timeoutMs: 2000 },
    });

    const api = async (endpoint, { method = "GET", body } = {}) => {
      const res = await fetch(`${server.url}/api/live${endpoint}`, {
        method,
        headers: body !== undefined ? { "Content-Type": "application/json" } : {},
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      assert.ok(res.ok, `API 请求失败 ${res.status}: ${JSON.stringify(data)}`);
      return data;
    };

    // 1. 种子导入测试
    const seedResult = await api("/sources/seed", {
      method: "POST",
      body: [
        { name: "种子源1", url: "https://seed1.example.com/feed", kind: "rss", category: "硬科技与半导体", enabled: true },
        { name: "种子源2", url: "https://seed2.example.com/feed", kind: "rss", category: "AI 算法与模型", enabled: false },
      ],
    });
    assert.equal(seedResult.seeded, 2);

    // 2. 连接测试
    const testResult = await api("/sources/test", {
      method: "POST",
      body: { name: "极客智能前线", url: feedUrl, kind: "rss", category: "硬科技与半导体", enabled: true },
    });
    assert.equal(testResult.itemCount, 1);
    assert.equal(testResult.title, "极客智能前线");

    // 3. 新增真实信源
    const createdSource = await api("/sources", {
      method: "POST",
      body: { name: "极客智能前线", url: feedUrl, kind: "rss", category: "硬科技与半导体", enabled: true },
    });
    assert.ok(createdSource.id.startsWith("src-"));

    // 4. 触发全量抓取
    const fetchJob = await api("/fetch", { method: "POST", body: {} });
    assert.ok(fetchJob.id.startsWith("job-"));

    // 等待抓取结束
    let jobStatus;
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
      jobStatus = await api(`/jobs/${fetchJob.id}`);
      if (jobStatus.state !== "running") break;
      await new Promise((r) => setTimeout(r, 50));
    }
    assert.notEqual(jobStatus.state, "running");

    // 5. 验证事件列表
    const events = await api("/events?scope=all");
    assert.ok(events.length >= 1, "应聚合出至少一条真实事件");
    const targetEvent = events.find((e) => e.title.includes("端侧投机解码"));
    assert.ok(targetEvent, "应包含抓取到的事件");

    // 6. 验证事件研判笔记保存
    const recordResult = await api(`/events/${targetEvent.id}/record`, {
      method: "PATCH",
      body: { note: "经过实测，该投机解码方案确实显著降低了显存带宽占用。", expectedRevision: 0 },
    });
    assert.equal(recordResult.note, "经过实测，该投机解码方案确实显著降低了显存带宽占用。");

    // 7. 删除信源
    const deleteResult = await api(`/sources/${createdSource.id}`, { method: "DELETE" });
    assert.equal(deleteResult.deleted, true);
    const sourcesAfterDelete = await api("/sources");
    assert.ok(!sourcesAfterDelete.some((s) => s.id === createdSource.id));
  } finally {
    testFeedServer.closeAllConnections();
    await new Promise((r) => testFeedServer.close(r));
    if (server) await server.close();
    await rm(dataDir, { recursive: true, force: true });
  }
});
