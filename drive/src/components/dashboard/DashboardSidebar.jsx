import React from 'react';
import { Plus, Home, Activity, Layers, HardDrive, Users, Share2, Clock, Star, AlertOctagon, Trash2, Cloud } from 'lucide-react';

const NavItem = ({ icon: Icon, label, active = false }) => {
  return (
    <div className={`flex items-center px-6 py-2 mx-2 mb-0.5 rounded-full cursor-pointer transition-colors ${active ? 'bg-blue-100 text-blue-900 font-medium' : 'hover:bg-slate-100 text-slate-700'}`}>
      <Icon size={20} className={`mr-4 ${active ? 'text-blue-700' : 'text-slate-600'}`} />
      <span className="text-sm tracking-wide">{label}</span>
    </div>
  );
};

const DashboardSidebar = () => {
  return (
    <div className="w-[280px] flex flex-col h-[calc(100vh-65px)] bg-slate-50 border-r border-slate-100 pt-4 overflow-y-auto">
      <div className="px-4 mb-4">
        <button className="flex items-center space-x-3 bg-white hover:bg-blue-50 text-slate-700 py-4 px-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all active:shadow-sm group">
          <Plus size={24} className="text-slate-600 group-hover:text-blue-600" />
          <span className="font-medium text-sm">New</span>
        </button>
      </div>

      <div className="flex-1 space-y-1">
        <NavItem icon={Home} label="Home" active={true} />
        <NavItem icon={Activity} label="Activity" />
        <NavItem icon={Layers} label="Workspaces" />
        
        <div className="my-3 border-t border-slate-200 mx-4"></div>
        
        <NavItem icon={HardDrive} label="My Drive" />
        <NavItem icon={Users} label="Shared drives" />
        
        <div className="my-3 border-t border-slate-200 mx-4"></div>
        
        <NavItem icon={Share2} label="Shared with me" />
        <NavItem icon={Clock} label="Recent" />
        <NavItem icon={Star} label="Starred" />
        
        <div className="my-3 border-t border-slate-200 mx-4"></div>
        
        <NavItem icon={AlertOctagon} label="Spam" />
        <NavItem icon={Trash2} label="Bin" />
        <NavItem icon={Cloud} label="Storage" />
        
        <div className="px-14 pt-1">
          <p className="text-xs text-slate-500">51.1 MB used</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;
