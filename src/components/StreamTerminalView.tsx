import React, { useState, useRef, useEffect } from 'react';
import { ProcessItem, LogEntry } from '../types';
import { 
  Terminal, 
  Search, 
  Trash2, 
  Download, 
  Filter, 
  Layers, 
  Play, 
  RefreshCw 
} from 'lucide-react';

interface StreamTerminalViewProps {
  processes: ProcessItem[];
  onTriggerLog: (procId: string, level: string, msg: string) => void;
}

export const StreamTerminalView: React.FC<StreamTerminalViewProps> = ({
  processes,
  onTriggerLog,
}) => {
  const [selectedProcessId, setSelectedProcessId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [logLevel, setLogLevel] = useState<'ALL' | 'INFO' | 'WARN' | 'ERR'>('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const [cliInput, setCliInput] = useState('');
  const [localLines, setLocalLines] = useState<LogEntry[]>([]);
  const terminalBoxRef = useRef<HTMLDivElement>(null);

  // Combine logs
  const combinedLogs: (LogEntry & { source: string })[] = [];
  processes.forEach((p) => {
    (p.logs || []).forEach((l) => {
      combinedLogs.push({ ...l, source: p.name });
    });
  });
  localLines.forEach((l) => {
    combinedLogs.push({ ...l, source: 'cli' });
  });

  // Sort by timestamp
  combinedLogs.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  // Filter
  const filtered = combinedLogs.filter((item) => {
    if (selectedProcessId !== 'all' && item.source !== selectedProcessId && item.source !== 'cli') {
      return false;
    }
    if (logLevel !== 'ALL' && !item.level.includes(logLevel)) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        item.message.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q) ||
        item.tag.toLowerCase().includes(q)
      );
    }
    return true;
  });

  useEffect(() => {
    if (autoScroll && terminalBoxRef.current) {
      terminalBoxRef.current.scrollTop = terminalBoxRef.current.scrollHeight;
    }
  }, [filtered.length, autoScroll]);

  const handleRunCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliInput.trim()) return;

    const cmd = cliInput.trim();
    const time = new Date().toISOString().slice(11, 23);
    const cmdLog: LogEntry = {
      id: `cli-${Date.now()}`,
      timestamp: time,
      level: 'INFO',
      tag: 'sh',
      message: `$ ${cmd}`,
    };

    let responseLog: LogEntry | null = null;
    if (cmd === 'ps' || cmd === 'ps -ef') {
      responseLog = {
        id: `cli-res-${Date.now()}`,
        timestamp: time,
        level: 'INFO',
        tag: 'proc',
        message: 'UID        PID  PPID  C STIME TTY          TIME CMD\nu0_a311  28411     1  0 14:00 ?        00:00:14 node ./dist/index.js\nu0_a311  31024     1 94 14:01 ?        00:01:29 python3 -u ./agents/market_stream.py',
      };
    } else if (cmd === 'uptime') {
      responseLog = {
        id: `cli-res-${Date.now()}`,
        timestamp: time,
        level: 'INFO',
        tag: 'sys',
        message: '14:04:12 up 18 days, 4:22,  1 user,  load average: 1.14, 0.98, 0.82',
      };
    } else if (cmd === 'free -m' || cmd === 'free') {
      responseLog = {
        id: `cli-res-${Date.now()}`,
        timestamp: time,
        level: 'INFO',
        tag: 'mem',
        message: '               total        used        free      shared  buff/cache   available\nMem:            5756        2877        1214         142        1665        2737\nSwap:           3072         840        2232',
      };
    } else {
      responseLog = {
        id: `cli-res-${Date.now()}`,
        timestamp: time,
        level: 'INFO',
        tag: 'sh',
        message: `exec: ${cmd} executed successfully. exit code: 0`,
      };
    }

    setLocalLines((prev) => [...prev, cmdLog, ...(responseLog ? [responseLog] : [])]);
    setCliInput('');
  };

  const downloadAllLogs = () => {
    const text = filtered
      .map((l) => `[${l.timestamp}] [${l.level}] [${l.source}/${l.tag}] ${l.message}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentry-stream-dump-${Date.now()}.log`;
    a.click();
  };

  return (
    <div className="flex flex-col gap-4 w-full h-[calc(100vh-140px)] select-none">
      {/* Controls Bar */}
      <div className="bg-surface-container rounded-lg p-3 border border-outline-variant/20 flex items-center justify-between gap-3 flex-wrap">
        {/* Daemon select */}
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <select
            value={selectedProcessId}
            onChange={(e) => setSelectedProcessId(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant/30 rounded px-2.5 py-1 text-[12px] font-mono text-on-surface focus:outline-none"
          >
            <option value="all">Stream: All Daemons (8)</option>
            {processes.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name} ({p.status})
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-surface-container-lowest px-2.5 py-1 rounded border border-outline-variant/30 flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-outline" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Regex search or message filter..."
            className="bg-transparent border-none text-on-surface font-mono text-[11px] focus:outline-none w-full"
          />
        </div>

        {/* Level filter */}
        <div className="flex items-center bg-surface-container-lowest p-0.5 rounded border border-outline-variant/30">
          {(['ALL', 'INFO', 'WARN', 'ERR'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setLogLevel(lvl)}
              className={`px-2.5 py-0.5 rounded font-mono text-[10px] transition-colors ${
                logLevel === lvl
                  ? 'bg-surface-container-high text-on-surface font-bold'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Autoscroll & Actions */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer bg-surface-container-lowest px-2.5 py-1 rounded border border-outline-variant/30 font-mono text-[11px]">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="accent-primary h-3 w-3"
            />
            <span className="text-on-surface-variant">Autoscroll</span>
          </label>

          <button
            type="button"
            onClick={() => setLocalLines([])}
            className="p-1.5 rounded bg-surface-container-lowest hover:bg-surface-container-high text-outline hover:text-on-surface border border-outline-variant/30"
            title="Clear buffer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={downloadAllLogs}
            className="flex items-center gap-1.5 px-3 py-1 bg-surface-container-high hover:bg-surface-bright text-on-surface rounded text-[12px] font-mono border border-outline-variant/30"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Main Terminal Box */}
      <div className="flex-1 bg-[#080A0E] rounded-lg border border-outline-variant/30 overflow-hidden flex flex-col shadow-inner">
        {/* Header bar */}
        <div className="h-8 px-4 bg-surface-container-low flex items-center justify-between border-b border-outline-variant/20 font-mono text-[11px] text-outline">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span>multiplexed_stream.pts</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Buffer: {filtered.length} lines</span>
            <span>PID Namespace: u0_a311</span>
          </div>
        </div>

        {/* Lines */}
        <div
          ref={terminalBoxRef}
          className="flex-1 p-3 overflow-y-auto font-mono text-[11px] select-text flex flex-col gap-1 leading-relaxed"
        >
          {filtered.map((item, idx) => {
            let lvlColor = 'text-primary';
            if (item.level === 'WARN') lvlColor = 'text-tertiary';
            if (item.level === 'ERR' || item.level === 'FATAL' || item.level === 'CRIT') lvlColor = 'text-error font-bold';

            return (
              <div key={item.id || idx} className="flex items-start gap-2 hover:bg-surface-container-low/40 px-1 py-0.5 rounded">
                <span className="text-outline/40 select-none w-10 text-right shrink-0">{idx + 1}</span>
                <span className="text-outline shrink-0">[{item.timestamp}]</span>
                <span className={`shrink-0 uppercase font-semibold ${lvlColor}`}>[{item.level}]</span>
                <span className="text-secondary shrink-0">[{item.source}]</span>
                <span className="text-primary-fixed-dim shrink-0">[{item.tag}]</span>
                <span className="text-on-surface break-all whitespace-pre-wrap">{item.message}</span>
              </div>
            );
          })}
        </div>

        {/* Prompt Input Form */}
        <form onSubmit={handleRunCommand} className="h-10 px-4 bg-surface-container flex items-center gap-2 border-t border-outline-variant/20 font-mono text-[12px]">
          <span className="text-secondary font-semibold">termux-arm64</span>
          <span className="text-outline">:</span>
          <span className="text-primary">~</span>
          <span className="text-outline">$</span>
          <input
            type="text"
            value={cliInput}
            onChange={(e) => setCliInput(e.target.value)}
            placeholder="Try: ps, uptime, free -m, or any shell command..."
            className="flex-1 bg-transparent border-none text-on-surface font-mono text-[12px] focus:outline-none"
          />
          <button
            type="submit"
            className="flex items-center gap-1 px-2.5 py-1 bg-primary text-on-primary rounded text-[11px] font-semibold hover:opacity-90"
          >
            <Play className="w-3 h-3" />
            <span>Run</span>
          </button>
        </form>
      </div>
    </div>
  );
};
