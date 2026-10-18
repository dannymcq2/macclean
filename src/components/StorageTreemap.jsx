import React, { useState, useEffect } from 'react';
import { PieChart, Folder, ExternalLink, RefreshCw } from 'lucide-react';
import { apiFetch } from '../api';

export default function StorageTreemap({ onOpenFinder }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTreemap = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/treemap');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreemap();
  }, []);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-400" />
            <span>Interactive Storage Treemap (DaisyDisk Explorer)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visual breakdown of storage allocation across main Mac directories.
          </p>
        </div>

        <button
          onClick={fetchTreemap}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Rescan Proportions</span>
        </button>
      </div>

      {loading || !data ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-indigo-400" />
          Calculating storage treemap proportions...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Proportion Bar */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span className="font-semibold">Storage Proportion Map</span>
              <span className="font-mono text-indigo-400 font-bold">{data.formattedTotalBytes} Analyzed</span>
            </div>

            <div className="w-full h-4 rounded-xl overflow-hidden flex bg-slate-800">
              {data.tree.map((item) => {
                const pct = Math.max(2, Math.round((item.size / data.totalBytes) * 100));
                return (
                  <div
                    key={item.name}
                    style={{ width: `${pct}%`, backgroundColor: item.color }}
                    className="h-full transition-all duration-500 hover:brightness-125"
                    title={`${item.name}: ${item.formattedSize} (${pct}%)`}
                  />
                );
              })}
            </div>
          </div>

          {/* Folder Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.tree.map((item) => {
              const pct = Math.round((item.size / data.totalBytes) * 100);

              return (
                <div key={item.name} className="glass-panel-interactive rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg"
                        style={{ backgroundColor: `${item.color}25`, border: `1px solid ${item.color}50` }}
                      >
                        <Folder className="w-5 h-5" style={{ color: item.color }} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{item.name}</h4>
                        <span className="text-[11px] text-slate-400 font-mono block truncate max-w-xs">
                          {item.path}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: `${item.color}30`, border: `1px solid ${item.color}50` }}>
                      {item.formattedSize} ({pct}%)
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <span className="text-xs text-slate-400">{item.fileCount} files</span>
                    <button
                      onClick={() => onOpenFinder(item.path)}
                      className="text-xs text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Inspect in Finder</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
