import React from 'react';
import { ProcessItem } from '../types';
import { 
  AlertTriangle, 
  ShieldAlert, 
  ArrowRight, 
  ZapOff, 
  CheckCircle, 
  Activity, 
  Flame,
  HelpCircle
} from 'lucide-react';

interface FailureCascadesViewProps {
  processes: ProcessItem[];
  onInspectProcess: (process: ProcessItem) => void;
  onMitigateOom: () => void;
}

export const FailureCascadesView: React.FC<FailureCascadesViewProps> = ({
  processes,
  onInspectProcess,
  onMitigateOom,
}) => {
  const crashProcess = processes.find((p) => p.status === 'crash_loop') || processes[2];
  const degradedProcess = processes.find((p) => p.status === 'degraded') || processes[3];

  // Sort processes by OOM score (highest is next to be killed by Linux Kernel)
  const oomSorted = [...processes].sort((a, b) => b.oomScore - a.oomScore);

  return (
    <div className="flex flex-col gap-5 w-full select-none">
      {/* Alert Header Banner */}
      <div className="bg-error-container/20 border border-error/40 rounded-lg p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-error shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-[15px] text-error">
              Active Cascade Risk: OOM Thrashing on High-Priority Daemons
            </h3>
            <span className="font-mono text-[10px] bg-error text-on-error px-2 py-0.5 rounded font-bold uppercase">
              1 Fault Active
            </span>
          </div>
          <p className="text-[12px] text-on-surface-variant mt-1 leading-relaxed">
            Linux Kernel Out-Of-Memory killer dispatched SIGKILL to <code className="font-mono text-error font-semibold">market-watcher-daemon</code> (PID 31024) 27 times. Re-allocations during backoff may starve available buffer cache and trigger cascading terminations on <code className="font-mono text-tertiary font-semibold">solana-webhook-agent</code>.
          </p>
        </div>
      </div>

      {/* Visual Blast Radius & Dependency Tree */}
      <div className="bg-surface-container rounded-lg p-5 border border-outline-variant/20 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[15px] text-on-surface">
            Failure Blast Radius & Inter-Service Dependencies
          </span>
          <span className="font-mono text-[11px] text-outline">
            Supervisor Dependency Map
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* Node 1: Root Fault */}
          <div className="bg-surface-container-lowest p-4 rounded border-2 border-error flex flex-col gap-2 relative">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-error font-bold uppercase">Root Fault</span>
              <span className="w-2.5 h-2.5 rounded-full bg-error animate-ping"></span>
            </div>
            <div className="font-semibold text-[14px] text-error truncate">{crashProcess.name}</div>
            <div className="font-mono text-[11px] text-outline">Status: CRASH_LOOP (Exit 137)</div>
            <div className="font-mono text-[11px] text-error">Cgroup Limit: 512 MB breached</div>
            <button
              type="button"
              onClick={() => onInspectProcess(crashProcess)}
              className="mt-2 py-1 px-2 rounded bg-error/15 text-error text-[11px] font-mono hover:bg-error/25 transition-colors text-center"
            >
              Open Inspector
            </button>
          </div>

          {/* Node 2: Degraded Peer */}
          <div className="bg-surface-container-lowest p-4 rounded border-2 border-tertiary flex flex-col gap-2 relative">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-tertiary font-bold uppercase">Degraded Pressure</span>
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
            </div>
            <div className="font-semibold text-[14px] text-tertiary truncate">{degradedProcess.name}</div>
            <div className="font-mono text-[11px] text-outline">Status: DEGRADED (Latency 980ms)</div>
            <div className="font-mono text-[11px] text-tertiary">RAM Quota: 88% watermark</div>
            <button
              type="button"
              onClick={() => onInspectProcess(degradedProcess)}
              className="mt-2 py-1 px-2 rounded bg-tertiary/15 text-tertiary text-[11px] font-mono hover:bg-tertiary/25 transition-colors text-center"
            >
              Open Inspector
            </button>
          </div>

          {/* Node 3: Downstream Impact */}
          <div className="bg-surface-container-lowest p-4 rounded border border-outline-variant/30 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-secondary font-bold uppercase">Protected Peers</span>
              <CheckCircle className="w-4 h-4 text-secondary" />
            </div>
            <div className="font-semibold text-[14px] text-on-surface truncate">tg-forwarder & matrix</div>
            <div className="font-mono text-[11px] text-outline">Status: RUNNING (Isolated)</div>
            <div className="font-mono text-[11px] text-secondary">cgroups preventing noisy neighbor</div>
            <div className="mt-2 text-[11px] text-on-surface-variant leading-tight">
              Shared IPC queue is holding 0 unacknowledged frames.
            </div>
          </div>
        </div>
      </div>

      {/* Linux Kernel Low Memory Killer (LMK) Prioritization Table */}
      <div className="bg-surface-container rounded-lg p-5 border border-outline-variant/20 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-[14px] text-on-surface">
              Linux Kernel Low Memory Killer (LMK) Score Hierarchy
            </h4>
            <p className="text-[12px] text-on-surface-variant mt-0.5">
              Processes with the highest OOM score will be terminated first by Android kernel when RAM drops below 400 MB
            </p>
          </div>
          <button
            type="button"
            onClick={onMitigateOom}
            className="px-3 py-1.5 bg-primary text-on-primary rounded font-mono text-[11px] font-semibold hover:opacity-90 transition-opacity"
          >
            Apply OOM Bias Shield
          </button>
        </div>

        <div className="border border-outline-variant/20 rounded overflow-hidden mt-1">
          <table className="w-full text-left font-mono text-[11px]">
            <thead className="bg-surface-container-lowest border-b border-outline-variant/20 text-outline">
              <tr>
                <th className="px-3 py-2 font-normal text-[10px] uppercase">Daemon</th>
                <th className="px-3 py-2 font-normal text-[10px] uppercase">PID</th>
                <th className="px-3 py-2 font-normal text-[10px] uppercase">OOM Score</th>
                <th className="px-3 py-2 font-normal text-[10px] uppercase">Kill Priority</th>
                <th className="px-3 py-2 font-normal text-[10px] uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 bg-surface-container-low">
              {oomSorted.map((proc, idx) => {
                const isTopRisk = idx === 0;
                return (
                  <tr
                    key={proc.id}
                    className={`hover:bg-surface-container transition-colors ${
                      isTopRisk ? 'bg-error-container/10' : ''
                    }`}
                  >
                    <td className="px-3 py-2 text-on-surface font-medium truncate max-w-[200px]">
                      {proc.name}
                    </td>
                    <td className="px-3 py-2 text-outline">{proc.pid}</td>
                    <td className="px-3 py-2">
                      <span className={`font-semibold ${isTopRisk ? 'text-error' : 'text-on-surface'}`}>
                        {proc.oomScore}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {isTopRisk ? (
                        <span className="text-error font-bold flex items-center gap-1">
                          <Flame className="w-3 h-3 text-error" />
                          NEXT TARGET
                        </span>
                      ) : idx === 1 ? (
                        <span className="text-tertiary">ELEVATED</span>
                      ) : (
                        <span className="text-secondary">PROTECTED</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold ${
                        proc.status === 'crash_loop' ? 'bg-error text-on-error' :
                        proc.status === 'degraded' ? 'bg-tertiary/20 text-tertiary' : 'text-outline'
                      }`}>
                        {proc.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
