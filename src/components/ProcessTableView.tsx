import React from 'react';
import { ProcessItem } from '../types';
import { RotateCw, Square, Play, RefreshCw, ChevronRight } from 'lucide-react';

interface ProcessTableViewProps {
  processes: ProcessItem[];
  onSelect: (process: ProcessItem) => void;
  onAction: (processId: string, action: 'start' | 'stop' | 'restart' | 'reset') => void;
}

export const ProcessTableView: React.FC<ProcessTableViewProps> = ({
  processes,
  onSelect,
  onAction,
}) => {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-low shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-outline-variant/20 bg-surface-container-lowest text-outline font-mono text-[11px] uppercase tracking-wider select-none">
              <th className="py-2.5 px-4 font-semibold">Daemon</th>
              <th className="py-2.5 px-3 font-semibold">Status</th>
              <th className="py-2.5 px-3 font-semibold">PID</th>
              <th className="py-2.5 px-3 font-semibold">Memory</th>
              <th className="py-2.5 px-3 font-semibold">CPU</th>
              <th className="py-2.5 px-3 font-semibold">Uptime</th>
              <th className="py-2.5 px-3 font-semibold">Restarts</th>
              <th className="py-2.5 px-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/15 font-sans">
            {processes.map((proc) => {
              const isRunning = proc.status === 'running';
              const isCrash = proc.status === 'crash_loop';
              const isDegraded = proc.status === 'degraded';
              const isRestarting = proc.status === 'restarting';
              const isStopped = proc.status === 'stopped';

              let statusColor = 'text-secondary bg-secondary/10 border-secondary/30';
              let dotColor = 'bg-secondary';
              let statusLabel = 'Running';

              if (isCrash) {
                statusColor = 'text-error bg-error/10 border-error/30';
                dotColor = 'bg-error animate-ping';
                statusLabel = 'Crash Loop';
              } else if (isDegraded) {
                statusColor = 'text-tertiary bg-tertiary/10 border-tertiary/30';
                dotColor = 'bg-tertiary';
                statusLabel = 'Degraded';
              } else if (isRestarting) {
                statusColor = 'text-primary bg-primary/10 border-primary/30';
                dotColor = 'bg-primary';
                statusLabel = 'Restarting';
              } else if (isStopped) {
                statusColor = 'text-outline bg-surface-container border-outline-variant/30';
                dotColor = 'bg-outline';
                statusLabel = 'Stopped';
              } else if (proc.status === 'idle') {
                statusColor = 'text-outline bg-surface-container border-outline-variant/30';
                dotColor = 'bg-secondary/60';
                statusLabel = 'Idle';
              }

              return (
                <tr
                  key={proc.id}
                  onClick={() => onSelect(proc)}
                  className={`group cursor-pointer hover:bg-surface-container transition-colors ${
                    isCrash ? 'bg-error/5' : ''
                  }`}
                >
                  {/* Daemon Name & Command */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-on-surface group-hover:text-primary transition-colors text-[13px]">
                          {proc.name}
                        </span>
                        {proc.exitCode && (
                          <span className="font-mono text-[10px] text-error font-semibold px-1 rounded bg-error/10 border border-error/20">
                            EXIT {proc.exitCode}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-outline truncate max-w-xs block">
                        {proc.command}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border ${statusColor}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                      <span>{statusLabel}</span>
                    </span>
                  </td>

                  {/* PID */}
                  <td className="py-3 px-3 font-mono text-[12px] text-on-surface-variant">
                    {proc.pid > 0 ? proc.pid : '—'}
                  </td>

                  {/* Memory */}
                  <td className="py-3 px-3">
                    <div className="flex flex-col font-mono text-[12px]">
                      <span className={`tabular-nums ${isCrash ? 'text-error font-medium' : 'text-on-surface'}`}>
                        {proc.ramUsage}
                      </span>
                      <div className="w-16 bg-surface-container-highest h-1 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full ${
                            isCrash ? 'bg-error' : isDegraded ? 'bg-tertiary' : 'bg-secondary'
                          }`}
                          style={{ width: `${Math.min(100, proc.ramPercent)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* CPU */}
                  <td className="py-3 px-3 font-mono text-[12px] tabular-nums text-on-surface-variant">
                    {proc.cpuPercent > 0 ? `${proc.cpuPercent}%` : '0.0%'}
                  </td>

                  {/* Uptime */}
                  <td className="py-3 px-3 font-mono text-[12px] text-outline truncate">
                    {proc.uptime}
                  </td>

                  {/* Restarts */}
                  <td className="py-3 px-3 font-mono text-[12px] tabular-nums">
                    <span className={proc.fails > 0 ? 'text-error font-semibold' : 'text-outline'}>
                      {proc.restarts}
                    </span>
                    {proc.fails > 0 && (
                      <span className="text-error/80 text-[10px] ml-1">({proc.fails} err)</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div
                      className="inline-flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isRunning ? (
                        <>
                          <button
                            type="button"
                            title="Restart Daemon"
                            onClick={() => onAction(proc.id, 'restart')}
                            className="p-1.5 rounded hover:bg-surface-container-high text-outline hover:text-primary transition-colors"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Stop Daemon"
                            onClick={() => onAction(proc.id, 'stop')}
                            className="p-1.5 rounded hover:bg-surface-container-high text-outline hover:text-error transition-colors"
                          >
                            <Square className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          title="Start Daemon"
                          onClick={() => onAction(proc.id, 'start')}
                          className="p-1.5 rounded hover:bg-surface-container-high text-outline hover:text-secondary transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isCrash && (
                        <button
                          type="button"
                          title="Reset Crash Count"
                          onClick={() => onAction(proc.id, 'reset')}
                          className="px-2 py-1 rounded bg-error/15 text-error text-[11px] font-mono hover:bg-error/25 transition-colors border border-error/30"
                        >
                          Reset
                        </button>
                      )}

                      <button
                        type="button"
                        title="Inspect Process"
                        onClick={() => onSelect(proc)}
                        className="p-1.5 rounded hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
