import React, { useState, useEffect } from 'react';
import { Code, Trash2, RefreshCw, Folder, CheckCircle, Terminal, ExternalLink } from 'lucide-react';
import { apiFetch } from '../api';

export default function DeveloperCleaner({ onClean, onOpenFinder }) {
  const [devItems, setDevItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDevItems = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/scan');
      const json = await res.json();
      const devCategory = json.categories?.find(c => c.name === 'Developer Junk');
      setDevItems(devCategory?.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevItems();
  }, []);

  const totalDevBytes = devItems.reduce((acc, curr) => acc + curr.size, 0);

  function formatBytes(b) {
    if (b === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  const handleCleanAllDev = () => {
    const paths = devItems.map(i => i.path);
    if (paths.length > 0) {
      onClean(paths);
      setDevItems([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Code className="w-5 h-5 text-indigo-400" />
            <span>Developer Storage Reclaim</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Safely purge Xcode build caches, simulators, cargo crates, and python environments to free up gigabytes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDevItems}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Rescan</span>
          </button>

          {devItems.length > 0 && (
            <button
              onClick={handleCleanAllDev}
              className="glass-button-success px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clean All Dev Junk ({formatBytes(totalDevBytes)})</span>
            </button>
          )}
        </div>
      </div>

      {/* Developer Targets Grid */}
      {loading ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-indigo-400" />
          Scanning developer directories...
        </div>
      ) : devItems.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-300 text-sm space-y-2">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
          <h4 className="text-lg font-bold text-white">Your Developer Workspace is Lean</h4>
          <p className="text-xs text-slate-400">No leftover Xcode DerivedData or Cargo build caches found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {devItems.map((item) => (
            <div key={item.id} className="glass-panel-interactive rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{item.name}</h3>
                    <span className="text-[11px] text-slate-400 font-mono block truncate max-w-xs" title={item.path}>
                      {item.path}
                    </span>
                  </div>
                </div>

                <span className="text-xs font-bold font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                  {item.formattedSize}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <button
                  onClick={() => onOpenFinder(item.path)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Reveal in Finder</span>
                </button>

                <button
                  onClick={() => onClean([item.path])}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purge</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
