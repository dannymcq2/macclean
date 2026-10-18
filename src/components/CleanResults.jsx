import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  Folder, 
  FileText, 
  ExternalLink, 
  ChevronDown, 
  ChevronRight, 
  Search,
  Filter,
  AlertTriangle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function CleanResults({ 
  scanResults, 
  onClean, 
  onOpenFinder, 
  cleaning 
}) {
  const [selectedPaths, setSelectedPaths] = useState(() => {
    if (!scanResults?.rawItems) return new Set();
    // Default select all items
    return new Set(scanResults.rawItems.map(item => item.path));
  });

  const [expandedCategories, setExpandedCategories] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Filter raw items based on search query
  const filteredCategories = useMemo(() => {
    if (!scanResults?.categories) return [];
    if (!searchQuery.trim()) return scanResults.categories;

    const query = searchQuery.toLowerCase();
    return scanResults.categories.map(cat => {
      const matchingItems = cat.items.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.path.toLowerCase().includes(query)
      );
      return {
        ...cat,
        items: matchingItems,
        itemCount: matchingItems.length,
        totalBytes: matchingItems.reduce((sum, i) => sum + i.size, 0)
      };
    }).filter(cat => cat.items.length > 0);
  }, [scanResults, searchQuery]);

  // Compute selected stats
  const selectedStats = useMemo(() => {
    if (!scanResults?.rawItems) return { count: 0, bytes: 0, formatted: '0 B' };
    let bytes = 0;
    let count = 0;
    for (const item of scanResults.rawItems) {
      if (selectedPaths.has(item.path)) {
        bytes += item.size;
        count += 1;
      }
    }
    
    // Format bytes
    function format(b) {
      if (b === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(b) / Math.log(k));
      return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    return { count, bytes, formatted: format(bytes) };
  }, [selectedPaths, scanResults]);

  const toggleSelectAll = () => {
    if (!scanResults?.rawItems) return;
    if (selectedPaths.size === scanResults.rawItems.length) {
      setSelectedPaths(new Set());
    } else {
      setSelectedPaths(new Set(scanResults.rawItems.map(item => item.path)));
    }
  };

  const toggleCategorySelect = (categoryItems) => {
    const next = new Set(selectedPaths);
    const allCatSelected = categoryItems.every(i => next.has(i.path));

    if (allCatSelected) {
      categoryItems.forEach(i => next.delete(i.path));
    } else {
      categoryItems.forEach(i => next.add(i.path));
    }
    setSelectedPaths(next);
  };

  const toggleItemSelect = (path) => {
    const next = new Set(selectedPaths);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    setSelectedPaths(next);
  };

  const toggleCategoryExpand = (catName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  const handleExecuteClean = () => {
    const pathsToClean = Array.from(selectedPaths);
    onClean(pathsToClean);
    setShowConfirmModal(false);
  };

  if (!scanResults || !scanResults.categories || scanResults.categories.length === 0) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center max-w-xl mx-auto border border-white/10 my-8">
        <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Scan Results Yet</h3>
        <p className="text-slate-400 text-sm mb-6">
          Click "Run Smart Scan" on the Dashboard to analyze system caches, developer build files, browser junk, and leftovers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header & Search Control */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Scan Results</span>
            <span className="text-xs bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-semibold px-2.5 py-0.5 rounded-full">
              {scanResults.formattedTotalScanBytes} Found
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review discovered items before cleaning. Deselect any files you wish to keep.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by path or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 w-60"
            />
          </div>

          <button
            onClick={toggleSelectAll}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-all cursor-pointer"
          >
            {selectedPaths.size === scanResults.rawItems.length ? (
              <>
                <CheckSquare className="w-4 h-4 text-cyan-400" />
                <span>Deselect All</span>
              </>
            ) : (
              <>
                <Square className="w-4 h-4 text-slate-400" />
                <span>Select All</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Category List Accordion */}
      <div className="space-y-4">
        {filteredCategories.map((cat) => {
          const isExpanded = expandedCategories[cat.name] ?? true; // default expanded
          const allCatSelected = cat.items.every(i => selectedPaths.has(i.path));
          const someCatSelected = cat.items.some(i => selectedPaths.has(i.path)) && !allCatSelected;

          return (
            <div key={cat.name} className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
              {/* Category Header Bar */}
              <div className="p-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleCategorySelect(cat.items)}
                    className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                  >
                    {allCatSelected ? (
                      <CheckSquare className="w-5 h-5 text-cyan-400" />
                    ) : someCatSelected ? (
                      <div className="w-5 h-5 rounded bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-400 text-xs font-bold">
                        -
                      </div>
                    ) : (
                      <Square className="w-5 h-5 text-slate-500" />
                    )}
                  </button>

                  <button
                    onClick={() => toggleCategoryExpand(cat.name)}
                    className="flex items-center gap-2 text-left font-bold text-white text-sm hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                    <span>{cat.name}</span>
                    <span className="text-xs text-slate-400 font-normal">({cat.itemCount} items)</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    {cat.formattedTotalBytes}
                  </span>
                </div>
              </div>

              {/* Items List */}
              {isExpanded && (
                <div className="divide-y divide-white/5 bg-slate-950/40">
                  {cat.items.map((item) => {
                    const isSelected = selectedPaths.has(item.path);

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 px-5 flex items-center justify-between text-xs transition-colors ${
                          isSelected ? 'bg-indigo-500/[0.04]' : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-4">
                          <button
                            onClick={() => toggleItemSelect(item.path)}
                            className="text-slate-400 hover:text-cyan-400 transition-colors flex-shrink-0 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-cyan-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <span className="font-semibold text-slate-200 block truncate">
                              {item.name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono block truncate" title={item.path}>
                              {item.path}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="font-mono text-xs font-semibold text-slate-300">
                            {item.formattedSize}
                          </span>

                          <button
                            onClick={() => onOpenFinder(item.path)}
                            title="Reveal in macOS Finder"
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
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[90%] glass-panel rounded-2xl p-4 border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 flex items-center justify-between backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Selected for Removal</span>
            <span className="text-sm font-extrabold text-white">
              {selectedStats.count} items <span className="text-cyan-400 font-mono">({selectedStats.formatted})</span>
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowConfirmModal(true)}
          disabled={selectedStats.count === 0 || cleaning}
          className="glass-button-success px-6 py-3 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clean Selected Items</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 max-w-md w-full border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Confirm Removal</h3>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to remove <strong className="text-white">{selectedStats.count} items</strong> freeing approximately <strong className="text-cyan-400 font-mono">{selectedStats.formatted}</strong> of disk space.
            </p>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 leading-normal">
              System caches and logs will be safely recreated by macOS when required. Selected files in Trash and Downloads will be removed.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteClean}
                className="glass-button-success px-5 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
              >
                Confirm & Clean Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
