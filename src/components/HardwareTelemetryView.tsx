import React from 'react';
import { HardwareTelemetry } from '../types';
import { 
  Cpu, 
  BatteryCharging, 
  Flame, 
  HardDrive, 
  Lock, 
  Activity, 
  DownloadCloud,
  CheckCircle2
} from 'lucide-react';

interface HardwareTelemetryProps {
  hardware: HardwareTelemetry;
  onDumpLogs: () => void;
}

export const HardwareTelemetryView: React.FC<HardwareTelemetryProps> = ({
  hardware,
  onDumpLogs,
}) => {
  return (
    <div className="flex flex-col gap-5 w-full select-none">
      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-surface-container-low p-4 rounded border border-outline-variant/20 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-outline uppercase tracking-wider">Active CPU Load</span>
            <Cpu className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-2xl text-on-surface">{hardware.cpuTotalPercent}%</span>
            <span className="font-mono text-[11px] text-secondary">8 Cores Active</span>
          </div>
          <div className="font-mono text-[11px] text-outline">
            1m: {hardware.loadAvg1m} · 5m: {hardware.loadAvg5m} · 15m: {hardware.loadAvg15m}
          </div>
        </div>

        <div className="bg-surface-container-low p-4 rounded border border-outline-variant/20 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-outline uppercase tracking-wider">Physical Memory (LPDDR4x)</span>
            <Activity className="w-4 h-4 text-tertiary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-2xl text-on-surface">{hardware.ramUsedGB} <span className="text-[13px] text-outline">/ {hardware.ramTotalGB} GB</span></span>
            <span className="font-mono text-[11px] text-tertiary">
              {Math.round((hardware.ramUsedGB / hardware.ramTotalGB) * 100)}%
            </span>
          </div>
          <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
            <div className="bg-tertiary h-full" style={{ width: `${(hardware.ramUsedGB / hardware.ramTotalGB) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-surface-container-low p-4 rounded border border-outline-variant/20 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-outline uppercase tracking-wider">Thermal Throttling</span>
            <Flame className="w-4 h-4 text-secondary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-2xl text-on-surface">{hardware.thm0Temp}°C</span>
            <span className="font-mono text-[11px] text-secondary font-medium uppercase">{hardware.thm0Status}</span>
          </div>
          <div className="font-mono text-[11px] text-outline">Trip delta: 45°C limit (6.8°C headroom)</div>
        </div>

        <div className="bg-surface-container-low p-4 rounded border border-outline-variant/20 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-outline uppercase tracking-wider">Wakelock State</span>
            <Lock className="w-4 h-4 text-secondary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-2xl text-secondary">HELD</span>
            <span className="font-mono text-[11px] text-outline">termux-wake-lock</span>
          </div>
          <div className="font-mono text-[11px] text-outline">Android Doze mode bypassed</div>
        </div>
      </div>

      {/* Main Core Breakdown & Battery details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 8 cols: SoC CPU Clusters */}
        <div className="lg:col-span-8 bg-surface-container rounded-lg p-5 border border-outline-variant/20 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[15px] text-on-surface">
                Samsung Exynos 850 (big.LITTLE Architecture)
              </h3>
              <p className="text-[12px] text-on-surface-variant mt-0.5">
                8x ARM Cortex-A55 cores partitioned under Termux proot CPU affinity context
              </p>
            </div>
            <span className="px-2 py-0.5 font-mono text-[10px] text-secondary bg-secondary/10 border border-secondary/20 rounded uppercase font-semibold">
              NOMINAL (LEVEL 0)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Efficiency Cluster */}
            <div className="bg-surface-container-lowest p-4 rounded border border-outline-variant/20 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-primary font-medium">Core 0-3 (Efficiency Cluster)</span>
                <span className="font-mono text-[11px] text-secondary">{hardware.efficiencyCoresTemp}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-outline text-[12px]">Clock Governor: schedutil</span>
                <span className="font-mono text-[13px] text-on-surface font-semibold">{hardware.efficiencyCoresFreq}</span>
              </div>
              <div className="space-y-1.5 font-mono text-[10px] text-outline pt-1 border-t border-outline-variant/15">
                <div className="flex justify-between"><span>cpu0: 1200 MHz</span><span className="text-secondary">active</span></div>
                <div className="flex justify-between"><span>cpu1: 1200 MHz</span><span className="text-secondary">active</span></div>
                <div className="flex justify-between"><span>cpu2: 1200 MHz</span><span className="text-secondary">active</span></div>
                <div className="flex justify-between"><span>cpu3: 1200 MHz</span><span className="text-secondary">active</span></div>
              </div>
            </div>

            {/* Performance Cluster */}
            <div className="bg-surface-container-lowest p-4 rounded border border-outline-variant/20 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-primary font-medium">Core 4-7 (Performance Cluster)</span>
                <span className="font-mono text-[11px] text-tertiary">{hardware.performanceCoresTemp}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-outline text-[12px]">Clock Governor: schedutil</span>
                <span className="font-mono text-[13px] text-on-surface font-semibold">{hardware.performanceCoresFreq}</span>
              </div>
              <div className="space-y-1.5 font-mono text-[10px] text-outline pt-1 border-t border-outline-variant/15">
                <div className="flex justify-between"><span>cpu4: 2000 MHz</span><span className="text-secondary">active</span></div>
                <div className="flex justify-between"><span>cpu5: 2000 MHz</span><span className="text-secondary">active</span></div>
                <div className="flex justify-between"><span>cpu6: 1800 MHz</span><span className="text-secondary">active</span></div>
                <div className="flex justify-between"><span>cpu7: 1800 MHz</span><span className="text-secondary">active</span></div>
              </div>
            </div>
          </div>

          {/* Linux Sysfs details */}
          <div className="bg-surface-container-lowest p-3 rounded font-mono text-[11px] text-on-surface-variant flex flex-col gap-1.5 border border-outline-variant/15">
            <span className="text-outline uppercase text-[10px]">Sysfs Thermal Zone Mapping</span>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div>/sys/class/thermal/thermal_zone0: <span className="text-on-surface font-medium">38.2°C (SoC)</span></div>
              <div>/sys/class/thermal/thermal_zone1: <span className="text-on-surface font-medium">34.2°C (GPU)</span></div>
              <div>/sys/class/thermal/thermal_zone2: <span className="text-secondary font-medium">31.4°C (Battery)</span></div>
            </div>
          </div>
        </div>

        {/* Right 4 cols: Battery, Power & Storage */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* Battery and Power Supply */}
          <div className="bg-surface-container rounded-lg p-4 border border-outline-variant/20 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[14px] text-on-surface">Battery & Power Subsystem</span>
              <BatteryCharging className="w-4 h-4 text-secondary" />
            </div>

            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-outline">State:</span>
                <span className="text-secondary font-medium">AC Powered (Bypass Mode)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Sensor Temp:</span>
                <span className="text-on-surface">{hardware.batteryTemp}°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Charge Level:</span>
                <span className="text-on-surface">{hardware.batteryPercent}% (Protect Battery limit)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Health:</span>
                <span className="text-secondary">GOOD (97% design cap)</span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-surface-container-lowest text-[11px] text-on-surface-variant flex items-center gap-2 border border-outline-variant/20">
              <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
              <span>Direct USB-PD power bypass active. Zero battery thermal degradation.</span>
            </div>
          </div>

          {/* Storage and Mounts */}
          <div className="bg-surface-container rounded-lg p-4 border border-outline-variant/20 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[14px] text-on-surface">Disk Partitions (UFS 2.1)</span>
              <HardDrive className="w-4 h-4 text-primary" />
            </div>

            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-outline">/data/data/com.termux:</span>
                <span className="text-on-surface">4.8 GB used</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">/sdcard (Internal Storage):</span>
                <span className="text-on-surface">39.4 GB used</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Free Space:</span>
                <span className="text-secondary font-medium">83.8 GB available</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onDumpLogs}
              className="w-full mt-1 py-2 px-3 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-mono text-[11px] text-center transition-colors flex items-center justify-center gap-2 border border-outline-variant/30"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-primary" />
              <span>Dump Hardware Telemetry Logs</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
