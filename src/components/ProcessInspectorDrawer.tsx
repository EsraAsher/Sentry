import React, { useState } from 'react';
import { ProcessItem } from '../types';
import { 
  X, 
  Square, 
  RotateCw, 
  History, 
  Download, 
  Search, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Plus, 
  Sliders, 
  Clock 
} from 'lucide-react';

interface ProcessInspectorDrawerProps {
  process: ProcessItem | null;
  onClose: () => void;
  onKillStop: (id: string) => void;
  onForceRestart: (id: string) => void;
  onResetBackoff: (id: string) => void;
}

export const ProcessInspectorDrawer: React.FC<ProcessInspectorDrawerProps> = ({
  process,
  onClose,
  onKillStop,
  onForceRestart,
  onResetBackoff,
}) => {
  const [showSecret, setShowSecret] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [envSearch, setEnvSearch] = useState('');
  const [addedVars, setAddedVars] = useState<{ key: string; value: string }[]>([]);
  const [showAddVarModal, setShowAddVarModal] = useState(false);
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarVal, setNewVarVal] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(43);

  if (!process) return null;

  const isCrash = process.status === 'crash_loop';

  const copyToClipboard = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleAddVariable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVarKey.trim()) return;
    setAddedVars((prev) => [...prev, { key: newVarKey.trim().toUpperCase(), value: newVarVal.trim() }]);
    setNewVarKey('');
    setNewVarVal('');
    setShowAddVarModal(false);
  };

  const envList = [
    { key: 'API_SECRET_KEY', isSecret: true, secretVal: 'sec_live_9x8F12a0B87c9K' },
    { key: 'RPC_ENDPOINT', isSecret: false, val: 'wss://api.mainnet-beta.solana.com' },
    { key: 'TELEGRAM_ALERT_CHAT_ID', isSecret: false, val: '-1001892837482' },
    ...addedVars.map((v) => ({ key: v.key, isSecret: false, val: v.value })),
  ].filter((item) => item.key.toLowerCase().includes(envSearch.toLowerCase()));

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-[#0c0e13]/80 backdrop-blur-xs z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Right Drawer */}
      <aside
        className="fixed top-0 right-0 bottom-0 w-[580px] max-w-[100vw] bg-surface-container-low z-50 flex flex-col shadow-2xl border-l border-outline-variant/30 overflow-hidden animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="p-5 flex flex-col gap-3.5 bg-surface-container border-b border-outline-variant/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                {isCrash ? (
                  <div className="relative flex h-3 w-3 items-center justify-center shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
                  </div>
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary shrink-0"></span>
                )}
                <h1 className="font-semibold text-[17px] text-on-surface truncate tracking-tight">
                  {process.name}
                </h1>
                <span
                  className={`font-mono text-[11px] px-2 py-0.5 rounded font-medium ${
                    isCrash
                      ? 'bg-error-container text-on-error-container border border-error/30'
                      : 'bg-surface-container-lowest text-secondary border border-secondary/30'
                  }`}
                >
                  {process.status} {process.restarts > 0 ? `(${process.restarts} crashes)` : ''}
                </span>
              </div>
              <span className="font-mono text-[11px] text-outline">
                Service ID: svc_mkt_wtch_09a • Supervisor: termux-pm2
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action buttons bar */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              type="button"
              onClick={() => onKillStop(process.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-error-container text-on-error-container hover:opacity-90 transition-opacity text-[12px] font-semibold border border-error/30"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Kill & Stop</span>
            </button>

            <button
              type="button"
              onClick={() => onForceRestart(process.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary-container text-on-primary-container hover:opacity-90 transition-opacity text-[12px] font-semibold border border-primary/30"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Force Restart</span>
            </button>

            <button
              type="button"
              onClick={() => onResetBackoff(process.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-container-high text-on-surface hover:bg-surface-bright transition-colors text-[12px] border border-outline-variant/30"
            >
              <History className="w-3.5 h-3.5 text-tertiary" />
              <span>Reset Backoff Counter</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const blob = new Blob([JSON.stringify(process, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${process.name}-dump.json`;
                a.click();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-container-high text-on-surface hover:bg-surface-bright transition-colors text-[12px] border border-outline-variant/30"
            >
              <Download className="w-3.5 h-3.5 text-outline" />
              <span>Export Logs</span>
            </button>
          </div>
        </div>

        {/* Scrollable body content */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          {/* Section 1: Runtime Telemetry */}
          <section className="flex flex-col gap-2.5">
            <span className="font-mono text-[10px] font-semibold text-outline uppercase tracking-wider">
              Runtime Telemetry
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-surface-container p-3 rounded flex flex-col gap-1 border border-outline-variant/20">
                <span className="font-mono text-[10px] text-outline uppercase">CPU Allocation</span>
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-[15px] text-error">{process.cpuPercent}%</span>
                  <span className="font-mono text-[11px] text-outline">{process.cpuCoresUsed || '1.8 cores'}</span>
                </div>
                <div className="w-full bg-surface-container-highest h-1 rounded overflow-hidden mt-1">
                  <div className="bg-error h-full" style={{ width: `${Math.min(100, process.cpuPercent)}%` }}></div>
                </div>
              </div>

              <div className="bg-surface-container p-3 rounded flex flex-col gap-1 border border-outline-variant/20">
                <span className="font-mono text-[10px] text-outline uppercase">Memory RSS</span>
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-[15px] text-error">492 MB</span>
                  <span className="font-mono text-[11px] text-outline">/ 512 MB (96%)</span>
                </div>
                <div className="w-full bg-surface-container-highest h-1 rounded overflow-hidden mt-1">
                  <div className="bg-error h-full" style={{ width: '96%' }}></div>
                </div>
              </div>

              <div className="bg-surface-container p-3 rounded flex flex-col gap-1 border border-outline-variant/20">
                <span className="font-mono text-[10px] text-outline uppercase">Restart Frequency</span>
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-[15px] text-tertiary">
                    {process.restarts} crashes
                  </span>
                  <span className="font-mono text-[11px] text-outline">in last 15m</span>
                </div>
                <div className="font-mono text-[11px] text-tertiary mt-1">rate: ~1.8 crash/min</div>
              </div>

              <div className="bg-surface-container p-3 rounded flex flex-col gap-1 border border-outline-variant/20">
                <span className="font-mono text-[10px] text-outline uppercase">Termination Reason</span>
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-[15px] text-error">SIGKILL</span>
                  <span className="font-mono text-[11px] text-on-error-container bg-error-container/50 px-1.5 py-0.5 rounded font-semibold">
                    137 OOM
                  </span>
                </div>
                <div className="font-mono text-[11px] text-outline mt-1">Linux cgroup memory killer</div>
              </div>
            </div>
          </section>

          {/* Section 2: Process & Execution Details */}
          <section className="flex flex-col gap-2.5">
            <span className="font-mono text-[10px] font-semibold text-outline uppercase tracking-wider">
              Process & Execution Details
            </span>
            <div className="bg-surface-container rounded p-3.5 flex flex-col gap-3 font-mono text-[11px] border border-outline-variant/20">
              <div className="flex flex-col gap-1">
                <span className="text-outline uppercase text-[10px]">Exec Command</span>
                <div className="bg-surface-container-lowest p-2 rounded text-primary-fixed-dim break-all select-all border border-outline-variant/20">
                  {process.command}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-outline uppercase text-[10px]">Working Directory</span>
                <div className="bg-surface-container-lowest p-2 rounded text-on-surface-variant break-all select-all border border-outline-variant/20">
                  {process.workingDir}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-outline uppercase text-[10px]">Auto-Restart Policy</span>
                  <div className="text-on-surface bg-surface-container-lowest p-2 rounded text-ellipsis overflow-hidden whitespace-nowrap border border-outline-variant/20">
                    {process.restartPolicy}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-outline uppercase text-[10px]">Environment File</span>
                  <div className="text-secondary bg-surface-container-lowest p-2 rounded flex items-center gap-1.5 border border-outline-variant/20">
                    <Sliders className="w-3.5 h-3.5 text-secondary shrink-0" />
                    <span>{process.envFile}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Secrets & Environment Manager */}
          <section className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold text-outline uppercase tracking-wider">
                Secrets & Environment Manager
              </span>
              <button
                type="button"
                onClick={() => setShowAddVarModal(true)}
                className="flex items-center gap-1 px-2 py-0.5 bg-surface-container-high hover:bg-surface-bright text-primary text-[12px] rounded transition-colors border border-outline-variant/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Variable</span>
              </button>
            </div>

            {/* Modal for adding env var */}
            {showAddVarModal && (
              <form onSubmit={handleAddVariable} className="p-3 bg-surface-container-high rounded border border-primary/40 flex flex-col gap-2">
                <span className="font-semibold text-[12px] text-on-surface">New Environment Variable</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="VAR_NAME"
                    value={newVarKey}
                    onChange={(e) => setNewVarKey(e.target.value)}
                    className="flex-1 bg-surface-container-lowest border border-outline-variant/40 rounded px-2 py-1 font-mono text-[11px] text-on-surface focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    placeholder="Value..."
                    value={newVarVal}
                    onChange={(e) => setNewVarVal(e.target.value)}
                    className="flex-1 bg-surface-container-lowest border border-outline-variant/40 rounded px-2 py-1 font-mono text-[11px] text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddVarModal(false)}
                    className="px-2.5 py-1 text-[11px] rounded bg-surface-container text-outline hover:text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-[11px] font-semibold rounded bg-primary text-on-primary hover:opacity-90"
                  >
                    Save Variable
                  </button>
                </div>
              </form>
            )}

            <div className="bg-surface-container rounded p-3 flex flex-col gap-2 border border-outline-variant/20">
              <div className="flex items-center gap-2 bg-surface-container-lowest px-2.5 py-1 rounded text-outline mb-1 border border-outline-variant/20">
                <Search className="w-3.5 h-3.5" />
                <input
                  type="text"
                  value={envSearch}
                  onChange={(e) => setEnvSearch(e.target.value)}
                  placeholder="Search variables (e.g. KEY, RPC)..."
                  className="bg-transparent border-none text-on-surface placeholder-outline font-mono text-[11px] focus:outline-none w-full"
                />
              </div>

              {envList.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-2 bg-surface-container-lowest rounded font-mono text-[11px] border border-outline-variant/15"
                >
                  <span className="text-on-surface font-medium truncate">{item.key}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.isSecret ? (
                      <>
                        <span className={`tracking-widest ${showSecret ? 'text-secondary font-semibold tracking-normal' : 'text-outline'}`}>
                          {showSecret ? item.secretVal : '••••••••••••••••••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowSecret(!showSecret)}
                          className="text-outline hover:text-on-surface p-1"
                        >
                          {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-on-surface-variant truncate max-w-[200px]">
                          {item.val}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.key, item.val || '')}
                          className="text-outline hover:text-on-surface p-1"
                          title="Copy value"
                        >
                          {copiedKey === item.key ? (
                            <Check className="w-3.5 h-3.5 text-secondary" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: Lifecycle Event Timeline */}
          <section className="flex flex-col gap-2.5">
            <span className="font-mono text-[10px] font-semibold text-outline uppercase tracking-wider">
              Lifecycle Event Timeline
            </span>
            <div className="bg-surface-container rounded p-4 border border-outline-variant/20">
              <div className="relative pl-6 flex flex-col gap-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-surface-container-highest">
                <div className="relative flex flex-col gap-1">
                  <div className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-error ring-4 ring-surface-container"></div>
                  <div className="flex items-baseline justify-between font-mono text-[11px]">
                    <span className="text-error font-semibold">Exit Code 137 (OOMKilled)</span>
                    <span className="text-outline">14:02:11</span>
                  </div>
                  <p className="text-[12px] text-on-surface-variant leading-snug">
                    System cgroup terminated process immediately due to memory limit breach (512 MB ceiling exceeded).
                  </p>
                </div>

                <div className="relative flex flex-col gap-1">
                  <div className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-surface-container"></div>
                  <div className="flex items-baseline justify-between font-mono text-[11px]">
                    <span className="text-primary font-semibold">Process Spawned</span>
                    <span className="text-outline">14:01:41</span>
                  </div>
                  <p className="text-[12px] text-on-surface-variant leading-snug">
                    Supervisor restarted process with PID 31024 after 30s backoff cooldown.
                  </p>
                </div>

                <div className="relative flex flex-col gap-1">
                  <div className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-tertiary ring-4 ring-surface-container"></div>
                  <div className="flex items-baseline justify-between font-mono text-[11px]">
                    <span className="text-tertiary font-semibold">Memory Warning Limit 85%</span>
                    <span className="text-outline">14:00:58</span>
                  </div>
                  <p className="text-[12px] text-on-surface-variant leading-snug">
                    RSS consumption climbed to 438 MB. Order book snapshot queue accumulating unparsed ticks.
                  </p>
                </div>

                <div className="relative flex flex-col gap-1">
                  <div className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-surface-container"></div>
                  <div className="flex items-baseline justify-between font-mono text-[11px]">
                    <span className="text-primary font-semibold">Process Spawned</span>
                    <span className="text-outline">14:00:12</span>
                  </div>
                  <p className="text-[12px] text-on-surface-variant leading-snug">
                    Spawned initial instance PID 30988 under cgroup slice <code className="font-mono text-[10px] text-outline">user.slice/market-watcher</code>.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Live stdout / stderr Tail */}
          <section className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold text-outline uppercase tracking-wider">
                Live stdout / stderr Tail
              </span>
              <span className="font-mono text-[11px] text-secondary flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse"></span>
                tail -n 50 -f
              </span>
            </div>

            <div className="bg-[#080A0E] rounded p-3 flex flex-col gap-1 font-mono text-[11px] text-outline overflow-x-auto select-all max-h-56 border border-outline-variant/30 leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="text-surface-bright shrink-0">[14:01:41.201]</span>
                <span className="text-on-surface-variant"><span className="text-primary">[INFO]</span> Connecting to wss://api.mainnet-beta.solana.com...</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-surface-bright shrink-0">[14:01:42.088]</span>
                <span className="text-on-surface-variant"><span className="text-primary">[INFO]</span> Handshake established. Subscribed to SOL/USDC, BTC/USDC depth.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-surface-bright shrink-0">[14:01:49.431]</span>
                <span className="text-tertiary">[WARN] Tick buffer backlog &gt; 12,000 frames. Ingest lagging by 482ms.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-surface-bright shrink-0">[14:02:02.912]</span>
                <span className="text-tertiary">[WARN] Heap memory allocation 438 MB reaches high-water threshold.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-surface-bright shrink-0">[14:02:09.112]</span>
                <span className="text-error font-medium">[CRIT] Memory allocator: Failed to acquire 32MB arena. System running out of pages.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-surface-bright shrink-0">[14:02:11.002]</span>
                <span className="text-error font-semibold">[FATAL] Process 31024 terminated by signal 9 (SIGKILL: Out of memory killer).</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-surface-bright shrink-0">[14:02:11.015]</span>
                <span className="text-tertiary-fixed-dim">[SUPERVISOR] Crash count incremented: 27. Entering backoff state (cooldown: 45s).</span>
              </div>
              <div className="flex items-start gap-2 mt-1">
                <span className="text-surface-bright shrink-0">[14:02:12.440]</span>
                <span className="text-on-surface-variant flex items-center gap-1">
                  <span>Next restart attempt in {cooldownSeconds}s...</span>
                  <span className="inline-block w-2 h-3.5 bg-secondary animate-pulse"></span>
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Drawer Footer */}
        <div className="p-3.5 bg-surface-container border-t border-outline-variant/30 flex items-center justify-between font-mono text-[11px]">
          <div className="flex items-center gap-1.5 text-outline">
            <Clock className="w-3.5 h-3.5 text-outline" />
            <span>Backoff wait: {cooldownSeconds}s</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCooldownSeconds(0)}
              className="px-3 py-1 bg-surface-container-high hover:bg-surface-bright text-on-surface rounded transition-colors border border-outline-variant/30"
            >
              Clear Queue
            </button>
            <button
              type="button"
              onClick={() => {
                onForceRestart(process.id);
                setCooldownSeconds(45);
              }}
              className="px-3 py-1 bg-primary text-on-primary rounded font-semibold transition-opacity hover:opacity-90"
            >
              Manual Spin Up
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
