import React from 'react';
import { 
  Sparkles, 
  LayoutDashboard, 
  Trash2, 
  HardDrive, 
  Code, 
  Globe, 
  Lock, 
  Copy,
  Rocket,
  Battery,
  Camera,
  PieChart,
  Activity,
  ShieldCheck
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  onSelectTab, 
  onOpenWipeLock
}) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scan', label: 'Smart Clean', icon: Trash2 },
    { id: 'photos', label: 'Photos & iOS', icon: Camera },
    { id: 'treemap', label: 'Treemap', icon: PieChart },
    { id: 'processes', label: 'Process Hogs', icon: Activity },
    { id: 'duplicates', label: 'Duplicates', icon: Copy },
    { id: 'large-files', label: 'Large Files', icon: HardDrive },
    { id: 'developer', label: 'Dev Tools', icon: Code },
    { id: 'startup', label: 'Startup Apps', icon: Rocket },
    { id: 'battery', label: 'Battery Doctor', icon: Battery },
    { id: 'privacy', label: 'Privacy & DNS', icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-white/10 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div className="hidden sm:block">
            <span className="font-extrabold text-base tracking-tight text-white block leading-none">
              MacClean <span className="text-cyan-400">Studio</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
              macOS System Cleaner
            </span>
          </div>
        </div>

        {/* Tab Navigation Buttons */}
        <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 overflow-x-auto max-w-2xl no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-white border border-cyan-500/30 shadow-md shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Hardware Wipe Lock Mode Button */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={onOpenWipeLock}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-500/10"
            title="Lock screen & keyboard to physically wipe keys and display"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Screen & Keyboard Lock</span>
          </button>
        </div>
      </div>
    </header>
  );
}
