import React, { useState, useEffect } from 'react';
import { Globe, Trash2, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { apiFetch } from '../api';

export default function AppUninstaller({ onClean, onOpenFinder }) {
  const [orphans, setOrphans] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrphans = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/scan');
      const json = await res.json();
      const cat = json.categories?.find(c => c.name === 'App Leftovers');
      setOrphans(cat?.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrphans();
  }, []);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            <span>App Leftovers Assistant</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Detect Application Support data left behind by uninstalled or deleted applications.
          </p>
        </div>

        <button
          onClick={fetchOrphans}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Rescan Leftovers</span>
        </button>
      </div>

      {loading ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-cyan-400" />
          Checking Application Support for orphaned data...
        </div>
      ) : orphans.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 text-sm">
          No orphaned application support folders found.
        </div>
      ) : (
        <div className="space-y-3">
          {orphans.map((item) => (
            <div key={item.id} className="glass-panel rounded-2xl p-4 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                  <span className="text-xs text-slate-400 font-mono block truncate" title={item.path}>
                    {item.path}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                  {item.formattedSize}
                </span>

                <button
                  onClick={() => onOpenFinder(item.path)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onClean([item.path])}
                  className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
