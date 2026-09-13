export type ProcessStatus = 'running' | 'degraded' | 'crash_loop' | 'restarting' | 'idle' | 'stopped';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERR' | 'DEBUG' | 'FATAL' | 'CRIT' | 'SUPERVISOR';
  tag: string;
  message: string;
}

export interface ProcessItem {
  id: string;
  name: string;
  status: ProcessStatus;
  pid: number;
  uptime: string;
  ramUsage: string;
  ramPercent: number;
  storage: string;
  restarts: number;
  fails: number;
  exitCode?: number;
  crashNote?: string;
  latency?: string;
  nextRun?: string;
  cpuPercent: number;
  cpuCoresUsed?: string;
  command: string;
  workingDir: string;
  restartPolicy: string;
  envFile: string;
  oomScore: number;
  logs: LogEntry[];
}

export interface HardwareTelemetry {
  batteryPercent: number;
  batteryTemp: number;
  powerSource: string;
  bypassPower: boolean;
  cpuTotalPercent: number;
  cpuFrequency: string;
  ramUsedGB: number;
  ramTotalGB: number;
  diskUsedGB: number;
  diskTotalGB: number;
  thm0Temp: number;
  thm0Status: string;
  loadAvg1m: number;
  loadAvg5m: number;
  loadAvg15m: number;
  oomScorePeak: number;
  wakelockHeld: boolean;
  efficiencyCoresFreq: string;
  efficiencyCoresTemp: string;
  performanceCoresFreq: string;
  performanceCoresTemp: string;
}

export interface AuthKeyItem {
  id: string;
  identifier: string;
  tokenMasked: string;
  tokenFull: string;
  issued: string;
  activity: string;
  revoked: boolean;
  scopes: string[];
}

export interface ToastItem {
  id: string;
  type: 'critical' | 'warn' | 'online' | 'synced';
  title: string;
  tag: string;
  message: string;
  codeTarget?: string;
  meta: Record<string, string>;
  timestamp: string;
}

export type ActiveTab = 'processes' | 'telemetry' | 'terminal' | 'cascades' | 'config';
