import React from 'react';

export default function Header({ sidebarOpen, setSidebarOpen }) {
  return (
    <header className="border-b border-gray-200 pb-4 mb-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-3 py-1.5 rounded transition-colors text-sm"
          title={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
        >
          {sidebarOpen ? "◀ Hide Sidebar" : "▶ Open Sidebar"}
        </button>
        <h1 className="text-2xl font-bold text-slate-800">🤖 Asterline Labs Research Assistant</h1>
      </div>
    </header>
  );
}