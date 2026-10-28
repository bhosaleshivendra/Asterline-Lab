import React, { useState, useEffect } from 'react';

/**
 * Parses bracketed text like [alerts:1] or [User Context] into styled citation badges
 */
function parseCitations(text) {
  if (typeof text !== 'string') return null;

  const parts = text.split(/(\[[^\]]+\])/g);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('[') && part.endsWith(']')) {
      const citationContent = part.slice(1, -1);
      const isContext = citationContent.toLowerCase().includes('context');
      
      return (
        <span
          key={index}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 mx-1 rounded text-[11px] font-mono font-medium border transition-colors cursor-default ${
            isContext
              ? 'bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100'
              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/70'
          }`}
          title={`Source: ${citationContent}`}
        >
          <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {citationContent}
        </span>
      );
    }

    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((boldPart, bIdx) => {
      if (!boldPart) return null;
      if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
        return (
          <strong key={`${index}-${bIdx}`} className="font-semibold text-slate-900">
            {boldPart.slice(2, -2)}
          </strong>
        );
      }
      return boldPart;
    });
  });
}

export default function GroundedAnswer({ text, speed = 20 }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!text) {
      setDisplayedText("");
      return;
    }

    // 1. Strip trailing literal ".undefined" or "undefined" from backend payload
    const cleanText = String(text).replace(/\.?undefined$/gi, '').trim();

    // 2. Tokenize text preserving spaces
    const tokens = cleanText.split(/(\s+)/);
    let currentIndex = 0;
    setDisplayedText("");

    const intervalId = setInterval(() => {
      if (currentIndex < tokens.length) {
        const token = tokens[currentIndex];
        // 3. Guard against undefined token values during concatenation
        if (token !== undefined) {
          setDisplayedText((prev) => prev + token);
        }
        currentIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [text, speed]);

  if (!displayedText) return null;

  const lines = displayedText.split('\n');

  return (
    <div className="space-y-2.5 font-sans text-sm text-slate-700 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const content = trimmed.substring(2);
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
              <div className="flex-1">{parseCitations(content)}</div>
            </div>
          );
        }

        return (
          <p key={idx} className="leading-normal">
            {parseCitations(line)}
          </p>
        );
      })}
    </div>
  );
}