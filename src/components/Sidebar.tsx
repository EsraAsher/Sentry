import React from 'react';
import { ActiveTab } from '../types';
import { 
  Layers, 
  Cpu, 
  Terminal, 
  GitFork, 
  Sliders,
  ExternalLink
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  openLogsDrawer: () => void;
  crashCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openLogsDrawer,
  crashCount,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string; badgeColor?: string }[] = [
    {
      id: 'processes',
      label: 'Process Fleet',
      icon: <Layers className="w-4 h-4" />,
      badge: crashCount > 0 ? `${crashCount}` : undefined,
      badgeColor: 'bg-error/15 text-error border border-error/30',
    },
    {
      id: 'telemetry',
      label: 'Hardware Sysfs',
      icon: <Cpu className="w-4 h-4" />,
    },
    {
      id: 'terminal',
      label: 'Live Stream Logs',
      icon: <Terminal className="w-4 h-4" />,
    },
    {
      id: 'cascades',
      label: 'Dependency Graph',
      icon: <GitFork className="w-4 h-4" />,
    },
    {
      id: 'config',
      label: 'Daemon Config',
      icon: <Sliders className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low z-40 flex flex-col justify-between border-r border-outline-variant/30 select-none">
      <div className="flex flex-col">
        {/* Brand identity header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-outline-variant/25 bg-surface-container-lowest">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-primary/10 border border-primary/25 flex items-center justify-center text-primary font-mono text-[12px] font-bold">
              BS
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-[13px] tracking-tight text-on-surface">
                bot-sentry
              </span>
              <span className="font-mono text-[10px] text-outline">
                Termux • ARM64
              </span>
            </div>
          </div>
          <span className="px-1.5 py-0.5 font-mono text-[10px] text-outline bg-surface-container-high rounded border border-outline-variant/30">
            v2.4
          </span>
        </div>

        {/* Section title */}
        <div className="px-4 pt-4 pb-2 font-mono text-[10px] font-semibold text-outline uppercase tracking-wider">
          Views
        </div>

        {/* Navigation items */}
        <nav className="flex flex-col gap-0.5 px-2.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-[13px] transition-colors text-left ${
                  isActive
                    ? 'bg-surface-container-high text-primary font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={isActive ? 'text-primary' : 'text-outline'}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-semibold shrink-0 ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Vitals & Quick Logs Drawer */}
      <div className="p-3 border-t border-outline-variant/20 bg-surface-container-lowest">
        <button
          type="button"
          onClick={openLogsDrawer}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface transition-colors font-mono text-[11px] mb-2.5"
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span>Console Drawer</span>
          </div>
          <ExternalLink className="w-3 h-3 text-outline" />
        </button>

        <div className="flex items-center justify-between font-mono text-[10px] text-outline">
          <span>HOST: SM-A315F</span>
          <span>UP: 18d 04h</span>
        </div>
      </div>
    </aside>
  );
};
