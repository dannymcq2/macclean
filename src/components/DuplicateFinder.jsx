import React, { useState, useEffect } from 'react';
import { Copy, Trash2, RefreshCw, ExternalLink, CheckCircle, FileText, AlertCircle } from 'lucide-react';
import { apiFetch } from '../api';

export default function DuplicateFinder({ onClean, onOpenFinder }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState(new Set());

  const fetchDuplicates = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/duplicates');
      const json = await res.json();
      setData(json);

      // Auto select duplicates (keep first item as original, select rest)
      const toSelect = new Set();
      if (json.groups) {
        for (const group of json.groups) {
          // keep index 0, select 1..N
          for (let i = 1; i < group.files.length; i++) {
            toSelect.add(group.files[i].path);
          }
        }
      }
      setSelectedPaths(toSelect);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const toggleSelect = (path) => {
    const next = new Set(selectedPaths);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setSelectedPaths(next);
  };

  const handleCleanSelected = () => {
    const paths = Array.from(selectedPaths);
    if (paths.length > 0) {
      onClean(paths);
      setSelectedPaths(new Set());
      fetchDuplicates();
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Copy className="w-5 h-5 text-purple-400" />
            <span>Duplicate File Finder</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Detect identical photos, videos, archives, and documents taking up double space on your drive.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDuplicates}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Scan Duplicates</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-purple-400" />
          Comparing file sizes and hashing duplicate contents...
        </div>
      ) : !data || data.groups.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-300 text-sm space-y-2">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
          <h4 className="text-lg font-bold text-white">No Duplicate Files Found</h4>
          <p className="text-xs text-slate-400">Your Downloads, Documents, and Pictures folders are clean of duplicate files.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 text-xs font-semibold text-slate-400">
            <span>Found {data.count} Duplicate Groups</span>
            <span>Total Wasted Space: <strong className="text-purple-400 font-mono">{data.formattedTotalWasted}</strong></span>
          </div>

          {data.groups.map((group, groupIdx) => (
            <div key={group.hash} className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
              {/* Group Header */}
              <div className="p-3.5 px-5 bg-white/[0.03] border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-mono">
                    #{groupIdx + 1}
                  </span>
                  <span>{group.files[0].name}</span>
                  <span className="text-slate-400 font-normal">({group.files.length} copies)</span>
                </div>

                <span className="text-xs font-mono font-bold text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                  {group.formattedWasteBytes} Wasted
                </span>
              </div>

              {/* Duplicate Copies List */}
              <div className="divide-y divide-white/5 bg-slate-950/30 text-xs">
                {group.files.map((file, idx) => {
                  const isSelected = selectedPaths.has(file.path);
                  const isOriginal = idx === 0;

                  return (
                    <div key={file.path} className="p-3 px-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3 min-w-0 pr-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(file.path)}
                          className="rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500 cursor-pointer"
                        />

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200 truncate">{file.name}</span>
                            {isOriginal ? (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                Original (Keep)
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                                Duplicate Copy
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono block truncate" title={file.path}>
                            {file.path}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-mono text-slate-400">{file.formattedSize}</span>
                        <button
                          onClick={() => onOpenFinder(file.path)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Floating Action Button */}
          {selectedPaths.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[90%] glass-panel rounded-2xl p-4 border border-purple-500/30 shadow-2xl flex items-center justify-between backdrop-blur-xl">
              <span className="text-xs font-bold text-white">
                Selected {selectedPaths.size} duplicates for removal
              </span>

              <button
                onClick={handleCleanSelected}
                className="glass-button-success px-5 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove Duplicates</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
