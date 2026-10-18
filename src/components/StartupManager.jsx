import React, { useState, useEffect } from 'react';
import { Rocket, RefreshCw, Power, ShieldAlert, CheckCircle2, ExternalLink } from 'lucide-react';
import { apiFetch } from '../api';

export default function StartupManager({ onOpenFinder }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStartupItems = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/startup-items');
      const json = await res.json();
      setItems(json.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStartupItems();
  }, []);

  const handleToggle = async (item) => {
    try {
      const res = await fetch('/api/startup-items/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: item.path, enable: !item.enabled }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStartupItems();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Rocket className="w-5 h-5 text-emerald-400" />
            <span>Startup Apps & LaunchAgents Manager</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Disable unwanted background launch agents slowing down your Mac's startup time and CPU.
          </p>
        </div>

        <button
          onClick={fetchStartupItems}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Rescan Startup Items</span>
        </button>
      </div>

      {loading ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-emerald-400" />
          Scanning LaunchAgents and background services...
        </div>
      ) : items.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 text-sm">
          No third-party launch agents detected in user directories.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="glass-panel rounded-2xl p-4 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3.5 min-w-0 pr-4">
                <div className={`p-2.5 rounded-xl border ${
                  item.enabled 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-slate-800 border-white/5 text-slate-500'
                }`}>
                  <Power className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                    <span className="text-[10px] font-semibold text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                      {item.scope}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono block truncate" title={item.path}>
                    {item.path}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => onOpenFinder(item.path)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleToggle(item)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    item.enabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                      : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
                  }`}
                >
                  {item.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
