import { Link } from 'react-router-dom';
import { useLive } from './LiveProvider.jsx';
import { Icon, IconButton } from '../components/UI.jsx';
import { displayTime } from './api.js';

export const jobStateLabels = {
  running: '运行中',
  completed: '已完成',
  partial: '部分失败',
  failed: '失败',
  interrupted: '已中断',
};
export function JobPanel({ onClose, compact = false }) {
  const { status, start, starting } = useLive();
  const jobs = status?.jobs || [];
  return (
    <section className={`job-panel ${compact ? 'compact' : ''}`} aria-label="任务进度">
      <div className="section-title">
        <span>
          <Icon name="history" />
          获取与研究记录
        </span>
        {onClose && <IconButton icon="close" label="收起任务记录" onClick={onClose} />}
      </div>
      {!jobs.length ? (
        <p className="muted">还没有任务。添加信源后手动获取，或选择频道开始研究。</p>
      ) : (
        jobs.slice(0, compact ? 3 : 15).map((job) => (
          <details
            key={job.id}
            open={
              compact ||
              job.state === 'running' ||
              job.state === 'partial' ||
              job.state === 'failed'
            }
            className="job-item"
          >
            <summary>
              <strong>{job.kind === 'fetch' ? 'RSS 获取' : '频道研究'}</strong>
              <span className={`job-state ${job.state}`}>{jobStateLabels[job.state]}</span>
              <span>
                {job.done} / {job.total}
              </span>
              <small>{displayTime(job.started_at)}</small>
            </summary>
            <progress max={Math.max(1, job.total)} value={job.done} />
            <p>
              {job.succeeded} 个成功 · {job.failed} 个失败 · 新增 {job.new_count} 个事件
              {job.kind === 'research' ? ' · 基于元数据' : ''}
            </p>
            {job.error && <p className="field-error">{job.error}</p>}
            <ul>
              {job.sources.map((source) => (
                <li key={source.source_id}>
                  <span>{source.name}</span>
                  <span>
                    {source.state === 'completed'
                      ? `${source.material_count} 篇材料`
                      : source.state === 'failed'
                        ? source.error
                        : job.state === 'interrupted'
                          ? '未完成'
                          : source.state === 'running'
                            ? '正在处理…'
                            : '等待中'}
                  </span>
                </li>
              ))}
            </ul>
            <div className="job-actions">
              {job.eventIds.length > 0 && job.state !== 'running' && (
                <Link className="button" to={`/all?jobId=${job.id}`} onClick={onClose}>
                  查看 {job.eventIds.length} 个结果
                  <Icon name="arrowRight" />
                </Link>
              )}
              {['partial', 'failed', 'interrupted'].includes(job.state) && (
                <button
                  className="button"
                  disabled={
                    starting ||
                    jobs.some((current) => current.kind === job.kind && current.state === 'running')
                  }
                  onClick={() => start(job.kind, { retryJobId: job.id })}
                >
                  重试未完成信源
                </button>
              )}
            </div>
          </details>
        ))
      )}
    </section>
  );
}
