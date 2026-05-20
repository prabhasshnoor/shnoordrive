import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardMainContent from '../components/dashboard/DashboardMainContent';
import DashboardRightPanel from '../components/dashboard/DashboardRightPanel';
import MobileBottomNav from '../components/dashboard/MobileBottomNav';
import { useDrive } from '../context/DriveContext';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * InternalDashboard - Core MERN Drive Platform Dashboard.
 * Integrates responsive sidebar drawer states, top navbar, mobile bottom navigation,
 * side utility panel dock, and animated upload progress cards.
 */
const InternalDashboard = () => {
  const { uploadState } = useDrive();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 font-sans relative">
      
      {/* 1. Sleek top navbar */}
      <DashboardHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      {/* 2. Responsive Inner Layout wrapper */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Responsive Sidebar (Sliding Drawer on Mobile/Tablet, Static on Desktop) */}
        <DashboardSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
        
        {/* Scrollable central content dashboard */}
        <DashboardMainContent onMenuClick={() => setIsSidebarOpen(true)} />
        
        {/* Right utility sidebar panel (Hidden on screens below 1024px for clean SaaS space) */}
        <div className="hidden lg:block shrink-0">
          <DashboardRightPanel />
        </div>
      </div>

      {/* 3. Sticky Bottom Mobile Touch-friendly Navigation (Hidden on desktop screen width) */}
      <MobileBottomNav />

      {/* 4. Real-time Google Drive Style File Upload Progress Card (Floating) */}
      <AnimatePresence>
        {uploadState && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 25 }}
            className="fixed bottom-20 md:bottom-6 right-4 md:right-6 w-[calc(100vw-32px)] md:w-96 bg-white border border-slate-200/80 rounded-2xl shadow-2xl z-[999] overflow-hidden flex flex-col font-sans text-slate-800"
          >
            {/* Progress Header */}
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {uploadState.status === 'uploading' && 'Uploading 1 item...'}
                {uploadState.status === 'completed' && '1 upload complete'}
                {uploadState.status === 'error' && 'Upload failed'}
              </span>
            </div>
            
            {/* Progress Details */}
            <div className="p-4 flex flex-col space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="truncate font-semibold max-w-[200px] text-slate-700">{uploadState.name}</span>
                {uploadState.status === 'uploading' && (
                  <span className="font-bold text-blue-600">{uploadState.progress}%</span>
                )}
              </div>
              
              {/* Animated Progress Bar */}
              {uploadState.status === 'uploading' && (
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner border border-slate-200/50">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadState.progress}%` }}
                    transition={{ ease: 'easeOut', duration: 0.1 }}
                    className="bg-blue-600 h-full rounded-full"
                  />
                </div>
              )}

              {/* Success Badge */}
              {uploadState.status === 'completed' && (
                <div className="flex items-center space-x-2 text-emerald-600 text-xs font-semibold bg-emerald-50 px-3 py-2.5 rounded-xl border border-emerald-100/60">
                  <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                  <span>Successfully added to My Drive!</span>
                </div>
              )}

              {/* Error Badge */}
              {uploadState.status === 'error' && (
                <div className="flex items-center space-x-2 text-rose-600 text-xs font-semibold bg-rose-50 px-3 py-2.5 rounded-xl border border-rose-100/60">
                  <AlertCircle size={16} className="text-rose-500 shrink-0" />
                  <span className="truncate max-w-[240px]" title={uploadState.error}>{uploadState.error}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InternalDashboard;
