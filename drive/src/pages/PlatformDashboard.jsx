import React from 'react';
import NavbarPlatformpage from '../components/NavbarPlatformpage';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import Footer from '../components/Footer';

const PlatformDashboard = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-blue-200 selection:text-blue-900">
      <NavbarPlatformpage />
      
      <main className="flex-grow">
        <HeroSection />
        <FeaturesSection />
      </main>
      
      <Footer />
    </div>
  );
};

export default PlatformDashboard;
