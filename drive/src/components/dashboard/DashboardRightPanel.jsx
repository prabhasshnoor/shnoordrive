import React from 'react';
import { Calendar, CheckSquare, Contact, Plus } from 'lucide-react';

const DashboardRightPanel = () => {
  return (
    <div className="w-[56px] flex flex-col items-center bg-white border-l border-slate-100 py-4 h-[calc(100vh-65px)] overflow-y-auto">
      <div className="flex flex-col space-y-6 items-center">
        <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-blue-600 tooltip" title="Calendar">
          <Calendar size={22} strokeWidth={1.5} />
        </button>
        
        <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-yellow-500 tooltip" title="Keep">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18h6" />
            <path d="M10 22h4" />
            <path d="M12 2v1" />
            <path d="M12 7a5 5 0 1 0 0 10v1" />
          </svg>
        </button>
        
        <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-blue-500 tooltip" title="Tasks">
          <CheckSquare size={22} strokeWidth={1.5} />
        </button>
        
        <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-blue-700 tooltip" title="Contacts">
          <Contact size={22} strokeWidth={1.5} />
        </button>
        
        <div className="w-6 border-t border-slate-200 my-2"></div>
        
        <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-600 tooltip" title="Get Add-ons">
          <Plus size={22} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};

export default DashboardRightPanel;
