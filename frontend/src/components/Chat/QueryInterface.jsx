import React, { useState } from 'react';
import GroundedAnswer from './GroundedAnswer';

export default function QueryInterface({ 
  question, 
  setQuestion, 
  answer, 
  loading, 
  selectedHistoryItem, 
  onSubmit,
  onNewQuery
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!answer) return;
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="flex-1 min-w-0 flex flex-col gap-4 bg-slate-50/50 p-6 rounded-xl border border-slate-200/80 overflow-y-auto">
      
      {/* 1. Header & Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Workspace Query Canvas
        </div>

        <button
          onClick={onNewQuery}
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 hover:border-slate-300 transition-colors shadow-xs"
        >
          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Query
        </button>
      </div>

      {selectedHistoryItem && (
        <div className="text-xs font-medium text-amber-700 bg-amber-50 px-3.5 py-2 rounded-md border border-amber-200/70 flex items-center justify-between">
          <span>Viewing Archived Entry ({new Date(selectedHistoryItem.createdAt).toLocaleString()})</span>
          <button 
            onClick={onNewQuery}
            className="text-amber-900 underline hover:no-underline font-semibold text-xs"
          >
            Clear Archive
          </button>
        </div>
      )}

      {/* 2. TOP: Query Input Section */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <form onSubmit={onSubmit}>
          <div className="p-3">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Query Input
            </label>
            <textarea
              rows={3}
              placeholder="e.g., What is the uptime SLA for Enterprise, and how are service credits calculated?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e);
                }
              }}
              className="w-full p-2.5 bg-slate-50/50 border border-slate-200 rounded-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all resize-none"
            />
          </div>

          {/* Action Bar inside Query Card */}
          <div className="px-3 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              Press <kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">Enter ↵</kbd> to submit
            </span>

            <div className="flex items-center gap-2">
              {question && (
                <button
                  type="button"
                  onClick={() => setQuestion("")}
                  className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-md transition-colors"
                >
                  Clear
                </button>
              )}

              <button 
                type="submit" 
                disabled={loading || !question.trim()} 
                className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white disabled:text-slate-400 font-medium px-4 py-1.5 rounded-md text-xs transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <span>Execute Query</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 3. BOTTOM: Grounded Result Output Section */}
      <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-xs flex flex-col min-h-[300px] overflow-hidden">
        <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/70 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Grounded Result
          </span>

          {answer && (
            <button
              onClick={handleCopy}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              {copied ? "✓ Copied" : "Copy response"}
            </button>
          )}
        </div>

        <div className="p-5 flex-1 relative overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 space-y-3">
              <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
              <span className="text-xs font-medium">Scanning connected documents & retrieving grounded context...</span>
            </div>
          ) : answer ? (
            <GroundedAnswer text={answer} />
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs italic">
              Results and document chunk citations will appear here after executing a query above.
            </div>
          )}
        </div>
      </div>

    </main>
  );
}