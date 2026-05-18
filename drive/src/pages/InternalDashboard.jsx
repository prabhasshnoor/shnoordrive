import React from 'react';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardMainContent from '../components/dashboard/DashboardMainContent';
import DashboardRightPanel from '../components/dashboard/DashboardRightPanel';

const InternalDashboard = () => {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white font-sans">
      <DashboardHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar />
        <DashboardMainContent />
        <DashboardRightPanel />
      </div>
    </div>
  );
};

export default InternalDashboard;
