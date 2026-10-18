import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, XCircle, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../api';

export default function ProcessManager() {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProcesses = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/processes');
      const json = await res.json();
      setProcesses(json.list || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleKillProcess = async (pid, name) => {
    try {
      const res = await apiFetch('/api/processes/kill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid }),
      });
      const data = await res.json();
      if (data.success) {
        fetchProcesses();
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
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Process RAM Hogs & CPU Manager</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Activity Monitor Pro view: Terminate memory-leaking or frozen background processes to free trapped RAM.
          </p>
        </div>

        <button
          onClick={fetchProcesses}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Processes</span>
        </button>
      </div>

      {loading && processes.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-cyan-400" />
          Reading active system process table...
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-3.5 px-5 bg-white/[0.03] flex items-center justify-between text-xs font-semibold text-slate-400 border-b border-white/5">
            <span>Process Name & PID</span>
            <div className="flex items-center gap-8">
              <span>CPU %</span>
              <span>Memory (RAM)</span>
              <span>Action</span>
            </div>
          </div>

          <div className="divide-y divide-white/5 bg-slate-950/30 text-xs">
            {processes.map((proc) => (
              <div key={proc.pid} className="p-3 px-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <span className="font-mono text-slate-500 text-[11px] w-12 flex-shrink-0">PID {proc.pid}</span>
                  <span className="font-bold text-white truncate max-w-xs">{proc.name}</span>
                </div>

                <div className="flex items-center gap-8 flex-shrink-0">
                  <span className={`font-mono font-semibold w-12 text-right ${proc.cpu > 20 ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                    {proc.cpu}%
                  </span>

                  <span className="font-mono font-bold text-cyan-400 w-20 text-right">
                    {proc.memRss}
                  </span>

                  <button
                    onClick={() => handleKillProcess(proc.pid, proc.name)}
                    className="p-1.5 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>End Task</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
