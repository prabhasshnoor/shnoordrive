import React from 'react';
import { CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardMainContent from '../components/dashboard/DashboardMainContent';
import DashboardRightPanel from '../components/dashboard/DashboardRightPanel';
import { useAuth } from '../context/AuthContext';
import { useDrive } from '../context/DriveContext';

const InternalDashboard = () => {
  const { uploadState } = useDrive();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white font-sans relative">
      <DashboardHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar />
        <DashboardMainContent />
        <DashboardRightPanel />
      </div>

      {/* Floating Google Drive Style File Upload Progress Card */}
      {uploadState && (
        <div className="fixed bottom-6 right-6 w-96 bg-white border border-slate-200 rounded-xl shadow-2xl z-[999] overflow-hidden flex flex-col animate-fade-in text-slate-800">
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold">
              {uploadState.status === 'uploading' && 'Uploading 1 item...'}
              {uploadState.status === 'completed' && '1 upload complete'}
              {uploadState.status === 'error' && 'Upload failed'}
            </span>
          </div>
          
          {/* Progress / Status Body */}
          <div className="p-4 flex flex-col space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-600">
              <span className="truncate font-medium max-w-[240px] text-slate-800">{uploadState.name}</span>
              {uploadState.status === 'uploading' && (
                <span className="font-semibold text-blue-600">{uploadState.progress}%</span>
              )}
            </div>
            
            {/* Linear Progress Bar */}
            {uploadState.status === 'uploading' && (
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${uploadState.progress}%` }} 
                />
              </div>
            )}

            {/* Success state */}
            {uploadState.status === 'completed' && (
              <div className="flex items-center space-x-2 text-emerald-600 text-xs font-semibold bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                <span>Successfully added to My Drive!</span>
              </div>
            )}

            {/* Error state */}
            {uploadState.status === 'error' && (
              <div className="flex items-center space-x-2 text-red-600 text-xs font-semibold bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                <AlertCircle size={16} className="text-red-500 shrink-0" />
                <span className="truncate max-w-[280px]">{uploadState.error}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InternalDashboard;
