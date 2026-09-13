import { useState } from 'react';

export function AudioBar() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-40 select-none hidden md:block">
      {/* 展开的章节字幕浮窗 */}
      {isExpanded && (
        <div className="mb-2 w-72 bg-surface-card rounded-xl p-3.5 border border-hairline shadow-lg backdrop-blur-md transition-all">
          <div className="flex items-center justify-between pb-2 border-b border-hairline mb-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">graphic_eq</span>
              <span className="text-[12px] font-semibold text-ink">晨间速报音频章节</span>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="text-muted hover:text-ink text-xs"
              aria-label="收起视窗"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="p-1.5 rounded bg-amber-500/10 text-primary font-medium flex items-center justify-between">
              <span>01. GPT-6 Sol 推理即计算拐点</span>
              <span className="font-mono text-[10px]">02:14</span>
            </div>
            <div className="p-1.5 rounded hover:bg-surface text-body flex items-center justify-between cursor-pointer">
              <span>02. Claude 3.7 混合推理深度评测</span>
              <span className="font-mono text-[10px] text-muted">04:30</span>
            </div>
            <div className="p-1.5 rounded hover:bg-surface text-body flex items-center justify-between cursor-pointer">
              <span>03. UEC 万卡集群以太网联盟</span>
              <span className="font-mono text-[10px] text-muted">06:42</span>
            </div>
          </div>
        </div>
      )}

      {/* 微缩常驻音频条 */}
      <div className="flex items-center gap-2.5 px-3 py-2 bg-surface-card/95 hover:bg-surface-card border border-hairline rounded-full shadow-sm backdrop-blur-md transition-all">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-hover active:scale-95 transition-all shrink-0"
          title={isPlaying ? '暂停播放' : '播放晨间速报'}
        >
          <span className="material-symbols-outlined text-[16px]">
            {isPlaying ? 'pause' : 'play_arrow'}
          </span>
        </button>

        <div
          className="flex flex-col cursor-pointer min-w-0 pr-1"
          onClick={() => setIsExpanded(!isExpanded)}
          title="点击展开音频章节"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-ink truncate">
              第 142 期 · 晨间速听
            </span>
            {isPlaying && (
              <span className="flex items-end gap-0.5 h-2.5">
                <span className="w-0.5 bg-primary animate-pulse h-full"></span>
                <span className="w-0.5 bg-primary animate-pulse h-2"></span>
                <span className="w-0.5 bg-primary animate-pulse h-1.5"></span>
              </span>
            )}
          </div>
          <span className="text-[9px] text-muted font-mono leading-none mt-0.5">
            06:42 · 3 个章节
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted hover:text-ink pl-1"
          title="展开章节"
        >
          <span className="material-symbols-outlined text-[16px]">
            {isExpanded ? 'expand_more' : 'expand_less'}
          </span>
        </button>
      </div>
    </div>
  );
}
