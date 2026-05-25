// src/components/dashboard/SharedBadge.jsx
import React from 'react';
import { Share2 } from 'lucide-react';

/**
 * SharedBadge component
 * Displays a premium micro badge indicating that the file is shared publicly.
 * Includes a hover tooltip for a state-of-the-art interactive UX.
 */
const SharedBadge = ({ className = '' }) => {
  return (
    <span 
      className={`inline-flex items-center justify-center p-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100/60 shadow-sm transition-all hover:scale-110 active:scale-95 group relative ${className}`}
      title="Shared publicly via link"
    >
      <Share2 size={11} strokeWidth={2.5} />
      
      {/* Sleek Tooltip */}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-900/95 backdrop-blur-[2px] text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-50 border border-slate-700/30">
        Shared publicly
      </span>
    </span>
  );
};

export default SharedBadge;
