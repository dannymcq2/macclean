import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CleanResults from './components/CleanResults';
import LargeFiles from './components/LargeFiles';
import DeveloperCleaner from './components/DeveloperCleaner';
import AppUninstaller from './components/AppUninstaller';
import DuplicateFinder from './components/DuplicateFinder';
import StartupManager from './components/StartupManager';
import BatteryHealth from './components/BatteryHealth';
import PhotosCleaner from './components/PhotosCleaner';
import StorageTreemap from './components/StorageTreemap';
import ProcessManager from './components/ProcessManager';
import PrivacySanitizer from './components/PrivacySanitizer';
import WipeLockScreen from './components/WipeLockScreen';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { apiFetch } from './api';
import { sounds } from './utils/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [status, setStatus] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [cleaning, setCleaning] = useState(false);
  const [purgingMemory, setPurgingMemory] = useState(false);
  const [wipeLockOpen, setWipeLockOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchStatus = async () => {
    try {
      const res = await apiFetch('/api/system/status');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error('Failed to fetch system status:', e);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleStartScan = async () => {
    setScanning(true);
    try {
      const res = await apiFetch('/api/scan');
      const data = await res.json();
      setScanResults(data);
      setActiveTab('scan');
      sounds.playCleanComplete();
      showToast(`Scan complete: Discovered ${data.formattedTotalScanBytes} cleanable files.`, 'success');
    } catch (e) {
      showToast('Scan failed: Could not scan system directories.', 'error');
    } finally {
      setScanning(false);
    }
  };

  const handleClean = async (paths) => {
    if (!paths || paths.length === 0) return;
    setCleaning(true);
    try {
      const res = await apiFetch('/api/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths }),
      });
      const data = await res.json();
      if (data.success) {
        sounds.playCleanComplete();
        showToast(`Successfully reclaimed ${data.formattedReclaimedBytes} of storage space!`, 'success');
        fetchStatus();
        if (scanResults) {
          const cleanedSet = new Set(data.cleanedPaths);
          const updatedRaw = scanResults.rawItems.filter(i => !cleanedSet.has(i.path));
          const newTotalBytes = updatedRaw.reduce((acc, curr) => acc + curr.size, 0);

          setScanResults({
            ...scanResults,
            rawItems: updatedRaw,
            totalScanBytes: newTotalBytes,
            formattedTotalScanBytes: data.formattedReclaimedBytes,
          });
        }
      }
    } catch (e) {
      showToast('Clean operation failed.', 'error');
    } finally {
      setCleaning(false);
    }
  };

  const handlePurgeMemory = async () => {
    setPurgingMemory(true);
    try {
      const res = await apiFetch('/api/purge-memory', { method: 'POST' });
      const data = await res.json();
      sounds.playPurgeMemory();
      showToast(data.message || 'System memory purged.', 'success');
      fetchStatus();
    } catch (e) {
      showToast('Memory purge failed.', 'error');
    } finally {
      setPurgingMemory(false);
    }
  };

  const handleOpenFinder = async (path) => {
    try {
      await apiFetch('/api/open-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-mac-dark text-white font-sans antialiased">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenWipeLock={() => setWipeLockOpen(true)}
        onPurgeMemory={handlePurgeMemory}
        purgingMemory={purgingMemory}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            status={status}
            onStartScan={handleStartScan}
            scanning={scanning}
            scanResults={scanResults}
            onPurgeMemory={handlePurgeMemory}
            purgingMemory={purgingMemory}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'scan' && (
          <CleanResults
            scanResults={scanResults}
            onClean={handleClean}
            onOpenFinder={handleOpenFinder}
            cleaning={cleaning}
          />
        )}

        {activeTab === 'photos' && (
          <PhotosCleaner
            onClean={handleClean}
            onOpenFinder={handleOpenFinder}
          />
        )}

        {activeTab === 'treemap' && (
          <StorageTreemap
            onOpenFinder={handleOpenFinder}
          />
        )}

        {activeTab === 'processes' && (
          <ProcessManager />
        )}

        {activeTab === 'duplicates' && (
          <DuplicateFinder
            onClean={handleClean}
            onOpenFinder={handleOpenFinder}
          />
        )}

        {activeTab === 'large-files' && (
          <LargeFiles
            onClean={handleClean}
            onOpenFinder={handleOpenFinder}
          />
        )}

        {activeTab === 'developer' && (
          <DeveloperCleaner
            onClean={handleClean}
            onOpenFinder={handleOpenFinder}
          />
        )}

        {activeTab === 'startup' && (
          <StartupManager
            onOpenFinder={handleOpenFinder}
          />
        )}

        {activeTab === 'battery' && (
          <BatteryHealth />
        )}

        {activeTab === 'privacy' && (
          <PrivacySanitizer />
        )}

        {activeTab === 'app-leftovers' && (
          <AppUninstaller
            onClean={handleClean}
            onOpenFinder={handleOpenFinder}
          />
        )}
      </main>

      {/* Hardware Wipe & Lock Mode Screen Overlay */}
      {wipeLockOpen && (
        <WipeLockScreen onClose={() => setWipeLockOpen(false)} />
      )}

      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-slide-in">
          <div className={`glass-panel rounded-2xl p-4 border shadow-2xl flex items-center gap-3 ${
            toast.type === 'error' 
              ? 'border-rose-500/30 text-rose-300 bg-rose-950/40' 
              : 'border-emerald-500/30 text-emerald-300 bg-emerald-950/40'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
            <span className="text-xs font-semibold">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
