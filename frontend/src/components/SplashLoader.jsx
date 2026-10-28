import React from 'react';

export default function SplashLoader({ statusText = "Initializing Asterline Workspace..." }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 transition-opacity duration-500">
      
      {/* Embedded keyframe styles for out-of-the-box support without modifying tailwind.config.js */}
      <style>{`
        @keyframes meet-pulse {
          0% {
            transform: scale(0.92);
            opacity: 0.25;
          }
          50% {
            transform: scale(1.35);
            opacity: 0.75;
          }
          100% {
            transform: scale(0.92);
            opacity: 0.25;
          }
        }
        @keyframes meet-pulse-delayed {
          0% {
            transform: scale(1);
            opacity: 0.15;
          }
          50% {
            transform: scale(1.6);
            opacity: 0.45;
          }
          100% {
            transform: scale(1);
            opacity: 0.15;
          }
        }
        .animate-meet-pulse {
          animation: meet-pulse 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-meet-pulse-delayed {
          animation: meet-pulse-delayed 2.2s cubic-bezier(0.4, 0, 0.6, 1) 0.4s infinite;
        }
      `}</style>

      {/* Center Animated Container */}
      <div className="relative flex items-center justify-center w-48 h-48">
        
        {/* Outer Pulsing Ring (Cyan Accent matching your logo waveform) */}
        <div className="absolute inset-0 rounded-full border-2 border-cyan-400/40 bg-cyan-500/10 animate-meet-pulse-delayed pointer-events-none" />

        {/* Inner Pulsing Ring (Navy Blue matching logo frame) */}
        <div className="absolute inset-3 rounded-full border-2 border-sky-400/60 bg-sky-500/10 animate-meet-pulse pointer-events-none" />

        {/* Core Logo Wrapper */}
        <div className="relative z-10 w-28 h-28 rounded-full bg-white shadow-2xl shadow-cyan-500/20 flex items-center justify-center p-3 border border-slate-200">
          <img 
            src="/logo.png" 
            alt="Asterline Logo" 
            className="w-full h-full object-contain" 
          />
        </div>
      </div>

      {/* Loading Status Text */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
          <span className="text-xs font-mono font-medium tracking-wide text-slate-400">
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
}