import React from 'react';
import { Search, Settings, HelpCircle, Grid, Menu, LogOut, Cloud } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

/**
 * DashboardHeader - Modern top navigation header.
 * Exposes sidebar triggers, user status widgets, and MERN search queries.
 */
const DashboardHeader = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-2.5 bg-white border-b border-slate-200/80 shadow-sm relative z-30 select-none">
      
      {/* 1. Hamburger & Cloud Brand Title */}
      <div className="flex items-center space-x-1 shrink-0">
        <button 
          onClick={onMenuClick}
          className="p-2 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-900 active:scale-95 transition-all cursor-pointer"
          title="Toggle Navigation Menu"
        >
          <Menu size={20} className="stroke-[2.2]" />
        </button>
        
        <div className="flex items-center space-x-2 pl-1 cursor-pointer">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md shadow-blue-500/10 shrink-0">
            <Cloud size={18} strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold text-slate-800 tracking-tight hidden sm:block">Shnoor Drive</span>
        </div>
      </div>

      {/* 2. Responsive SaaS Expanding Search Bar */}
      <div className="flex-1 max-w-xl mx-4 md:mx-10">
        <div className="relative flex items-center w-full h-10.5 rounded-full bg-slate-100 hover:bg-slate-200/50 hover:shadow-inner focus-within:bg-white focus-within:shadow-md focus-within:ring-2 focus-within:ring-blue-600/15 border border-transparent focus-within:border-slate-200 transition-all duration-200">
          <span className="pl-3.5 text-slate-400">
            <Search size={18} strokeWidth={2.2} />
          </span>
          <input
            type="text"
            placeholder="Search files, folders..."
            className="flex-1 px-3 bg-transparent outline-none text-slate-700 placeholder-slate-400 font-normal text-sm"
          />
          
          <button className="p-1.5 mr-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 active:scale-95 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M7 12h10" />
              <path d="M10 18h4" />
            </svg>
          </button>
        </div>
      </div>

      {/* 3. Account Widgets & Session controls */}
      <div className="flex items-center justify-end space-x-1.5">
        <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 active:scale-95 transition-all cursor-pointer hidden md:block" title="Help">
          <HelpCircle size={20} strokeWidth={1.8} />
        </button>
        <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 active:scale-95 transition-all cursor-pointer hidden md:block" title="Settings">
          <Settings size={20} strokeWidth={1.8} />
        </button>
        <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 active:scale-95 transition-all cursor-pointer hidden md:block" title="Apps">
          <Grid size={20} strokeWidth={1.8} />
        </button>
        
        {/* Render Authenticated User Node */}
        {user ? (
          <div className="flex items-center bg-slate-50 pl-2 pr-1.5 py-1 rounded-full border border-slate-200/60 ml-2">
            <div className="flex flex-col items-end pr-2 md:pr-3 pl-1 hidden sm:flex">
              <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[100px]">{user.name}</span>
              <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[120px]">{user.email}</span>
            </div>
            
            {/* User Avatar Circle */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 rounded-full border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center shrink-0"
            >
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-full h-full object-cover select-none"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </motion.div>
            
            {/* Quick Logout Button */}
            <button 
              onClick={logout} 
              className="ml-1.5 p-1.5 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 active:scale-95 transition-all cursor-pointer" 
              title="Sign Out"
            >
              <LogOut size={16} strokeWidth={2} />
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
};

export default DashboardHeader;
