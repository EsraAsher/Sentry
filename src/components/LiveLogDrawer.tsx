import React, { useState, useEffect, useRef } from 'react';
import { ProcessItem, LogEntry } from '../types';
import { 
  Terminal, 
  Search, 
  Download, 
  Trash2, 
  ChevronDown, 
  Wifi, 
  RefreshCw,
  Send
} from 'lucide-react';

interface LiveLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  processes?: ProcessItem[];
  activeProcess?: ProcessItem;
}

export const LiveLogDrawer: React.FC<LiveLogDrawerProps> = ({
  isOpen,
  onClose,
  processes = [],
  activeProcess,
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    activeProcess?.id || (processes[0]?.id ?? '')
  );
  const [filterQuery, setFilterQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'ERR'>('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const [commandInput, setCommandInput] = useState('');
  const [extraLogs, setExtraLogs] = useState<LogEntry[]>([]);
  const terminalContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeProcess?.id) {
      setSelectedId(activeProcess.id);
    } else if (processes.length > 0 && !selectedId) {
      setSelectedId(processes[0].id);
    }
  }, [activeProcess, processes, selectedId]);

  const currentProcess: ProcessItem | undefined =
    processes.find((p) => p.id === selectedId) || activeProcess || processes[0];

  // Auto scroll terminal container only
  useEffect(() => {
    if (autoScroll && isOpen && terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [extraLogs, autoScroll, isOpen]);

  // Handle command simulator
  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    const newLog: LogEntry = {
      id: `cmd-${Date.now()}`,
      timestamp: new Date().toISOString().slice(11, 23),
      level: 'INFO',
      tag: 'exec',
      message: `command executed: ${commandInput.trim()}`,
    };
    setExtraLogs((prev) => [...prev, newLog]);
    setCommandInput('');
  };

  const allLogs: LogEntry[] = [...(currentProcess?.logs || []), ...extraLogs];

  const filteredLogs = allLogs.filter((log) => {
    if (levelFilter !== 'ALL' && !log.level.includes(levelFilter)) {
      return false;
    }
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.tag.toLowerCase().includes(q) ||
        log.level.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const errCount = allLogs.filter((l) => l.level === 'ERR' || l.level === 'CRIT' || l.level === 'FATAL').length;

  const downloadLogFile = () => {
    const content = allLogs
      .map((l) => `[${l.timestamp}] [${l.level}] [${l.tag}] ${l.message}`)
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProcess?.name || 'daemon'}-tail.log`;
    a.click();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      id="log-drawer"
      className="fixed bottom-0 left-64 right-0 z-40 flex flex-col bg-surface-container-lowest shadow-2xl border-t border-outline-variant/30 transition-transform duration-200"
      style={{ height: '380px' }}
    >
      {/* Drawer Control Bar */}
      <div className="h-10 px-4 bg-surface-container-low flex items-center justify-between shrink-0 select-none border-b border-outline-variant/20">
        <div className="flex items-center gap-3 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
          </span>
          <span className="font-mono text-[12px] text-on-surface font-semibold truncate flex items-center gap-1.5">
            <span>Live Log Stream</span>
            <span className="text-outline font-normal">—</span>
            {processes.length > 1 ? (
              <select
                value={currentProcess?.id || ''}
                onChange={(e) => setSelectedId(e.target.value)}
                className="bg-surface-container-lowest text-primary font-mono text-[11px] font-medium px-2 py-0.5 rounded border border-outline-variant/30 focus:outline-none focus:border-primary"
              >
                {processes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (PID {p.pid > 0 ? p.pid : '—'})
                  </option>
                ))}
              </select>
            ) : (
              <span>
                {currentProcess?.name || 'System'}{' '}
                <span className="text-primary font-mono text-[11px]">
                  (PID {currentProcess?.pid && currentProcess.pid > 0 ? currentProcess.pid : '—'})
                </span>
              </span>
            )}
          </span>
          <span className="hidden md:inline-flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded font-mono text-[10px] text-outline uppercase border border-outline-variant/30">
            <Wifi className="w-3 h-3 text-secondary" />
            <span>STDOUT / STDERR</span>
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Grep search */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2 text-outline" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="grep / filter..."
              className="bg-surface-container-lowest text-on-surface font-mono text-[11px] pl-7 pr-2 py-1 rounded w-32 md:w-44 focus:outline-none focus:bg-surface-container border border-outline-variant/30"
            />
          </div>

          {/* Log Level filters */}
          <div className="hidden sm:flex items-center bg-surface-container-lowest p-0.5 rounded border border-outline-variant/30">
            {(['ALL', 'INFO', 'WARN', 'ERR'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevelFilter(lvl)}
                className={`px-2 py-0.5 rounded font-mono text-[10px] transition-colors ${
                  levelFilter === lvl
                    ? 'bg-surface-container-high text-on-surface font-bold'
                    : lvl === 'ERR'
                    ? 'text-error hover:bg-surface-container'
                    : lvl === 'WARN'
                    ? 'text-tertiary hover:bg-surface-container'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {lvl === 'ERR' ? `ERR (${errCount})` : lvl}
              </button>
            ))}
          </div>

          {/* Autoscroll checkbox */}
          <label className="flex items-center gap-1.5 cursor-pointer bg-surface-container px-2 py-1 rounded hover:bg-surface-container-high transition-colors select-none border border-outline-variant/20">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="accent-primary h-3 w-3 rounded cursor-pointer"
            />
            <span className="font-mono text-[11px] text-on-surface-variant">
              Autoscroll: <span className={autoScroll ? 'text-secondary font-semibold' : 'text-outline'}>{autoScroll ? 'ON' : 'OFF'}</span>
            </span>
          </label>

          <div className="h-4 w-px bg-outline-variant/30 hidden md:block"></div>

          {/* Action buttons */}
          <button
            type="button"
            onClick={() => setExtraLogs([])}
            title="Clear buffer"
            className="flex items-center gap-1 px-2 py-1 bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded font-mono text-[11px] transition-colors border border-outline-variant/20"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Clear</span>
          </button>

          <button
            type="button"
            onClick={downloadLogFile}
            title="Save stdout capture"
            className="flex items-center gap-1 px-2 py-1 bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded font-mono text-[11px] transition-colors border border-outline-variant/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">.log</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            title="Minimize log drawer"
            className="flex items-center justify-center h-6 w-6 bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface rounded transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal View */}
      <div
        ref={terminalContainerRef}
        className="flex-1 bg-[#080A0E] p-3 overflow-y-auto font-mono text-[11px] select-text flex flex-col gap-1 tracking-tight leading-relaxed"
      >
        {filteredLogs.map((log, idx) => {
          let badgeClass = 'text-secondary bg-secondary/10';
          if (log.level === 'WARN') badgeClass = 'text-tertiary bg-tertiary/10';
          if (log.level === 'ERR' || log.level === 'FATAL' || log.level === 'CRIT') badgeClass = 'text-error bg-error/10 font-bold';
          if (log.level === 'DEBUG') badgeClass = 'text-outline bg-surface-container-high';

          return (
            <div
              key={log.id}
              className="flex items-baseline gap-3 hover:bg-surface-container-low/50 px-2 py-0.5 rounded transition-colors"
            >
              <span className="text-outline/60 font-mono text-[11px] shrink-0 select-none w-10 text-right">
                {1024 + idx}
              </span>
              <div className="flex items-baseline gap-2 break-all flex-wrap">
                <span className="text-outline shrink-0">[{log.timestamp}]</span>
                <span className={`shrink-0 font-mono text-[10px] px-1 rounded uppercase font-semibold ${badgeClass}`}>
                  [{log.level}]
                </span>
                <span className="text-primary-fixed-dim shrink-0">[{log.tag}]</span>
                <span className="text-on-surface">{log.message}</span>
              </div>
            </div>
          );
        })}

        {/* Interactive Shell Prompt Line */}
        <form onSubmit={handleSendCommand} className="flex items-baseline gap-3 px-2 py-1 mt-1 bg-[#080A0E]">
          <span className="text-outline/40 font-mono text-[11px] shrink-0 select-none w-10 text-right">
            {1024 + filteredLogs.length}
          </span>
          <div className="flex items-center gap-2 text-on-surface-variant flex-1 flex-wrap">
            <span className="text-secondary font-semibold">operator@termux-a31</span>
            <span className="text-outline">:</span>
            <span className="text-primary">~/bots/{currentProcess?.id || 'fleet'}</span>
            <span className="text-outline">$</span>
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="type termux command or echo test log..."
              className="bg-transparent border-none text-on-surface font-mono text-[11px] focus:outline-none flex-1 min-w-[200px]"
            />
            <span className="inline-block w-2 h-3.5 bg-secondary animate-pulse ml-0.5 align-middle"></span>
          </div>
        </form>
      </div>

      {/* Terminal Footer Status */}
      <div className="h-7 px-4 bg-surface-container flex items-center justify-between shrink-0 font-mono text-[10px] text-outline select-none border-t border-outline-variant/20">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3 text-secondary animate-spin" style={{ animationDuration: '6s' }} />
            <span>FIFO buffer active (512 KB tail)</span>
          </span>
          <span className="hidden sm:inline">Lines: {1024 + filteredLogs.length}</span>
          <span className="hidden sm:inline">Encoding: UTF-8</span>
        </div>
        <div className="flex items-center gap-3 text-on-surface-variant">
          <span>TERM=xterm-256color</span>
          <span className="text-secondary font-semibold">LISTEN :9229</span>
        </div>
      </div>
    </div>
  );
};
