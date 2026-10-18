import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Sparkles, Lock, Unlock, Keyboard, Monitor } from 'lucide-react';

export default function WipeLockScreen({ onClose }) {
  const [holdingEsc, setHoldingEsc] = useState(false);
  const [progress, setProgress] = useState(0);
  const holdIntervalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent normal keys from typing or doing actions
      if (e.key !== 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      } else {
        if (!holdingEsc) {
          setHoldingEsc(true);
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Escape') {
        setHoldingEsc(false);
        setProgress(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [holdingEsc]);

  useEffect(() => {
    if (holdingEsc) {
      const startTime = Date.now();
      holdIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const p = Math.min(100, (elapsed / 2500) * 100);
        setProgress(p);
        if (p >= 100) {
          clearInterval(holdIntervalRef.current);
          onClose();
        }
      }, 30);
    } else {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
      }
      setProgress(0);
    }

    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, [holdingEsc, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center text-white select-none overflow-hidden animate-fade-in">
      {/* Background Animated Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl glow-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl glow-pulse pointer-events-none" />

      {/* Main Lock Container */}
      <div className="relative z-10 max-w-lg w-full mx-auto px-6 py-10 text-center glass-panel rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center">
        {/* Animated Icon Badge */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/10">
          <Lock className="w-10 h-10 text-cyan-400 animate-pulse" />
        </div>

        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-2">
          Hardware Cleaning Lock Mode
        </h2>
        <p className="text-slate-400 text-sm max-w-md mb-8 leading-relaxed">
          Keyboard & trackpad input is temporarily disabled. You can now physically wipe your screen, keys, and trackpad safely without accidentally typing or clicking.
        </p>

        {/* Instructions Grid */}
        <div className="grid grid-cols-2 gap-4 w-full mb-8">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
            <Keyboard className="w-6 h-6 text-cyan-400 mb-2" />
            <span className="text-xs font-semibold text-slate-200">Keys Locked</span>
            <span className="text-[11px] text-slate-400 mt-1">Safe to wipe keyboard</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
            <Monitor className="w-6 h-6 text-indigo-400 mb-2" />
            <span className="text-xs font-semibold text-slate-200">Screen Lock</span>
            <span className="text-[11px] text-slate-400 mt-1">Wipe screen distortion-free</span>
          </div>
        </div>

        {/* Hold to Unlock Indicator */}
        <div className="relative flex flex-col items-center justify-center w-full mt-2">
          {/* Radial Circular Progress around ESC */}
          <div className="relative w-32 h-32 flex items-center justify-center mb-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                className="text-white/10"
                strokeWidth="6"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                className="text-cyan-400 transition-all duration-75"
                strokeWidth="6"
                strokeDasharray={351.8}
                strokeDashoffset={351.8 - (351.8 * progress) / 100}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-sm font-mono font-bold text-cyan-300 shadow">
                ESC
              </span>
              <span className="text-[10px] text-slate-400 mt-1 font-medium">Hold 2.5s</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 font-medium">
            {holdingEsc ? (
              <span className="text-cyan-400 animate-pulse font-semibold">Unlocking... Keep holding ESC!</span>
            ) : (
              'Press and hold the ESC key to exit cleaning mode'
            )}
          </p>

          <button
            onClick={onClose}
            className="mt-6 text-xs text-slate-500 hover:text-slate-300 underline transition-colors"
          >
            Emergency Exit (Click here)
          </button>
        </div>
      </div>
    </div>
  );
}
