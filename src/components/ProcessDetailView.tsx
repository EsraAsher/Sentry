import React, { useState, useEffect, useRef } from 'react';
import { ProcessItem, LogEntry } from '../types';
import { 
  ArrowLeft, 
  RotateCw, 
  Square, 
  Play, 
  History, 
  Download, 
  Search, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Plus, 
  Sliders, 
  Clock, 
  Activity, 
  Terminal, 
  AlertTriangle, 
  ShieldAlert, 
  Server, 
  Cpu, 
  HardDrive, 
  Zap, 
  ChevronDown,
  Trash2,
  Send
} from 'lucide-react';

interface ProcessDetailViewProps {
  process: ProcessItem;
  allProcesses: ProcessItem[];
  onBack: () => void;
  onSelectProcess: (process: ProcessItem) => void;
  onAction: (processId: string, action: 'start' | 'stop' | 'restart' | 'reset') => void;
  onKillStop: (id: string) => void;
  onForceRestart: (id: string) => void;
  onResetBackoff: (id: string) => void;
}

export const ProcessDetailView: React.FC<ProcessDetailViewProps> = ({
  process,
  allProcesses,
  onBack,
  onSelectProcess,
  onAction,
  onKillStop,
  onForceRestart,
  onResetBackoff,
}) => {
  const [showSecret, setShowSecret] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [envSearch, setEnvSearch] = useState('');
  const [addedVars, setAddedVars] = useState<{ key: string; value: string }[]>([]);
  const [showAddVarModal, setShowAddVarModal] = useState(false);
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarVal, setNewVarVal] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(38);
  const [logFilter, setLogFilter] = useState('');
  const [logLevel, setLogLevel] = useState<'ALL' | 'INFO' | 'WARN' | 'ERR'>('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const [commandInput, setCommandInput] = useState('');
  const [extraLogs, setExtraLogs] = useState<LogEntry[]>([]);
  const terminalContainerRef = useRef<HTMLDivElement>(null);

  const isCrash = process.status === 'crash_loop';
  const isRunning = process.status === 'running';
  const isDegraded = process.status === 'degraded';
  const isStopped = process.status === 'stopped';

  // Always start at top of page when opening or switching inspected service
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [process.id]);

  // Decrement backoff cooldown simulation if in crash loop
  useEffect(() => {
    if (process.status !== 'crash_loop') return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 1 ? prev - 1 : 45));
    }, 1000);
    return () => clearInterval(timer);
  }, [process.status]);

  // Auto-scroll ONLY within the terminal's internal overflow container, never scrolling the page
  useEffect(() => {
    if (autoScroll && terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [process.logs, extraLogs, autoScroll]);

  const copyToClipboard = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleAddVariable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVarKey.trim()) return;
    setAddedVars((prev) => [
      ...prev,
      { key: newVarKey.trim().toUpperCase(), value: newVarVal.trim() },
    ]);
    setNewVarKey('');
    setNewVarVal('');
    setShowAddVarModal(false);
  };

  const handleRunCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    const cmd = commandInput.trim();
    const time = new Date().toISOString().substring(11, 23);

    const userEntry: LogEntry = {
      id: `cmd-${Date.now()}`,
      timestamp: time,
      level: 'INFO',
      tag: 'SHELL',
      message: `$ ${cmd}`,
    };

    let respEntry: LogEntry;
    if (cmd === 'status' || cmd === 'ps') {
      respEntry = {
        id: `resp-${Date.now()}`,
        timestamp: time,
        level: 'INFO',
        tag: 'SUPERVISOR',
        message: `daemon=${process.name} pid=${process.pid} status=${process.status} rss=${process.ramUsage} cpu=${process.cpuPercent}%`,
      };
    } else if (cmd === 'restart') {
      onAction(process.id, 'restart');
      respEntry = {
        id: `resp-${Date.now()}`,
        timestamp: time,
        level: 'WARN',
        tag: 'SUPERVISOR',
        message: `Sent SIGHUP / SIGUSR2 to PID ${process.pid}. Reloading...`,
      };
    } else if (cmd === 'clear') {
      setExtraLogs([]);
      setCommandInput('');
      return;
    } else {
      respEntry = {
        id: `resp-${Date.now()}`,
        timestamp: time,
        level: 'DEBUG',
        tag: 'SHELL',
        message: `Executing [${cmd}] under sandbox cgroup: exit 0`,
      };
    }

    setExtraLogs((prev) => [...prev, userEntry, respEntry]);
    setCommandInput('');
  };

  const envList = [
    { key: 'API_SECRET_KEY', isSecret: true, secretVal: 'sec_live_9x8F12a0B87c9K' },
    { key: 'RPC_ENDPOINT', isSecret: false, val: 'wss://api.mainnet-beta.solana.com' },
    { key: 'TELEGRAM_ALERT_CHAT_ID', isSecret: false, val: '-1001892837482' },
    { key: 'MAX_RETRY_BACKOFF_SEC', isSecret: false, val: '60' },
    { key: 'CGROUP_MEMORY_MAX_MB', isSecret: false, val: '512' },
    ...addedVars.map((v) => ({ key: v.key, isSecret: false, val: v.value })),
  ].filter((item) => item.key.toLowerCase().includes(envSearch.toLowerCase()));

  const allLogs: LogEntry[] = [...(process.logs || []), ...extraLogs];

  const filteredLogs = allLogs.filter((log) => {
    if (logLevel !== 'ALL' && !log.level.includes(logLevel)) {
      return false;
    }
    if (logFilter) {
      const q = logFilter.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.tag.toLowerCase().includes(q) ||
        log.level.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportDiagnostics = () => {
    const dump = {
      exportedAt: new Date().toISOString(),
      daemon: process,
      telemetry: {
        cpuPercent: process.cpuPercent,
        ramUsage: process.ramUsage,
        ramPercent: process.ramPercent,
        restarts: process.restarts,
        exitCode: process.exitCode,
      },
      environment: envList,
      logsTail: allLogs.slice(-100),
    };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${process.name}-diagnostics.json`;
    a.click();
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-150">
      {/* Top Breadcrumbs & Full-Page Header */}
      <div className="flex flex-col gap-3.5 bg-surface-container-low p-5 rounded-lg border border-outline-variant/30 shadow-xs">
        {/* Navigation Breadcrumb Row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-container-high hover:bg-surface-bright text-on-surface text-[12px] font-mono transition-colors border border-outline-variant/30 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Fleet</span>
            </button>
            <span className="text-outline text-[13px]">/</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] text-outline uppercase tracking-wider">Service:</span>
              {/* Quick Switcher dropdown to hop between daemons without going back */}
              <div className="relative inline-block">
                <select
                  value={process.id}
                  onChange={(e) => {
                    const next = allProcesses.find((p) => p.id === e.target.value);
                    if (next) onSelectProcess(next);
                  }}
                  className="bg-surface-container font-mono text-[12px] text-primary font-semibold py-1 pl-2.5 pr-7 rounded border border-outline-variant/30 focus:outline-none focus:border-primary appearance-none cursor-pointer"
                >
                  {allProcesses.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.status})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-outline absolute right-2 top-2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Quick status pill */}
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border font-semibold ${
                isCrash
                  ? 'bg-error/15 text-error border-error/30'
                  : isDegraded
                  ? 'bg-tertiary/15 text-tertiary border-tertiary/30'
                  : isRunning
                  ? 'bg-secondary/15 text-secondary border-secondary/30'
                  : 'bg-surface-container text-outline border-outline-variant/30'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isCrash
                    ? 'bg-error animate-ping'
                    : isDegraded
                    ? 'bg-tertiary'
                    : isRunning
                    ? 'bg-secondary'
                    : 'bg-outline'
                }`}
              ></span>
              <span className="uppercase">{process.status}</span>
              {process.restarts > 0 && <span>({process.restarts} crashes)</span>}
            </span>
            <span className="text-outline bg-surface-container px-2.5 py-1 rounded border border-outline-variant/20">
              PID {process.pid > 0 ? process.pid : '—'}
            </span>
          </div>
        </div>

        {/* Title, ID & Actions Toolbar */}
        <div className="flex items-start justify-between flex-wrap gap-4 pt-1 border-t border-outline-variant/15">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-on-surface tracking-tight flex items-center gap-3">
              {process.name}
              {process.crashNote && (
                <span className="text-[12px] font-mono px-2 py-0.5 rounded bg-error/15 text-error border border-error/25 font-normal">
                  {process.crashNote}
                </span>
              )}
            </h1>
            <p className="font-mono text-[11px] text-outline flex items-center gap-3 flex-wrap">
              <span>Service ID: <code className="text-on-surface-variant font-semibold">{process.id}</code></span>
              <span>•</span>
              <span>Supervisor: <code className="text-on-surface-variant">termux-pm2 / systemd-cgroup</code></span>
              <span>•</span>
              <span>Uptime: <code className="text-secondary font-semibold">{process.uptime}</code></span>
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {isRunning ? (
              <>
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
                  onClick={() => onKillStop(process.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-error/15 text-error hover:bg-error/25 transition-colors text-[12px] font-semibold border border-error/30"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Kill & Stop</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onAction(process.id, 'start')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-secondary/15 text-secondary hover:bg-secondary/25 transition-colors text-[12px] font-semibold border border-secondary/30"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Daemon</span>
              </button>
            )}

            {(process.restarts > 0 || isCrash) && (
              <button
                type="button"
                onClick={() => onResetBackoff(process.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-container-high text-on-surface hover:bg-surface-bright transition-colors text-[12px] border border-outline-variant/30 font-mono"
              >
                <History className="w-3.5 h-3.5 text-tertiary" />
                <span>Reset Backoff</span>
              </button>
            )}

            <button
              type="button"
              onClick={exportDiagnostics}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-container-high text-on-surface hover:bg-surface-bright transition-colors text-[12px] border border-outline-variant/30 font-mono"
            >
              <Download className="w-3.5 h-3.5 text-outline" />
              <span>Export Dump</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: Telemetry & Metrics Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* CPU Allocation */}
        <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/30 flex flex-col justify-between gap-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-outline uppercase font-semibold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-primary" />
              <span>CPU Allocation</span>
            </span>
            <span className="font-mono text-[10px] text-outline">
              {process.cpuCoresUsed || '1.8 cores'}
            </span>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className={`text-2xl font-bold font-mono ${process.cpuPercent > 50 ? 'text-error' : 'text-on-surface'}`}>
                {process.cpuPercent.toFixed(1)}%
              </span>
              <span className="font-mono text-[11px] text-outline">quota 200%</span>
            </div>
            <div className="w-full bg-surface-container-highest h-1.5 rounded overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${process.cpuPercent > 50 ? 'bg-error' : 'bg-primary'}`}
                style={{ width: `${Math.min(100, (process.cpuPercent / 100) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Memory RSS vs Ceiling */}
        <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/30 flex flex-col justify-between gap-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-outline uppercase font-semibold flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-tertiary" />
              <span>Memory (RSS)</span>
            </span>
            <span className="font-mono text-[10px] text-outline">
              ceiling: 512 MB
            </span>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className={`text-2xl font-bold font-mono ${process.ramPercent > 85 ? 'text-error' : 'text-on-surface'}`}>
                {process.ramUsage}
              </span>
              <span className="font-mono text-[11px] text-outline">
                {process.ramPercent}% limit
              </span>
            </div>
            <div className="w-full bg-surface-container-highest h-1.5 rounded overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  process.ramPercent > 85 ? 'bg-error' : process.ramPercent > 60 ? 'bg-tertiary' : 'bg-secondary'
                }`}
                style={{ width: `${Math.min(100, process.ramPercent)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Restarts & Crash Rate */}
        <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/30 flex flex-col justify-between gap-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-outline uppercase font-semibold flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-secondary" />
              <span>Crash Counter</span>
            </span>
            <span className="font-mono text-[10px] text-outline">
              window: 15m
            </span>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <span className={`text-2xl font-bold font-mono ${process.restarts > 0 ? 'text-tertiary' : 'text-secondary'}`}>
                {process.restarts}
              </span>
              <span className="font-mono text-[11px] text-outline">
                {process.restarts > 0 ? `~${(process.restarts / 15).toFixed(1)}/min` : 'clean run'}
              </span>
            </div>
            <p className="font-mono text-[10px] text-outline truncate">
              {process.restarts > 0 ? 'Exceeded consecutive fault threshold' : 'Zero unhandled faults logged'}
            </p>
          </div>
        </div>

        {/* Termination Reason & Signal */}
        <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/30 flex flex-col justify-between gap-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-outline uppercase font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-error" />
              <span>Last Exit Reason</span>
            </span>
            <span className="font-mono text-[10px] text-outline">
              oom_score: {process.oomScore || -800}
            </span>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xl font-bold font-mono text-error truncate">
                {process.exitCode ? `SIGKILL (${process.exitCode})` : '0 (OK)'}
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container-highest text-outline">
                {process.exitCode === 137 ? 'OOMKilled' : 'Clean'}
              </span>
            </div>
            <p className="font-mono text-[10px] text-outline truncate">
              Linux cgroup memory controller
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: Process Specifications & Configuration Details */}
      <div className="bg-surface-container-low p-5 rounded-lg border border-outline-variant/30 shadow-xs flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold text-outline uppercase tracking-wider flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-primary" />
            <span>Process Execution Specifications</span>
          </span>
          <span className="font-mono text-[11px] text-outline">
            cgroup slice: user.slice/{process.name}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 font-mono text-[11px]">
          {/* Exec Command with copy */}
          <div className="flex flex-col gap-1.5 bg-surface-container p-3 rounded-md border border-outline-variant/20">
            <div className="flex items-center justify-between text-outline text-[10px] uppercase font-semibold">
              <span>Exec Command</span>
              <button
                type="button"
                onClick={() => copyToClipboard('cmd', process.command)}
                className="flex items-center gap-1 text-primary hover:underline lowercase font-normal"
              >
                {copiedField === 'cmd' ? <Check className="w-3 h-3 text-secondary" /> : <Copy className="w-3 h-3" />}
                <span>{copiedField === 'cmd' ? 'copied' : 'copy'}</span>
              </button>
            </div>
            <div className="bg-surface-container-lowest p-2 rounded text-primary-fixed-dim break-all select-all border border-outline-variant/20 font-mono">
              {process.command}
            </div>
          </div>

          {/* Working Directory with copy */}
          <div className="flex flex-col gap-1.5 bg-surface-container p-3 rounded-md border border-outline-variant/20">
            <div className="flex items-center justify-between text-outline text-[10px] uppercase font-semibold">
              <span>Working Directory</span>
              <button
                type="button"
                onClick={() => copyToClipboard('dir', process.workingDir)}
                className="flex items-center gap-1 text-primary hover:underline lowercase font-normal"
              >
                {copiedField === 'dir' ? <Check className="w-3 h-3 text-secondary" /> : <Copy className="w-3 h-3" />}
                <span>{copiedField === 'dir' ? 'copied' : 'copy'}</span>
              </button>
            </div>
            <div className="bg-surface-container-lowest p-2 rounded text-on-surface-variant break-all select-all border border-outline-variant/20 font-mono">
              {process.workingDir}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
          <div className="bg-surface-container p-3 rounded-md border border-outline-variant/20 flex flex-col gap-1">
            <span className="text-outline uppercase text-[10px]">Restart Policy</span>
            <div className="text-on-surface font-semibold">{process.restartPolicy}</div>
          </div>
          <div className="bg-surface-container p-3 rounded-md border border-outline-variant/20 flex flex-col gap-1">
            <span className="text-outline uppercase text-[10px]">Environment File</span>
            <div className="text-secondary flex items-center gap-1.5 font-semibold">
              <Sliders className="w-3 h-3 text-secondary shrink-0" />
              <span className="truncate">{process.envFile}</span>
            </div>
          </div>
          <div className="bg-surface-container p-3 rounded-md border border-outline-variant/20 flex flex-col gap-1">
            <span className="text-outline uppercase text-[10px]">Next Scheduled Tick</span>
            <div className="text-outline-variant font-semibold">
              {process.nextRun || 'Continuous Loop (realtime event loop)'}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Two-Column Deep Inspection: Secrets/Env Manager & Lifecycle Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Secrets & Environment Manager */}
        <div className="bg-surface-container-low p-5 rounded-lg border border-outline-variant/30 shadow-xs flex flex-col gap-3.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-mono text-[11px] font-semibold text-outline uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-secondary" />
              <span>Environment & Secrets Manager</span>
            </span>
            <button
              type="button"
              onClick={() => setShowAddVarModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-surface-container-high hover:bg-surface-bright text-primary text-[11px] font-mono rounded transition-colors border border-outline-variant/30"
            >
              <Plus className="w-3 h-3" />
              <span>Add Variable</span>
            </button>
          </div>

          {/* Add variable form */}
          {showAddVarModal && (
            <form onSubmit={handleAddVariable} className="p-3 bg-surface-container rounded border border-primary/40 flex flex-col gap-2 font-mono">
              <span className="font-semibold text-[12px] text-on-surface">Inject Environment Variable</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="VARIABLE_NAME"
                  value={newVarKey}
                  onChange={(e) => setNewVarKey(e.target.value)}
                  className="bg-surface-container-lowest border border-outline-variant/40 rounded px-2.5 py-1.5 text-[11px] text-on-surface focus:outline-none focus:border-primary"
                />
                <input
                  type="text"
                  placeholder="Value..."
                  value={newVarVal}
                  onChange={(e) => setNewVarVal(e.target.value)}
                  className="bg-surface-container-lowest border border-outline-variant/40 rounded px-2.5 py-1.5 text-[11px] text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setShowAddVarModal(false)}
                  className="px-2.5 py-1 rounded bg-surface-container-high text-outline hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 font-semibold rounded bg-primary text-on-primary hover:opacity-90"
                >
                  Save Variable
                </button>
              </div>
            </form>
          )}

          {/* Search bar */}
          <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded text-outline border border-outline-variant/20">
            <Search className="w-3.5 h-3.5" />
            <input
              type="text"
              value={envSearch}
              onChange={(e) => setEnvSearch(e.target.value)}
              placeholder="Search variables (e.g. KEY, RPC, SECRET)..."
              className="bg-transparent border-none text-on-surface placeholder-outline font-mono text-[11px] focus:outline-none w-full"
            />
          </div>

          {/* Variables List */}
          <div className="flex flex-col gap-1.5 max-h-[290px] overflow-y-auto pr-1">
            {envList.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-2.5 bg-surface-container rounded font-mono text-[11px] border border-outline-variant/15"
              >
                <span className="text-on-surface font-semibold truncate mr-2">{item.key}</span>
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
                        title={showSecret ? 'Hide secret' : 'Reveal secret'}
                      >
                        {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-on-surface-variant truncate max-w-[180px]">
                        {item.val}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.key, item.val || '')}
                        className="text-outline hover:text-on-surface p-1"
                        title="Copy value"
                      >
                        {copiedField === item.key ? (
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
        </div>

        {/* Right Column: Lifecycle Event Timeline */}
        <div className="bg-surface-container-low p-5 rounded-lg border border-outline-variant/30 shadow-xs flex flex-col gap-3.5">
          <span className="font-mono text-[11px] font-semibold text-outline uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-tertiary" />
            <span>Supervisor Lifecycle Timeline</span>
          </span>

          <div className="bg-surface-container rounded-md p-4 border border-outline-variant/20 flex-1 flex flex-col justify-between">
            <div className="relative pl-6 flex flex-col gap-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-surface-container-highest">
              {/* Event 1 */}
              <div className="relative flex flex-col gap-0.5">
                <div className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-error ring-4 ring-surface-container"></div>
                <div className="flex items-baseline justify-between font-mono text-[11px]">
                  <span className="text-error font-semibold">Exit Code 137 (OOMKilled)</span>
                  <span className="text-outline text-[10px]">14:02:11</span>
                </div>
                <p className="text-[12px] text-on-surface-variant leading-snug">
                  Cgroup terminated process instance due to memory ceiling breach (&gt;512 MB).
                </p>
              </div>

              {/* Event 2 */}
              <div className="relative flex flex-col gap-0.5">
                <div className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-surface-container"></div>
                <div className="flex items-baseline justify-between font-mono text-[11px]">
                  <span className="text-primary font-semibold">Process Respawned</span>
                  <span className="text-outline text-[10px]">14:01:41</span>
                </div>
                <p className="text-[12px] text-on-surface-variant leading-snug">
                  Supervisor restarted daemon under PID {process.pid || 31024} after backoff cooldown.
                </p>
              </div>

              {/* Event 3 */}
              <div className="relative flex flex-col gap-0.5">
                <div className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-tertiary ring-4 ring-surface-container"></div>
                <div className="flex items-baseline justify-between font-mono text-[11px]">
                  <span className="text-tertiary font-semibold">Memory Warning Limit 85%</span>
                  <span className="text-outline text-[10px]">14:00:58</span>
                </div>
                <p className="text-[12px] text-on-surface-variant leading-snug">
                  Heap allocation reached 438 MB. Order book snapshot queue accumulating frames.
                </p>
              </div>

              {/* Event 4 */}
              <div className="relative flex flex-col gap-0.5">
                <div className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-secondary ring-4 ring-surface-container"></div>
                <div className="flex items-baseline justify-between font-mono text-[11px]">
                  <span className="text-secondary font-semibold">Daemon Initialized</span>
                  <span className="text-outline text-[10px]">14:00:12</span>
                </div>
                <p className="text-[12px] text-on-surface-variant leading-snug">
                  Spawned under slice <code className="font-mono text-[10px] text-outline">user.slice/{process.name}</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Dedicated Live stdout / stderr Terminal Stream */}
      <div className="bg-surface-container-low p-5 rounded-lg border border-outline-variant/30 shadow-xs flex flex-col gap-3.5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-secondary" />
            <span className="font-mono text-[12px] font-semibold text-on-surface uppercase tracking-wide">
              Live Console Output — {process.name}
            </span>
            <span className="font-mono text-[11px] text-secondary flex items-center gap-1.5 ml-2">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse"></span>
              <span>tail -n 100 -f</span>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Log level filter */}
            <div className="flex items-center bg-surface-container rounded p-0.5 font-mono text-[10px] border border-outline-variant/20">
              {(['ALL', 'INFO', 'WARN', 'ERR'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLogLevel(lvl)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    logLevel === lvl
                      ? 'bg-primary text-on-primary font-semibold'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Grep search */}
            <div className="flex items-center gap-1.5 bg-surface-container px-2 py-1 rounded text-outline border border-outline-variant/20 font-mono text-[11px]">
              <Search className="w-3 h-3" />
              <input
                type="text"
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                placeholder="grep logs..."
                className="bg-transparent border-none text-on-surface placeholder-outline text-[11px] focus:outline-none w-24 sm:w-32"
              />
            </div>

            {/* Clear logs */}
            <button
              type="button"
              onClick={() => setExtraLogs([])}
              title="Clear terminal buffer"
              className="p-1 rounded bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors border border-outline-variant/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Terminal Canvas */}
        <div
          ref={terminalContainerRef}
          className="bg-[#080A0E] rounded-md p-4 flex flex-col gap-1 font-mono text-[11px] text-outline overflow-x-auto select-all h-80 overflow-y-auto border border-outline-variant/30 leading-relaxed shadow-inner"
        >
          {filteredLogs.map((log) => {
            let levelColor = 'text-primary';
            if (log.level === 'WARN') levelColor = 'text-tertiary';
            if (log.level === 'ERR' || log.level === 'FATAL' || log.level === 'CRIT') levelColor = 'text-error font-semibold';
            if (log.level === 'DEBUG') levelColor = 'text-secondary';
            if (log.level === 'SUPERVISOR') levelColor = 'text-tertiary-fixed-dim';

            return (
              <div key={log.id} className="flex items-start gap-2 hover:bg-white/5 px-1 rounded">
                <span className="text-surface-bright shrink-0 select-none">[{log.timestamp}]</span>
                <span className={`shrink-0 ${levelColor}`}>[{log.level}]</span>
                <span className="text-outline shrink-0 font-semibold">&lt;{log.tag}&gt;</span>
                <span className="text-on-surface-variant break-all">{log.message}</span>
              </div>
            );
          })}
        </div>

        {/* Interactive Shell Execution Bar */}
        <form
          onSubmit={handleRunCommand}
          className="flex items-center gap-2 bg-[#080A0E] px-3 py-2 rounded-md border border-outline-variant/30 font-mono text-[11px]"
        >
          <span className="text-secondary font-semibold">operator@termux</span>
          <span className="text-outline">:</span>
          <span className="text-primary truncate max-w-[140px]">~/bots/{process.id}</span>
          <span className="text-outline">$</span>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Type supervisor command (status, restart, ps, clear)..."
            className="flex-1 bg-transparent border-none text-on-surface placeholder-outline font-mono text-[11px] focus:outline-none"
          />
          <button
            type="submit"
            className="px-2.5 py-1 rounded bg-primary text-on-primary font-semibold hover:opacity-90 transition-opacity flex items-center gap-1 shrink-0"
          >
            <Send className="w-3 h-3" />
            <span>Execute</span>
          </button>
        </form>

        {/* Cooldown Timer Bar if Crash Loop */}
        {isCrash && (
          <div className="p-3 bg-error/10 border border-error/30 rounded-md flex items-center justify-between font-mono text-[11px] flex-wrap gap-2">
            <div className="flex items-center gap-2 text-error">
              <AlertTriangle className="w-4 h-4" />
              <span>Backoff cooldown in progress: Next restart attempt in {cooldownSeconds}s</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCooldownSeconds(0)}
                className="px-2.5 py-1 bg-surface-container-high hover:bg-surface-bright text-on-surface rounded border border-outline-variant/30"
              >
                Clear Backoff Queue
              </button>
              <button
                type="button"
                onClick={() => {
                  onForceRestart(process.id);
                  setCooldownSeconds(45);
                }}
                className="px-3 py-1 bg-primary text-on-primary rounded font-semibold hover:opacity-90"
              >
                Manual Spin Up
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
