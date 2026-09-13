import React from 'react';
import { ProcessItem } from '../types';
import { RotateCw, Square, Play, AlertCircle, ChevronRight, Activity } from 'lucide-react';

interface ProcessCardProps {
  process: ProcessItem;
  onSelect: (process: ProcessItem) => void;
  onAction: (processId: string, action: 'start' | 'stop' | 'restart' | 'reset') => void;
}

export const ProcessCard: React.FC<ProcessCardProps> = ({
  process,
  onSelect,
  onAction,
}) => {
  const isCrashLoop = process.status === 'crash_loop';
  const isDegraded = process.status === 'degraded';
  const isRestarting = process.status === 'restarting';
  const isRunning = process.status === 'running';
  const isStopped = process.status === 'stopped';

  // Status badge colors & indicators
  let statusBadge = 'text-secondary bg-secondary/10 border-secondary/20';
  let statusDot = 'bg-secondary';
  let statusText = 'Running';

  if (isCrashLoop) {
    statusBadge = 'text-error bg-error/10 border-error/30';
    statusDot = 'bg-error animate-ping';
    statusText = 'Crash Loop';
  } else if (isDegraded) {
    statusBadge = 'text-tertiary bg-tertiary/10 border-tertiary/30';
    statusDot = 'bg-tertiary';
    statusText = 'Degraded';
  } else if (isRestarting) {
    statusBadge = 'text-primary bg-primary/10 border-primary/30';
    statusDot = 'bg-primary animate-pulse';
    statusText = 'Restarting';
  } else if (isStopped) {
    statusBadge = 'text-outline bg-surface-container border-outline-variant/30';
    statusDot = 'bg-outline';
    statusText = 'Stopped';
  } else if (process.status === 'idle') {
    statusBadge = 'text-outline bg-surface-container border-outline-variant/30';
    statusDot = 'bg-secondary/60';
    statusText = 'Idle';
  }

  return (
    <div
      onClick={() => onSelect(process)}
      className={`group relative flex flex-col justify-between rounded-lg p-4 transition-all duration-150 cursor-pointer border ${
        isCrashLoop
          ? 'bg-error/5 border-error/40 hover:border-error/60'
          : isDegraded
          ? 'bg-surface-container-low border-tertiary/30 hover:border-tertiary/50'
          : 'bg-surface-container-low border-outline-variant/30 hover:border-outline-variant/60 hover:bg-surface-container'
      }`}
    >
      {/* Top Header: Daemon Title, Status & Quick Action */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border shrink-0 ${statusBadge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`}></span>
              <span>{statusText}</span>
            </span>
            <span className="font-mono text-[11px] text-outline">
              PID {process.pid > 0 ? process.pid : '—'}
            </span>
            {process.exitCode && (
              <span className="font-mono text-[10px] text-error font-semibold px-1.5 py-0.2 rounded bg-error/10 border border-error/20">
                EXIT {process.exitCode}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-[14px] text-on-surface group-hover:text-primary transition-colors truncate">
            {process.name}
          </h3>
        </div>

        {/* Action icons */}
        <div
          className="flex items-center gap-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {isRunning ? (
            <>
              <button
                type="button"
                title="Restart"
                onClick={() => onAction(process.id, 'restart')}
                className="p-1.5 rounded text-outline hover:text-primary hover:bg-surface-container-high transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Stop"
                onClick={() => onAction(process.id, 'stop')}
                className="p-1.5 rounded text-outline hover:text-error hover:bg-surface-container-high transition-colors"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              title="Start"
              onClick={() => onAction(process.id, 'start')}
              className="p-1.5 rounded text-outline hover:text-secondary hover:bg-surface-container-high transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}

          {isCrashLoop && (
            <button
              type="button"
              title="Reset crash counter"
              onClick={() => onAction(process.id, 'reset')}
              className="px-2 py-1 rounded bg-error/15 text-error text-[11px] font-mono hover:bg-error/25 transition-colors border border-error/30"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Alert Note callout if present */}
      {process.crashNote && (
        <div className="mb-3 px-2.5 py-1.5 rounded bg-error/10 border border-error/20 text-error text-[11px] font-mono flex items-center gap-1.5 leading-tight">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{process.crashNote}</span>
        </div>
      )}

      {/* Core Metrics: Clean 3-stat horizontal strip */}
      <div className="grid grid-cols-3 gap-2 py-2 px-2.5 rounded bg-surface-container-lowest/60 border border-outline-variant/15 text-[11px] font-mono mb-3">
        <div>
          <span className="text-outline text-[10px] block uppercase">MEM</span>
          <span className={`font-medium tabular-nums ${isCrashLoop ? 'text-error' : 'text-on-surface'}`}>
            {process.ramUsage}
          </span>
        </div>
        <div>
          <span className="text-outline text-[10px] block uppercase">CPU</span>
          <span className="text-on-surface font-medium tabular-nums">
            {process.cpuPercent > 0 ? `${process.cpuPercent}%` : '0.0%'}
          </span>
        </div>
        <div>
          <span className="text-outline text-[10px] block uppercase">UPTIME</span>
          <span className="text-outline-variant truncate block">
            {process.uptime}
          </span>
        </div>
      </div>

      {/* Footer info: Command / Working dir & Chevron */}
      <div className="flex items-center justify-between pt-1 font-mono text-[11px] text-outline">
        <span className="truncate max-w-[200px] text-[11px] opacity-75">
          {process.restartPolicy}
        </span>
        <span className="flex items-center gap-0.5 text-outline group-hover:text-primary transition-colors text-[11px]">
          <span>Inspect</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
