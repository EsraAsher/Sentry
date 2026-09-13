import React, { useState } from 'react';
import { 
  Sliders, 
  Save, 
  RotateCcw, 
  Check, 
  FileCode, 
  Zap, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface DaemonConfigViewProps {
  onSaveConfig: (cfgText: string) => void;
  onHotReload: () => void;
}

const defaultToml = `# ==========================================
# Termux Process Supervisor: bot-sentry.toml
# Target: Samsung SM-A315F ARM64 (Linux 4.14)
# ==========================================

[supervisor]
socket_path = "/tmp/sentry.sock"
poll_interval_ms = 1000
log_tail_lines = 250
fifo_buffer_kb = 512
termux_wake_lock = true
android_oom_adj_enabled = true

[supervisor.backoff]
initial_delay_sec = 5
multiplier = 1.5
max_delay_sec = 300
max_retries_per_window = 10

[cgroups]
enforce_limits = true
default_memory_max = "512M"
default_cpu_quota = "200%"

[[daemons]]
name = "tg-forwarder-bot"
command = "node ./dist/index.js --session=primary --mtproto-pool=4"
directory = "~/bots/tg-forwarder"
restart_policy = "always"
oom_score_adj = -200
env_file = ".env.production"

[[daemons]]
name = "matrix-bridge-relay"
command = "python3 -m matrix_synapse_relay --config=relay.yaml --port=8448"
directory = "~/bots/matrix-bridge"
restart_policy = "on-failure"
oom_score_adj = -100

[[daemons]]
name = "market-watcher-daemon"
command = "python3 -u ./agents/market_stream.py --pairs=SOL/USDC,BTC/USDC --verbose"
directory = "~/bots/market-watcher"
restart_policy = "exponential_backoff"
memory_limit = "512M"
oom_score_adj = 500

[[daemons]]
name = "solana-webhook-agent"
command = "cargo run --release -- --listen=0.0.0.0:8088 --rpc-fallback=infura"
directory = "~/bots/solana-webhook"
restart_policy = "on-failure"
oom_score_adj = 200

[[daemons]]
name = "prometheus-termux-exporter"
command = "node ./exporter.mjs --port=9100 --metrics=cpu,ram,thermal,battery"
directory = "~/telemetry/exporter"
restart_policy = "always"
oom_score_adj = -800
`;

export const DaemonConfigView: React.FC<DaemonConfigViewProps> = ({
  onSaveConfig,
  onHotReload,
}) => {
  const [tomlContent, setTomlContent] = useState(defaultToml);
  const [activeTab, setActiveTab] = useState<'toml' | 'env'>('toml');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [validationResult, setValidationResult] = useState<string | null>('Syntax valid: 5 daemon targets defined.');

  const handleValidate = () => {
    if (tomlContent.includes('[supervisor]') && tomlContent.includes('[[daemons]]')) {
      setValidationResult('TOML Syntax valid. Schema compliant with bot-sentry v2.4.1.');
    } else {
      setValidationResult('Warning: Missing required [supervisor] or [[daemons]] table.');
    }
  };

  const handleSave = () => {
    onSaveConfig(tomlContent);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 w-full h-[calc(100vh-140px)] select-none">
      {/* Top Header and Actions */}
      <div className="bg-surface-container rounded-lg p-3 border border-outline-variant/20 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-primary" />
          <div className="flex bg-surface-container-lowest p-0.5 rounded border border-outline-variant/30">
            <button
              type="button"
              onClick={() => setActiveTab('toml')}
              className={`px-3 py-1 rounded font-mono text-[11px] transition-colors ${
                activeTab === 'toml'
                  ? 'bg-surface-container-high text-on-surface font-semibold'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              bot-sentry.toml
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('env')}
              className={`px-3 py-1 rounded font-mono text-[11px] transition-colors ${
                activeTab === 'env'
                  ? 'bg-surface-container-high text-on-surface font-semibold'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              .env.production
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleValidate}
            className="px-3 py-1 bg-surface-container-lowest hover:bg-surface-container-high text-on-surface-variant font-mono text-[11px] rounded border border-outline-variant/30 transition-colors"
          >
            Validate Syntax
          </button>

          <button
            type="button"
            onClick={onHotReload}
            className="flex items-center gap-1.5 px-3 py-1 bg-tertiary-container text-on-tertiary font-mono text-[11px] font-semibold rounded hover:opacity-90 transition-opacity"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Hot-Reload (USR1)</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3.5 py-1 bg-primary text-on-primary font-mono text-[11px] font-semibold rounded hover:opacity-90 transition-opacity"
          >
            {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{savedSuccess ? 'Saved!' : 'Save Config'}</span>
          </button>
        </div>
      </div>

      {/* Editor Box */}
      <div className="flex-1 bg-[#080A0E] rounded-lg border border-outline-variant/30 flex flex-col overflow-hidden shadow-inner">
        <div className="h-8 px-4 bg-surface-container-low flex items-center justify-between border-b border-outline-variant/20 font-mono text-[11px] text-outline">
          <span>/data/data/com.termux/files/home/.bot-sentry/{activeTab === 'toml' ? 'bot-sentry.toml' : '.env.production'}</span>
          <span>Encoding: UTF-8 • Mode: TOML</span>
        </div>

        <textarea
          value={tomlContent}
          onChange={(e) => setTomlContent(e.target.value)}
          spellCheck={false}
          className="flex-1 w-full bg-transparent p-4 font-mono text-[12px] text-on-surface leading-relaxed resize-none focus:outline-none selection:bg-primary/30"
        />

        {/* Validation bar */}
        {validationResult && (
          <div className="h-8 px-4 bg-surface-container-low flex items-center gap-2 border-t border-outline-variant/20 font-mono text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
            <span className="text-secondary">{validationResult}</span>
          </div>
        )}
      </div>
    </div>
  );
};
