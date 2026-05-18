import React from 'react';
import { Info } from 'lucide-react';

const DashboardMainContent = () => {
  return (
    <div className="flex-1 bg-white flex flex-col h-[calc(100vh-65px)] overflow-hidden rounded-tl-2xl border-t border-l border-slate-200 mt-2 ml-2">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-normal text-slate-800">Welcome to Drive</h1>
        <button className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
          <Info size={20} />
        </button>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center px-4 overflow-y-auto">
        <div className="max-w-md w-full flex flex-col items-center text-center">
          
          <div className="relative w-64 h-64 mb-8">
            <svg viewBox="0 0 200 200" className="w-full h-full" fill="none">
              <path 
                d="M40 55 L100 55 L115 85 L160 85 L160 145 L40 145 Z" 
                fill="#eff6ff" 
                stroke="#60a5fa" 
                strokeWidth="6" 
                strokeLinejoin="round" 
              />
            </svg>
          </div>
          
          <p className="text-sm font-medium text-slate-600 mb-2">
            Drag your files and folders here or use the 'New' button to upload
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardMainContent;
