import React from 'react';
import { 
  HardDrive, 
  Cpu, 
  Zap, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  Trash2, 
  Code, 
  Globe, 
  Sparkles,
  Server,
  Layers,
  Clock
} from 'lucide-react';

export default function Dashboard({ 
  status, 
  onStartScan, 
  scanning, 
  scanResults, 
  onPurgeMemory, 
  purgingMemory,
  onNavigateTab 
}) {
  const memory = status?.memory || { usedPercentage: 0, formattedUsed: '0 GB', formattedTotal: '0 GB', formattedFree: '0 GB' };
  const storage = status?.storage || { usePercent: 0, formattedUsed: '0 GB', formattedTotal: '0 GB', formattedFree: '0 GB', cleanableEstimate: '0 GB' };
  const cpu = status?.cpu || { load: 0, user: 0, system: 0 };
  const os = status?.os || { platform: 'macOS', release: '14.0', arch: 'arm64', hostname: 'MacBook', uptime: '0h' };

  return (
    <div className="space-y-6">
      {/* Top Banner Card: Quick Scan & System Status */}
      <div className="relative overflow-hidden glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Welcome & Action */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>macOS System Health Engine</span>
            </div>
            
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Keep your Mac fast, lean, and clean.
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
              Scan system caches, developer build artifacts, browser junk, and uninstalled app leftovers to instantly reclaim gigabytes of storage space.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onStartScan}
                disabled={scanning}
                className="glass-button-success px-6 py-3.5 rounded-2xl text-white font-semibold text-sm flex items-center gap-3 shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {scanning ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                    <span>Scanning System Files...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current text-emerald-400" />
                    <span>Run Smart Scan</span>
                  </>
                )}
              </button>

              <button
                onClick={onPurgeMemory}
                disabled={purgingMemory}
                className="px-5 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm flex items-center gap-2.5 transition-all transform hover:scale-[1.02] cursor-pointer"
              >
                <Zap className={`w-4 h-4 text-amber-400 ${purgingMemory ? 'animate-bounce' : ''}`} />
                <span>{purgingMemory ? 'Purging RAM...' : 'Purge Memory'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Disk Gauge Visualizer */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 glass-panel rounded-2xl border border-white/5 bg-white/[0.02]">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r="74"
                  className="text-slate-800"
                  strokeWidth="12"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="88"
                  cy="88"
                  r="74"
                  className="text-cyan-500 transition-all duration-1000 ease-out"
                  strokeWidth="12"
                  strokeDasharray={465}
                  strokeDashoffset={465 - (465 * storage.usePercent) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-white tracking-tight">{storage.usePercent}%</span>
                <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">Disk Used</span>
              </div>
            </div>

            <div className="w-full mt-4 grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-white/5">
                <span className="text-slate-400 block text-[10px]">Cleanable Space</span>
                <span className="text-emerald-400 font-bold text-sm">{storage.cleanableEstimate}</span>
              </div>
              <div className="p-2 rounded-xl bg-white/5">
                <span className="text-slate-400 block text-[10px]">Free Space</span>
                <span className="text-cyan-400 font-bold text-sm">{storage.formattedFree}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Section: Live Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* RAM Telemetry */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">System RAM</h3>
                <p className="text-xs text-slate-400">{memory.formattedUsed} / {memory.formattedTotal}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
              {memory.usedPercentage}%
            </span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-4">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${memory.usedPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
            <span>Free RAM: <strong className="text-slate-200">{memory.formattedFree}</strong></span>
            <span>Purge Ready</span>
          </div>
        </div>

        {/* CPU Telemetry */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">CPU Load</h3>
                <p className="text-xs text-slate-400">User: {cpu.user}% | Sys: {cpu.system}%</p>
              </div>
            </div>
            <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
              {cpu.load}%
            </span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-4">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${cpu.load}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
            <span>Uptime: <strong className="text-slate-200">{os.uptime}</strong></span>
            <span>Arch: <strong className="text-slate-200">{os.arch}</strong></span>
          </div>
        </div>

        {/* Machine Telemetry */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Device Info</h3>
                <p className="text-xs text-slate-400">{os.hostname}</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Active
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Platform:</span>
              <span className="font-mono font-medium text-slate-200">{os.distro || os.platform}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Release:</span>
              <span className="font-mono font-medium text-slate-200">{os.release}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5 mt-3">
            <span>Protection Status</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Optimal
            </span>
          </div>
        </div>
      </div>

      {/* Category Shortcut Cards */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Cleaning Modules</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            onClick={() => onNavigateTab('scan')}
            className="glass-panel-interactive rounded-2xl p-5 cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                <Trash2 className="w-5 h-5" />
              </div>
              <span className="text-xs text-purple-300 font-semibold bg-purple-500/10 px-2 py-0.5 rounded-md">Smart Clean</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">System Caches</h4>
              <p className="text-xs text-slate-400">Scan user logs, app caches, & trash</p>
            </div>
          </div>

          <div 
            onClick={() => onNavigateTab('developer')}
            className="glass-panel-interactive rounded-2xl p-5 cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                <Code className="w-5 h-5" />
              </div>
              <span className="text-xs text-indigo-300 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-md">Dev Reclaim</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Developer Toolkit</h4>
              <p className="text-xs text-slate-400">Xcode DerivedData, node_modules, build caches</p>
            </div>
          </div>

          <div 
            onClick={() => onNavigateTab('large-files')}
            className="glass-panel-interactive rounded-2xl p-5 cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                <HardDrive className="w-5 h-5" />
              </div>
              <span className="text-xs text-amber-300 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-md">&gt; 50 MB</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Large Files</h4>
              <p className="text-xs text-slate-400">Discover & purge old gigabyte files</p>
            </div>
          </div>

          <div 
            onClick={() => onNavigateTab('app-leftovers')}
            className="glass-panel-interactive rounded-2xl p-5 cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                <Globe className="w-5 h-5" />
              </div>
              <span className="text-xs text-cyan-300 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded-md">Orphans</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">App Leftovers</h4>
              <p className="text-xs text-slate-400">Clean remaining data of deleted apps</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
