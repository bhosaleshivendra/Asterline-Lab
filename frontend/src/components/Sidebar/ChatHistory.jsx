import React, { useState } from 'react';

export default function ChatHistory({ history, selectedHistoryItem, onSelectHistoryItem }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mt-4 border-t border-slate-200/80 pt-4 flex flex-col">
      {/* Inline styles for guaranteed scrollbar visibility across all browsers */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
      `}</style>

      {/* Accordion Toggle Header */}
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-1 mb-2 text-left group cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <svg 
            className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 group-hover:text-slate-800 transition-colors">
            Past Conversations
          </h3>
        </div>

        <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
          {history.length}
        </span>
      </button>

      {/* Collapsible & Scrollable List with Bounded Height */}
      {isOpen && (
        <div className="custom-scrollbar overflow-y-auto max-h-[280px] pr-2 pt-1 space-y-1.5">
          {history.length === 0 ? (
            <p className="text-xs text-slate-400 italic px-1 py-2">No past questions found.</p>
          ) : (
            history.map((item) => {
              const isSelected = selectedHistoryItem?._id === item._id;
              return (
                <button
                  key={item._id}
                  onClick={() => onSelectHistoryItem(item)}
                  className={`w-full text-left p-2.5 rounded-md border text-xs transition-all flex flex-col gap-1.5 cursor-pointer ${
                    isSelected 
                      ? "bg-slate-100 border-slate-300 text-slate-900 font-medium shadow-2xs" 
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <div className="line-clamp-2 leading-snug">{item.question}</div>
                  <div className="text-[10px] font-mono text-slate-400 self-end">
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}