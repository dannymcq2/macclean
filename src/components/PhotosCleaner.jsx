import React, { useState, useEffect, useMemo } from 'react';
import { 
  Camera, 
  Smartphone, 
  Image, 
  Trash2, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle, 
  Lock, 
  Play, 
  Film, 
  Filter, 
  X, 
  Grid, 
  List as ListIcon,
  Maximize2
} from 'lucide-react';
import { apiFetch, API_BASE } from '../api';

export default function PhotosCleaner({ onClean, onOpenFinder }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState(new Set());
  const [activeFilter, setActiveFilter] = useState('all'); // all, video, image, screenshot, large
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid, list

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/photos-cleaner');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleOpenPrivacySettings = async () => {
    try {
      await apiFetch('/api/open-privacy-settings', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  };

  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((item) => {
      if (activeFilter === 'video' && !item.isVideo) return false;
      if (activeFilter === 'image' && !item.isImage) return false;
      if (activeFilter === 'screenshot' && item.category !== 'Screenshot Clutter') return false;
      if (activeFilter === 'large' && item.size < 50 * 1024 * 1024) return false;
      return true;
    });
  }, [data, activeFilter]);

  const toggleSelect = (path) => {
    const next = new Set(selectedPaths);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setSelectedPaths(next);
  };

  const selectAllVideos = () => {
    const next = new Set(selectedPaths);
    filteredItems.forEach(i => {
      if (i.isVideo) next.add(i.path);
    });
    setSelectedPaths(next);
  };

  const deselectAll = () => {
    setSelectedPaths(new Set());
  };

  const handleCleanSelected = () => {
    const paths = Array.from(selectedPaths);
    if (paths.length > 0) {
      onClean(paths);
      setSelectedPaths(new Set());
      fetchPhotos();
    }
  };

  const selectedStats = useMemo(() => {
    if (!data?.items) return { count: 0, formatted: '0 B' };
    const itemsMap = new Map(data.items.map(i => [i.path, i]));
    let bytes = 0;
    let count = 0;
    for (const p of selectedPaths) {
      const item = itemsMap.get(p);
      if (item) {
        bytes += item.size;
        count += 1;
      }
    }
    
    function format(b) {
      if (b === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(b) / Math.log(k));
      return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    return { count, formatted: format(bytes) };
  }, [selectedPaths, data]);

  return (
    <div className="space-y-6 pb-24">
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Camera className="w-5 h-5 text-pink-400" />
            <span>Interactive Photos & Video Gallery Cleaner</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visually preview photos and play videos inline to easily choose what to keep or delete.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPhotos}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-pink-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Scan Media Gallery</span>
          </button>
        </div>
      </div>

      {/* Privacy Access Banner */}
      {data?.requiresFullDiskAccess && (
        <div className="glass-panel rounded-2xl p-5 border border-amber-500/30 bg-amber-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-200">macOS Privacy Protection Active</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Grant <strong>Full Disk Access</strong> in System Settings to allow MacClean Studio to scan deep inside Photos Library & iPhone Backups.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenPrivacySettings}
            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-semibold text-xs transition-all cursor-pointer whitespace-nowrap"
          >
            Open macOS Privacy Settings
          </button>
        </div>
      )}

      {/* Toolbar: Filters & View Switcher */}
      <div className="glass-panel rounded-2xl p-4 border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-pink-400" /> Filter Media:
          </span>
          
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeFilter === 'all' 
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' 
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            All Media
          </button>

          <button
            onClick={() => setActiveFilter('video')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeFilter === 'video' 
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' 
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Videos Only
          </button>

          <button
            onClick={() => setActiveFilter('image')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeFilter === 'image' 
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' 
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Photos Only
          </button>

          <button
            onClick={() => setActiveFilter('large')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeFilter === 'large' 
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' 
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Heavy Media (&gt; 50MB)
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-400'}`}
              title="Gallery Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-400'}`}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={selectAllVideos}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 cursor-pointer"
          >
            Select All Videos
          </button>
          {selectedPaths.size > 0 && (
            <button
              onClick={deselectAll}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-400 cursor-pointer"
            >
              Deselect All
            </button>
          )}
        </div>
      </div>

      {/* Main Gallery Display */}
      {loading ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-pink-400" />
          Loading visual gallery thumbnails and video previews...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-300 text-sm space-y-2">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
          <h4 className="text-lg font-bold text-white">No Media Matched Filter</h4>
          <p className="text-xs text-slate-400">Try switching filters or scanning other directories.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID GALLERY VIEW */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredItems.map((item) => {
            const isSelected = selectedPaths.has(item.path);
            const mediaUrl = `${API_BASE}/api/media-preview?path=${encodeURIComponent(item.path)}`;

            return (
              <div
                key={item.id}
                className={`group relative glass-panel-interactive rounded-2xl overflow-hidden border flex flex-col justify-between transition-all ${
                  isSelected ? 'border-pink-500 ring-2 ring-pink-500/40 bg-pink-500/10' : 'border-white/10'
                }`}
              >
                {/* Media Preview Box */}
                <div 
                  onClick={() => setActiveModalItem(item)}
                  className="relative aspect-square bg-slate-950/60 overflow-hidden cursor-pointer flex items-center justify-center group-hover:brightness-110"
                >
                  {item.isVideo ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/80 p-2 text-center">
                      <Film className="w-10 h-10 text-pink-400 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-mono text-pink-300 font-bold px-2 py-0.5 rounded bg-pink-500/20">
                        {item.extension} VIDEO
                      </span>
                    </div>
                  ) : item.isImage ? (
                    <img
                      src={mediaUrl}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Image className="w-10 h-10 text-slate-500" />
                  )}

                  {/* Play Overlay for Videos */}
                  {item.isVideo && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-pink-500/80 border border-white/40 flex items-center justify-center text-white shadow-lg">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Expand Icon */}
                  <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Card Controls Footer */}
                <div className="p-3 bg-white/[0.02] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(item.path)}
                      className="rounded border-white/20 bg-white/5 text-pink-500 focus:ring-pink-500 cursor-pointer flex-shrink-0"
                    />
                    <span className="font-semibold text-slate-200 truncate text-[11px]" title={item.name}>
                      {item.name}
                    </span>
                  </div>

                  <span className="font-mono text-[10px] font-bold text-pink-400 flex-shrink-0">
                    {item.formattedSize}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/5">
          {filteredItems.map((item) => {
            const isSelected = selectedPaths.has(item.path);

            return (
              <div key={item.id} className="p-3.5 px-5 flex items-center justify-between text-xs hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3.5 min-w-0 pr-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(item.path)}
                    className="rounded border-white/20 bg-white/5 text-pink-500 focus:ring-pink-500 cursor-pointer"
                  />

                  <div 
                    onClick={() => setActiveModalItem(item)}
                    className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center cursor-pointer flex-shrink-0"
                  >
                    {item.isVideo ? <Film className="w-5 h-5" /> : <Image className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <span 
                      onClick={() => setActiveModalItem(item)}
                      className="font-bold text-white block truncate hover:text-pink-300 cursor-pointer"
                    >
                      {item.name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono block truncate" title={item.path}>
                      {item.path}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="font-mono text-xs font-bold text-pink-400">
                    {item.formattedSize}
                  </span>

                  <button
                    onClick={() => onOpenFinder(item.path)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action Bar */}
      {selectedPaths.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[90%] glass-panel rounded-2xl p-4 border border-pink-500/30 shadow-2xl flex items-center justify-between backdrop-blur-xl">
          <div>
            <span className="text-xs text-slate-400 block">Selected Media to Delete</span>
            <span className="text-sm font-extrabold text-white">
              {selectedStats.count} items <span className="text-pink-400 font-mono">({selectedStats.formatted})</span>
            </span>
          </div>

          <button
            onClick={handleCleanSelected}
            className="glass-button-success px-5 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-pink-500/20"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Selected Media</span>
          </button>
        </div>
      )}

      {/* Interactive Photo/Video Lightbox Modal */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] glass-panel rounded-3xl p-6 border border-white/10 flex flex-col items-center justify-between shadow-2xl space-y-4 overflow-hidden">
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-white/10">
              <div className="min-w-0 pr-4">
                <h3 className="text-base font-bold text-white truncate">{activeModalItem.name}</h3>
                <span className="text-xs font-mono text-pink-400">{activeModalItem.formattedSize}</span>
              </div>

              <button
                onClick={() => setActiveModalItem(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Viewer Body */}
            <div className="w-full flex-1 max-h-[65vh] flex items-center justify-center overflow-hidden bg-slate-950/80 rounded-2xl p-2">
              {activeModalItem.isVideo ? (
                <video
                  src={`${API_BASE}/api/media-preview?path=${encodeURIComponent(activeModalItem.path)}`}
                  controls
                  autoPlay
                  className="max-h-[60vh] max-w-full rounded-xl"
                />
              ) : (
                <img
                  src={`${API_BASE}/api/media-preview?path=${encodeURIComponent(activeModalItem.path)}`}
                  alt={activeModalItem.name}
                  className="max-h-[60vh] max-w-full object-contain rounded-xl"
                />
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="w-full flex items-center justify-between pt-3 border-t border-white/10">
              <button
                onClick={() => onOpenFinder(activeModalItem.path)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 flex items-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Show in Finder</span>
              </button>

              <button
                onClick={() => {
                  onClean([activeModalItem.path]);
                  setActiveModalItem(null);
                  fetchPhotos();
                }}
                className="px-5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete This File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
