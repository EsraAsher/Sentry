import React, { useState } from 'react';
import { AuthKeyItem } from '../types';
import { 
  Key, 
  X, 
  Shield, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  PlusCircle, 
  Lock, 
  RefreshCw 
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  keys?: AuthKeyItem[];
  authKeys?: AuthKeyItem[];
  onAddKey?: (key: AuthKeyItem) => void;
  onGenerateNewKey?: (identifier: string, scopes: string[]) => void;
  onRevokeKey: (id: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  keys = [],
  authKeys,
  onAddKey,
  onGenerateNewKey,
  onRevokeKey,
}) => {
  const activeKeys = authKeys || keys || [];
  const rootFullToken = 'bsk_live_9f8c2e71b8004e9a66d318e472a19b33';
  const rootMaskedToken = 'bsk_••••••••••••••••••••••••••••••••••••••';
  
  const [isMasked, setIsMasked] = useState(true);
  const [copied, setCopied] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [newExpiry, setNewExpiry] = useState('30d');
  const [permRead, setPermRead] = useState(true);
  const [permRestart, setPermRestart] = useState(true);
  const [permSecrets, setPermSecrets] = useState(false);
  const [permRoot, setPermRoot] = useState(false);
  const [rootToken, setRootToken] = useState(rootFullToken);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(rootToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim()) return;

    const scopes: string[] = [];
    if (permRead) scopes.push('read telemetry');
    if (permRestart) scopes.push('restart services');
    if (permSecrets) scopes.push('manage secrets');
    if (permRoot) scopes.push('root supervisor');

    const randomHex = Math.random().toString(36).substring(2, 10);
    const newKey: AuthKeyItem = {
      id: `key-${Date.now()}`,
      identifier: newTokenName.trim(),
      tokenMasked: 'bsk_••••••••••••••••••••••••••••••••••••••',
      tokenFull: `bsk_live_${randomHex}_${Date.now()}`,
      issued: 'Just now',
      activity: 'Active now',
      revoked: false,
      scopes,
    };

    if (onAddKey) {
      onAddKey(newKey);
    } else if (onGenerateNewKey) {
      onGenerateNewKey(newTokenName.trim(), scopes);
    }
    setNewTokenName('');
  };

  const handleRegenerateRoot = () => {
    const newHex = Math.random().toString(36).substring(2, 12);
    setRootToken(`bsk_live_${newHex}_root_${Date.now().toString().slice(-4)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c0e13]/80 backdrop-blur-xs select-none">
      <div
        className="w-full max-w-[540px] bg-[#12151C] shadow-2xl rounded border border-[#3D4454] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-surface-container border-b border-outline-variant/30 flex items-start justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-[15px] text-on-surface tracking-tight">
                Termux Supervisor Auth & API Keys
              </h2>
            </div>
            <p className="text-[12px] text-on-surface-variant mt-1 leading-snug">
              Manage bearer authentication tokens for bot-sentry REST & WebSocket API on port 8080
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-outline hover:text-on-surface p-1 rounded hover:bg-surface-container-high transition-colors -mr-1 -mt-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {/* 1. Root Operator Session Token */}
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold uppercase text-outline tracking-wider">
                Root Operator Session Token
              </span>
              <span className="font-mono text-[11px] text-secondary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                ACTIVE
              </span>
            </div>

            <div className="flex items-center justify-between bg-[#080A0E] px-3 py-2 rounded border border-outline-variant/30 gap-2">
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <Shield className="w-4 h-4 text-outline shrink-0" />
                <span className="font-mono text-[11px] text-on-surface font-medium truncate select-all tracking-tight">
                  {isMasked ? rootMaskedToken : rootToken}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMasked(!isMasked)}
                  className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
                  title="Toggle token visibility"
                >
                  {isMasked ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2 py-1 bg-surface-container hover:bg-surface-container-high text-on-surface font-mono text-[11px] rounded border border-outline-variant/40 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-secondary" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="font-mono text-[11px] text-outline flex items-center gap-2 flex-wrap">
              <span>Issued: 14 days ago</span>
              <span>•</span>
              <span className="text-tertiary">Expires: in 16 days</span>
              <span>•</span>
              <span className="text-on-surface-variant font-mono text-[11px]">
                Scopes: root, process:write, fs:read
              </span>
            </div>
          </section>

          {/* 2. Issue Secondary Scoped Token */}
          <section className="flex flex-col gap-3 p-3.5 bg-surface-container rounded border border-outline-variant/20">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[13px] text-on-surface">Issue Secondary Scoped Token</span>
              <span className="font-mono text-[11px] text-outline">API v2</span>
            </div>

            <form onSubmit={handleGenerate} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="font-mono text-[10px] font-semibold uppercase text-outline">
                    Token Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                    placeholder="e.g. prometheus-scraper or local-script"
                    className="w-full bg-[#080A0E] border border-outline-variant/50 rounded px-3 py-1.5 font-mono text-[11px] text-on-surface placeholder:text-outline/50 focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[10px] font-semibold uppercase text-outline">
                    Expiration
                  </label>
                  <select
                    value={newExpiry}
                    onChange={(e) => setNewExpiry(e.target.value)}
                    className="w-full bg-[#080A0E] border border-outline-variant/50 rounded px-2 py-1.5 font-mono text-[11px] text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="7d">7 days</option>
                    <option value="30d">30 days</option>
                    <option value="90d">90 days</option>
                    <option value="never">No expiry</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] font-semibold uppercase text-outline">
                  Grant Permissions
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 bg-[#080A0E] p-2 rounded border border-outline-variant/20 cursor-pointer select-none hover:border-outline-variant/50">
                    <input
                      type="checkbox"
                      checked={permRead}
                      onChange={(e) => setPermRead(e.target.checked)}
                      className="w-3.5 h-3.5 accent-primary cursor-pointer"
                    />
                    <span className="text-[12px] text-on-surface truncate">Read telemetry</span>
                  </label>

                  <label className="flex items-center gap-2 bg-[#080A0E] p-2 rounded border border-outline-variant/20 cursor-pointer select-none hover:border-outline-variant/50">
                    <input
                      type="checkbox"
                      checked={permRestart}
                      onChange={(e) => setPermRestart(e.target.checked)}
                      className="w-3.5 h-3.5 accent-primary cursor-pointer"
                    />
                    <span className="text-[12px] text-on-surface truncate">Restart services</span>
                  </label>

                  <label className="flex items-center gap-2 bg-[#080A0E] p-2 rounded border border-outline-variant/20 cursor-pointer select-none hover:border-outline-variant/50">
                    <input
                      type="checkbox"
                      checked={permSecrets}
                      onChange={(e) => setPermSecrets(e.target.checked)}
                      className="w-3.5 h-3.5 accent-primary cursor-pointer"
                    />
                    <span className="text-[12px] text-on-surface truncate">Manage secrets</span>
                  </label>

                  <label className="flex items-center gap-2 bg-[#080A0E] p-2 rounded border border-outline-variant/20 cursor-pointer select-none hover:border-outline-variant/50">
                    <input
                      type="checkbox"
                      checked={permRoot}
                      onChange={(e) => setPermRoot(e.target.checked)}
                      className="w-3.5 h-3.5 accent-primary cursor-pointer"
                    />
                    <span className="text-[12px] text-error font-medium truncate">Full supervisor root</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-3 py-1 bg-transparent hover:bg-primary/10 border border-primary text-primary hover:text-primary-fixed rounded text-[12px] font-semibold transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Generate Token</span>
                </button>
              </div>
            </form>
          </section>

          {/* 3. Registered Microservices & Agents Table */}
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold uppercase text-outline">
                Registered Microservices & Agents
              </span>
              <span className="font-mono text-[11px] text-outline">{activeKeys.filter((k) => !k.revoked).length} active keys</span>
            </div>

            <div className="border border-outline-variant/30 rounded overflow-hidden">
              <table className="w-full text-left font-mono text-[11px]">
                <thead className="bg-surface-container border-b border-outline-variant/30 text-outline">
                  <tr>
                    <th className="px-3 py-1.5 font-normal text-[10px] uppercase">Identifier</th>
                    <th className="px-3 py-1.5 font-normal text-[10px] uppercase">Issued</th>
                    <th className="px-3 py-1.5 font-normal text-[10px] uppercase">Activity</th>
                    <th className="px-3 py-1.5 font-normal text-right text-[10px] uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 bg-[#080A0E]">
                  {activeKeys.map((k) => (
                    <tr
                      key={k.id}
                      className={`transition-colors ${
                        k.revoked ? 'opacity-40' : 'hover:bg-surface-container/40'
                      }`}
                    >
                      <td className="px-3 py-2 text-on-surface font-medium truncate max-w-[160px]">
                        {k.identifier}
                      </td>
                      <td className="px-3 py-2 text-on-surface-variant">{k.issued}</td>
                      <td className="px-3 py-2 text-secondary">{k.activity}</td>
                      <td className="px-3 py-2 text-right">
                        {k.revoked ? (
                          <span className="text-outline text-[10px] uppercase">Revoked</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onRevokeKey(k.id)}
                            className="text-error hover:underline font-mono text-[11px]"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. Security Note Callout */}
          <aside className="flex items-start gap-2.5 p-2.5 bg-[#080A0E] rounded border border-outline-variant/30">
            <Lock className="w-4 h-4 text-tertiary shrink-0 mt-0.5" />
            <p className="text-[12px] text-outline leading-snug">
              Tokens are stored locally encrypted in{' '}
              <span className="text-on-surface font-mono text-[11px]">~/.bot-sentry/auth.db</span> via Android
              Keystore. Do not share over unencrypted HTTP.
            </p>
          </aside>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-surface-container border-t border-outline-variant/30 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleRegenerateRoot}
            className="flex items-center gap-1.5 px-3 py-1 rounded border border-tertiary/60 text-tertiary hover:bg-tertiary/10 text-[12px] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerate Root Key</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1 bg-surface-container-high hover:bg-surface-bright text-on-surface rounded text-[12px] border border-outline-variant/40 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
