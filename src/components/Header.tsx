import React, { useState, useEffect, useRef } from 'react';
import { HardwareTelemetry } from '../types';
import { 
  Key, 
  RefreshCw, 
  Search,
  LayoutGrid,
  List,
  Play,
  Pause,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

interface HeaderProps {
  hardware: HardwareTelemetry;
  fleetSummary: {
    total: number;
    running: number;
    degraded: number;
    crashLoop: number;
    stopped: number;
  };
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: 'grid' | 'table';
  setViewMode: (mode: 'grid' | 'table') => void;
  openAuthModal: () => void;
  onRefreshAll: () => void;
  isPolling: boolean;
  setIsPolling: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Header: React.FC<HeaderProps> = ({
  hardware,
  fleetSummary,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  openAuthModal,
  onRefreshAll,
  isPolling,
  setIsPolling,
}) => {
  const [countdown, setCountdown] = useState(5);
  const onRefreshAllRef = useRef(onRefreshAll);

  useEffect(() => {
    onRefreshAllRef.current = onRefreshAll;
  }, [onRefreshAll]);

  useEffect(() => {
    if (!isPolling) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Trigger parent refresh asynchronously outside state updater cycle
          setTimeout(() => {
            onRefreshAllRef.current?.();
          }, 0);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPolling]);

  const togglePolling = () => {
    setIsPolling((prev) => !prev);
    if (!isPolling) {
      setCountdown(5);
    }
  };

  const hasAlerts = fleetSummary.crashLoop > 0 || fleetSummary.degraded > 0;

  return (
    <header className="fixed top-0 left-64 right-0 z-30 h-14 bg-surface-container-low/95 backdrop-blur-md border-b border-outline-variant/30 flex items-center justify-between px-6 select-none gap-4">
      {/* Left: Search Bar with icon */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-outline absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search daemon, pid, tag..."
            className="w-full h-8 pl-8 pr-8 rounded-md bg-surface-container-lowest border border-outline-variant/30 focus:border-primary/60 focus:outline-none text-[12px] font-sans text-on-surface placeholder:text-outline transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface text-[11px] font-mono"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Middle: Compact Status Strip */}
      <div className="hidden lg:flex items-center gap-2 font-mono text-[11px]">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
            hasAlerts
              ? 'bg-error/10 border-error/30 text-error'
              : 'bg-surface-container-lowest border-outline-variant/25 text-secondary'
          }`}
        >
          {hasAlerts ? (
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-error" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
          )}
          <span className="font-semibold">
            {hasAlerts
              ? `${fleetSummary.crashLoop + fleetSummary.degraded} Alerting`
              : `${fleetSummary.running}/${fleetSummary.total} Healthy`}
          </span>
        </div>

        <div className="flex items-center gap-2 text-outline bg-surface-container-lowest px-2.5 py-1 rounded-md border border-outline-variant/25">
          <span>CPU {hardware.cpuTotalPercent}%</span>
          <span>•</span>
          <span>RAM {hardware.ramUsedGB}G</span>
          <span>•</span>
          <span>{hardware.thm0Temp}°C</span>
        </div>
      </div>

      {/* Right Controls: View Switcher, Polling radar, Auth Key */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Table / Grid Switcher */}
        <div className="flex items-center bg-surface-container-lowest rounded-md p-0.5 border border-outline-variant/30">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            title="Card Grid View"
            className={`p-1.5 rounded text-outline transition-colors ${
              viewMode === 'grid'
                ? 'bg-surface-container-high text-on-surface font-semibold shadow-sm'
                : 'hover:text-on-surface'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            title="Table List View"
            className={`p-1.5 rounded text-outline transition-colors ${
              viewMode === 'table'
                ? 'bg-surface-container-high text-on-surface font-semibold shadow-sm'
                : 'hover:text-on-surface'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-outline-variant/30 hidden sm:block" />

        {/* Polling button */}
        <button
          type="button"
          onClick={togglePolling}
          title={isPolling ? "Auto-refreshing (click to pause)" : "Auto-refresh paused (click to resume)"}
          className={`flex items-center gap-1.5 px-2.5 h-8 bg-surface-container-lowest border border-outline-variant/30 rounded-md hover:bg-surface-container transition-colors text-[11px] font-mono ${
            isPolling ? 'text-on-surface' : 'text-outline opacity-70'
          }`}
        >
          <RefreshCw className={`w-3 h-3 ${isPolling ? 'animate-spin text-primary' : 'text-outline'}`} style={{ animationDuration: '4s' }} />
          <span>{isPolling ? `${countdown}s` : 'Paused'}</span>
        </button>

        {/* Auth token button */}
        <button
          type="button"
          onClick={openAuthModal}
          className="flex items-center gap-1.5 px-3 h-8 bg-surface-container-lowest border border-outline-variant/30 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors text-[12px] font-medium"
        >
          <Key className="w-3.5 h-3.5 text-primary" />
          <span className="hidden sm:inline">API Key</span>
        </button>
      </div>
    </header>
  );
};
