import React from 'react';
import { Search, Settings, HelpCircle, Grid, Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DashboardHeader = () => {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-white">
      <div className="flex items-center w-64">
        <button className="p-2 mr-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
          <Menu size={24} />
        </button>
        <div className="flex items-center cursor-pointer">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white mr-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
            </svg>
          </div>
          <span className="text-xl font-medium text-slate-700">Drive</span>
        </div>
      </div>

      <div className="flex-1 max-w-2xl px-4">
        <div className="relative flex items-center w-full h-12 rounded-full bg-slate-100 hover:bg-white hover:shadow-md transition-all focus-within:bg-white focus-within:shadow-md border border-transparent focus-within:border-slate-200">
          <button className="p-2 ml-2 rounded-full text-slate-600 hover:bg-slate-200">
            <Search size={20} />
          </button>
          <input
            type="text"
            placeholder="Search in Drive"
            className="flex-1 px-2 bg-transparent outline-none text-slate-700 placeholder-slate-500"
          />
          <button className="p-2 mr-2 rounded-full text-slate-600 hover:bg-slate-200">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M7 12h10" />
              <path d="M10 18h4" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end w-auto pr-2 space-x-1">
        <button className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors tooltip" title="Support">
          <HelpCircle size={22} />
        </button>
        <button className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors tooltip" title="Settings">
          <Settings size={22} />
        </button>
        <div className="w-4" /> 
        <button className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors tooltip" title="Apps">
          <Grid size={22} />
        </button>
        
        {user ? (
          <div className="ml-2 pl-2 border-l border-slate-200 flex items-center bg-slate-50 rounded-full py-1 pr-3 pl-3 transition-colors border border-slate-200 gap-3">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-800">{user.name}</span>
              <span className="text-xs text-slate-500">{user.email}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <button onClick={logout} className="ml-2 p-1.5 rounded-full hover:bg-red-100 text-slate-500 hover:text-red-600 transition-colors" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
};

export default DashboardHeader;
