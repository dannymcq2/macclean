import React, { useState, useEffect, useMemo } from 'react';
import { HardDrive, ExternalLink, Trash2, Filter, RefreshCw, File, Clock } from 'lucide-react';
import { apiFetch } from '../api';

export default function LargeFiles({ onClean, onOpenFinder }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sizeFilter, setSizeFilter] = useState('all'); // all, 100mb, 500mb
  const [ageFilter, setAgeFilter] = useState('all'); // all, 30d, 90d, 365d

  const fetchLargeFiles = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/large-files');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLargeFiles();
  }, []);

  const filteredFiles = useMemo(() => {
    if (!data?.files) return [];
    return data.files.filter(f => {
      // Size Filter
      if (sizeFilter === '100mb' && f.size < 100 * 1024 * 1024) return false;
      if (sizeFilter === '500mb' && f.size < 500 * 1024 * 1024) return false;

      // Age Filter
      if (ageFilter === '30d' && f.ageDays < 30) return false;
      if (ageFilter === '90d' && f.ageDays < 90) return false;
      if (ageFilter === '365d' && f.ageDays < 365) return false;

      return true;
    });
  }, [data, sizeFilter, ageFilter]);

  const filteredTotalSize = useMemo(() => {
    const bytes = filteredFiles.reduce((acc, curr) => acc + curr.size, 0);
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, [filteredFiles]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-amber-400" />
            <span>Large & Old Files Explorer</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Discover heavy archives, installers, and legacy video files taking up precious disk space.
          </p>
        </div>

        <button
          onClick={fetchLargeFiles}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Scanning...' : 'Rescan Large Files'}</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel rounded-2xl p-4 border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-cyan-400" /> Size Filter:
          </span>
          <button
            onClick={() => setSizeFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              sizeFilter === 'all' 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            All &gt; 50 MB
          </button>
          <button
            onClick={() => setSizeFilter('100mb')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              sizeFilter === '100mb' 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            &gt; 100 MB
          </button>
          <button
            onClick={() => setSizeFilter('500mb')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              sizeFilter === '500mb' 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            &gt; 500 MB
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium mr-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-indigo-400" /> Age Filter:
          </span>
          <button
            onClick={() => setAgeFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              ageFilter === 'all' 
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Any Age
          </button>
          <button
            onClick={() => setAgeFilter('30d')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              ageFilter === '30d' 
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            &gt; 30 Days Old
          </button>
          <button
            onClick={() => setAgeFilter('365d')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              ageFilter === '365d' 
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            &gt; 1 Year Old
          </button>
        </div>
      </div>

      {/* Files List */}
      {loading ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-amber-400" />
          Scanning disk for large files...
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 text-sm">
          No large files matched your filter criteria.
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/5">
          <div className="p-3.5 px-5 bg-white/[0.02] flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Found {filteredFiles.length} files</span>
            <span>Total: <strong className="text-amber-400 font-mono">{filteredTotalSize}</strong></span>
          </div>

          {filteredFiles.map((file) => (
            <div key={file.id} className="p-4 px-5 flex items-center justify-between text-xs hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3.5 min-w-0 pr-4">
                {/* File Extension Badge */}
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                  {file.extension.slice(0, 4)}
                </div>

                <div className="min-w-0">
                  <span className="font-semibold text-slate-100 block truncate text-sm">
                    {file.name}
                  </span>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                    <span className="font-mono text-slate-500 truncate" title={file.path}>
                      {file.path}
                    </span>
                    <span className="text-indigo-400 flex-shrink-0 font-medium">
                      • {file.ageCategory}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="font-mono text-sm font-bold text-amber-400">
                  {file.formattedSize}
                </span>

                <button
                  onClick={() => onOpenFinder(file.path)}
                  title="Reveal in macOS Finder"
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onClean([file.path])}
                  title="Delete File"
                  className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer border border-rose-500/20"
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
