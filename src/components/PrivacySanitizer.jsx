import React, { useState } from 'react';
import { ShieldCheck, RefreshCw, Zap, CheckCircle2, Globe } from 'lucide-react';
import { apiFetch } from '../api';

export default function PrivacySanitizer() {
  const [flushingDNS, setFlushingDNS] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const handleFlushDNS = async () => {
    setFlushingDNS(true);
    try {
      const res = await apiFetch('/api/flush-dns', { method: 'POST' });
      const data = await res.json();
      setStatusMessage(data.message || 'macOS DNS Cache flushed!');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e) {
      setStatusMessage('DNS Flush failed.');
    } finally {
      setFlushingDNS(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Privacy Sanitizer & System Network Flush</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Flush system DNS resolver caches and clean tracking data across browsers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DNS Resolver Flusher */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">macOS DNS Resolver Cache</h3>
              <p className="text-xs text-slate-400">Flush stale domain name mappings (`dscacheutil -flushcache`)</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Fixes web browsing connection errors, stale domain redirects, and clears cached network entries.
          </p>

          <button
            onClick={handleFlushDNS}
            disabled={flushingDNS}
            className="glass-button-success px-5 py-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${flushingDNS ? 'animate-spin' : ''}`} />
            <span>{flushingDNS ? 'Flushing DNS...' : 'Flush macOS DNS Cache Now'}</span>
          </button>
        </div>

        {/* Status Toast Notification */}
        {statusMessage && (
          <div className="glass-panel rounded-2xl p-6 border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <span className="text-xs font-bold">{statusMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
