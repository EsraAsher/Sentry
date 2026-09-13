import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  ProcessItem, 
  HardwareTelemetry, 
  ActiveTab, 
  AuthKeyItem, 
  ToastItem 
} from './types';
import { 
  initialProcesses, 
  initialHardware, 
  initialAuthKeys, 
  initialToasts
} from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ProcessCard } from './components/ProcessCard';
import { ProcessTableView } from './components/ProcessTableView';
import { ProcessDetailView } from './components/ProcessDetailView';
import { LiveLogDrawer } from './components/LiveLogDrawer';
import { AuthModal } from './components/AuthModal';
import { ToastStack } from './components/ToastStack';
import { HardwareTelemetryView } from './components/HardwareTelemetryView';
import { StreamTerminalView } from './components/StreamTerminalView';
import { FailureCascadesView } from './components/FailureCascadesView';
import { DaemonConfigView } from './components/DaemonConfigView';
import { 
  RotateCw, 
  AlertCircle, 
  Sliders,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  const [processes, setProcesses] = useState<ProcessItem[]>(initialProcesses);
  const [hardware, setHardware] = useState<HardwareTelemetry>(initialHardware);
  const [authKeys, setAuthKeys] = useState<AuthKeyItem[]>(initialAuthKeys);
  const [toasts, setToasts] = useState<ToastItem[]>(initialToasts);
  const [activeTab, setActiveTab] = useState<ActiveTab>('processes');
  const [activeFilter, setActiveFilter] = useState<'all' | 'running' | 'alerting' | 'stopped'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  
  // Drawer and modal states
  const [inspectedProcess, setInspectedProcess] = useState<ProcessItem | null>(null);
  const [isLogsDrawerOpen, setIsLogsDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPolling, setIsPolling] = useState(true);

  // Fleet summary calculation
  const fleetSummary = useMemo(() => ({
    total: processes.length,
    running: processes.filter((p) => p.status === 'running' || p.status === 'idle').length,
    degraded: processes.filter((p) => p.status === 'degraded').length,
    crashLoop: processes.filter((p) => p.status === 'crash_loop').length,
    stopped: processes.filter((p) => p.status === 'stopped').length,
  }), [processes]);

  // Current live inspected process instance with freshest state
  const liveInspectedProcess = useMemo(() => {
    if (!inspectedProcess) return null;
    return processes.find((p) => p.id === inspectedProcess.id) || inspectedProcess;
  }, [inspectedProcess, processes]);

  // Ensure window is always at top when navigating to an inspected process or changing tabs
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [inspectedProcess?.id, activeTab]);

  // Filtered and searched processes
  const filteredProcesses = useMemo(() => {
    return processes.filter((p) => {
      // 1. Status Filter
      if (activeFilter === 'running' && !(p.status === 'running' || p.status === 'idle')) return false;
      if (activeFilter === 'alerting' && !(p.status === 'crash_loop' || p.status === 'degraded')) return false;
      if (activeFilter === 'stopped' && p.status !== 'stopped') return false;

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(query);
        const matchPid = p.pid.toString().includes(query);
        const matchCommand = p.command.toLowerCase().includes(query);
        const matchStatus = p.status.toLowerCase().includes(query);
        return matchName || matchPid || matchCommand || matchStatus;
      }

      return true;
    });
  }, [processes, activeFilter, searchQuery]);

  // Push new toast notification
  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [{ ...toast, id }, ...prev.slice(0, 3)]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Daemon actions: start, stop, restart, reset
  const handleProcessAction = useCallback((processId: string, action: 'start' | 'stop' | 'restart' | 'reset') => {
    setProcesses((prev) =>
      prev.map((proc) => {
        if (proc.id !== processId) return proc;

        if (action === 'start') {
          addToast({
            type: 'online',
            title: 'Daemon Started',
            tag: 'ONLINE',
            codeTarget: proc.name,
            message: `Daemon initialized with PID ${Math.floor(28000 + Math.random() * 4000)}.`,
            meta: {},
            timestamp: 'Just now',
          });
          return {
            ...proc,
            status: 'running',
            pid: Math.floor(28000 + Math.random() * 4000),
            uptime: 'up 00m 02s',
          };
        }

        if (action === 'stop') {
          addToast({
            type: 'warn',
            title: 'Daemon Stopped',
            tag: 'STOPPED',
            codeTarget: proc.name,
            message: `PID ${proc.pid} terminated via SIGTERM gracefully.`,
            meta: {},
            timestamp: 'Just now',
          });
          return {
            ...proc,
            status: 'stopped',
            uptime: 'stopped',
            cpuPercent: 0,
          };
        }

        if (action === 'restart') {
          addToast({
            type: 'online',
            title: 'Daemon Restarted',
            tag: 'RELOAD',
            codeTarget: proc.name,
            message: `Respawn initiated with clean heap allocation.`,
            meta: {},
            timestamp: 'Just now',
          });
          return {
            ...proc,
            status: 'restarting',
            uptime: 'up 00m 01s',
          };
        }

        if (action === 'reset') {
          addToast({
            type: 'online',
            title: 'Crash Count Cleared',
            tag: 'RESET',
            codeTarget: proc.name,
            message: `Backoff counter reset to 0. Daemon reinstated into active fleet loop.`,
            meta: {},
            timestamp: 'Just now',
          });
          return {
            ...proc,
            status: 'running',
            restarts: 0,
            fails: 0,
            crashNote: undefined,
            exitCode: undefined,
            uptime: 'up 00m 05s',
            cpuPercent: 4.2,
            ramUsage: '92.4 MB',
            ramPercent: 24,
          };
        }

        return proc;
      })
    );
  }, [addToast]);

  // Restart all alerting services
  const handleRestartAllAlerting = useCallback(() => {
    setProcesses((prev) =>
      prev.map((proc) => {
        if (proc.status === 'crash_loop' || proc.status === 'degraded') {
          return {
            ...proc,
            status: 'running',
            restarts: 0,
            fails: 0,
            crashNote: undefined,
            exitCode: undefined,
            uptime: 'up 00m 01s',
          };
        }
        return proc;
      })
    );
    addToast({
      type: 'online',
      title: 'Alerting Services Restarted',
      tag: 'FLEET',
      message: 'All failing and degraded daemons have been reset and restarted.',
      meta: {},
      timestamp: 'Just now',
    });
  }, [addToast]);

  // Periodic simulated telemetry fluctuation
  const refreshAllTelemetry = useCallback(() => {
    setHardware((prev) => {
      const cpuDelta = (Math.random() * 4 - 2);
      const newCpu = Math.min(65, Math.max(12, Math.round(prev.cpuTotalPercent + cpuDelta)));
      return {
        ...prev,
        cpuTotalPercent: newCpu,
        loadAvg1m: Number((1.0 + Math.random() * 0.3).toFixed(2)),
      };
    });
  }, []);

  // Actions from Drawer
  const handleKillStop = (id: string) => {
    handleProcessAction(id, 'stop');
    setInspectedProcess(null);
  };

  const handleForceRestart = (id: string) => {
    handleProcessAction(id, 'restart');
    setTimeout(() => {
      setProcesses((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'running', uptime: 'up 00m 04s' } : p))
      );
    }, 1200);
  };

  const handleResetBackoff = (id: string) => {
    handleProcessAction(id, 'reset');
    setInspectedProcess((prev) => (prev && prev.id === id ? { ...prev, status: 'running', restarts: 0 } : prev));
  };

  const alertingCount = fleetSummary.crashLoop + fleetSummary.degraded;

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col antialiased selection:bg-primary/25">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'processes' && inspectedProcess) {
            setInspectedProcess(null);
          }
          setActiveTab(tab);
        }}
        openLogsDrawer={() => setIsLogsDrawerOpen(true)}
        crashCount={fleetSummary.crashLoop}
      />

      {/* 2. Top Sleek Unified Header */}
      <Header
        hardware={hardware}
        fleetSummary={fleetSummary}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
        openAuthModal={() => setIsAuthModalOpen(true)}
        onRefreshAll={refreshAllTelemetry}
        isPolling={isPolling}
        setIsPolling={setIsPolling}
      />

      {/* 3. Non-obtrusive Toast Notifications (Bottom Right) */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      {/* 4. Main Content Area */}
      <main className="ml-64 pt-14 min-h-screen p-6 pb-20 flex flex-col">
        {/* VIEW 1: Processes Fleet OR Dedicated Full Page for Inspected Service */}
        {activeTab === 'processes' && (
          liveInspectedProcess ? (
            <ProcessDetailView
              process={liveInspectedProcess}
              allProcesses={processes}
              onBack={() => setInspectedProcess(null)}
              onSelectProcess={(p) => setInspectedProcess(p)}
              onAction={handleProcessAction}
              onKillStop={handleKillStop}
              onForceRestart={handleForceRestart}
              onResetBackoff={handleResetBackoff}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {/* Filter Pills & Quick Actions Bar */}
            <div className="flex items-center justify-between flex-wrap gap-3 pb-1">
              <div className="flex items-center gap-1.5 font-mono text-[12px]">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    activeFilter === 'all'
                      ? 'bg-surface-container-high text-on-surface font-semibold border border-outline-variant/50'
                      : 'text-outline hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  All ({fleetSummary.total})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('running')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    activeFilter === 'running'
                      ? 'bg-secondary/15 text-secondary font-semibold border border-secondary/30'
                      : 'text-outline hover:text-secondary hover:bg-surface-container'
                  }`}
                >
                  Running ({fleetSummary.running})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('alerting')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    activeFilter === 'alerting'
                      ? 'bg-error/15 text-error font-semibold border border-error/30'
                      : 'text-outline hover:text-error hover:bg-surface-container'
                  }`}
                >
                  Alerting ({alertingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('stopped')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    activeFilter === 'stopped'
                      ? 'bg-surface-container-high text-outline font-semibold border border-outline-variant/50'
                      : 'text-outline hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  Stopped ({fleetSummary.stopped})
                </button>
              </div>

              {/* Action: Quick Restart for Alerting processes */}
              {alertingCount > 0 && (
                <button
                  type="button"
                  onClick={handleRestartAllAlerting}
                  className="flex items-center gap-1.5 px-3 py-1 bg-error/15 hover:bg-error/25 text-error text-[12px] font-mono rounded-md border border-error/30 transition-colors"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Restart {alertingCount} Alerting</span>
                </button>
              )}
            </div>

            {/* Empty State */}
            {filteredProcesses.length === 0 && (
              <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-dashed border-outline-variant/30 bg-surface-container-low">
                <AlertCircle className="w-8 h-8 text-outline mb-2" />
                <p className="font-semibold text-on-surface text-[14px]">No matching daemons found</p>
                <p className="text-outline text-[12px] mt-1 font-mono">
                  Try adjusting the search query or status filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                  }}
                  className="mt-3 px-3 py-1 rounded bg-surface-container-high text-on-surface text-[12px] font-mono hover:bg-surface-container transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* View Render: Table vs Cards */}
            {filteredProcesses.length > 0 && (
              viewMode === 'table' ? (
                <ProcessTableView
                  processes={filteredProcesses}
                  onSelect={(p) => setInspectedProcess(p)}
                  onAction={handleProcessAction}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5">
                  {filteredProcesses.map((proc) => (
                    <ProcessCard
                      key={proc.id}
                      process={proc}
                      onSelect={(p) => setInspectedProcess(p)}
                      onAction={handleProcessAction}
                    />
                  ))}
                </div>
              )
            )}
          </div>
          )
        )}

        {/* VIEW 2: Hardware & Telemetry */}
        {activeTab === 'telemetry' && (
          <HardwareTelemetryView
            hardware={hardware}
            onDumpLogs={() => {
              addToast({
                type: 'synced',
                title: 'Sysfs Dump Generated',
                tag: 'DUMP',
                codeTarget: '/sdcard/telemetry.json',
                message: 'Thermal zones, core governors, and battery metrics saved.',
                meta: {},
                timestamp: 'Just now',
              });
            }}
          />
        )}

        {/* VIEW 3: Stream stdout/stderr */}
        {activeTab === 'terminal' && (
          <StreamTerminalView
            processes={processes}
            onTriggerLog={(procId, level, msg) => {
              setProcesses((prev) =>
                prev.map((p) => {
                  if (p.id !== procId) return p;
                  return {
                    ...p,
                    logs: [
                      ...p.logs,
                      {
                        id: `log-${Date.now()}`,
                        timestamp: new Date().toISOString().substring(11, 23),
                        level: level as any,
                        tag: p.name,
                        message: msg,
                      },
                    ],
                  };
                })
              );
            }}
          />
        )}

        {/* VIEW 4: Failure Cascades */}
        {activeTab === 'cascades' && (
          <FailureCascadesView
            processes={processes}
            onSelectProcess={(id) => {
              const p = processes.find((proc) => proc.id === id);
              if (p) setInspectedProcess(p);
            }}
            onRestartChain={(primaryId) => {
              handleProcessAction(primaryId, 'restart');
              addToast({
                type: 'online',
                title: 'Cascade Chain Restarted',
                tag: 'CASCADE',
                codeTarget: primaryId,
                message: 'Triggered sequenced recovery of upstream & downstream daemons.',
                meta: {},
                timestamp: 'Just now',
              });
            }}
          />
        )}

        {/* VIEW 5: Daemon Config */}
        {activeTab === 'config' && (
          <DaemonConfigView
            processes={processes}
            onSaveConfig={(updatedDaemons) => {
              setProcesses(updatedDaemons);
              addToast({
                type: 'synced',
                title: 'Configuration Reloaded',
                tag: 'SYNCED',
                codeTarget: 'bot-sentry.toml',
                message: 'Daemon specifications synchronized without service interruption.',
                meta: {},
                timestamp: 'Just now',
              });
            }}
          />
        )}
      </main>

      {/* Live Log Bottom Drawer */}
      <LiveLogDrawer
        isOpen={isLogsDrawerOpen}
        onClose={() => setIsLogsDrawerOpen(false)}
        processes={processes}
        activeProcess={liveInspectedProcess || undefined}
      />

      {/* Bearer Token & Scopes Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        keys={authKeys}
        authKeys={authKeys}
        onGenerateNewKey={(identifier, scopes) => {
          const newKey: AuthKeyItem = {
            id: `key-${Date.now()}`,
            identifier,
            tokenMasked: 'bsk_••••••••••••••••••••••••••••••••••••••',
            tokenFull: `bsk_live_${Math.random().toString(36).substring(2, 12)}_${Math.random().toString(36).substring(2, 12)}`,
            issued: 'Just now',
            activity: 'Never',
            revoked: false,
            scopes,
          };
          setAuthKeys((prev) => [newKey, ...prev]);
          addToast({
            type: 'online',
            title: 'API Token Generated',
            tag: 'AUTH',
            codeTarget: identifier,
            message: `Scoped key provisioned with ${scopes.length} capability grants.`,
            meta: {},
            timestamp: 'Just now',
          });
        }}
        onRevokeKey={(id) => {
          setAuthKeys((prev) =>
            prev.map((k) => (k.id === id ? { ...k, revoked: true } : k))
          );
          addToast({
            type: 'warn',
            title: 'API Token Revoked',
            tag: 'REVOKED',
            message: 'Token invalidated immediately across all daemon sockets.',
            meta: {},
            timestamp: 'Just now',
          });
        }}
      />
    </div>
  );
}
