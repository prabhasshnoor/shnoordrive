import React, { useState, useEffect } from 'react';
import { Cloud, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NavbarPlatformpage = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <Cloud size={24} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">Shnoor Drive</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Features</a>
            <a href="#for-work" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">For Work</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Pricing</a>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button onClick={() => navigate('/login')} className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Sign in</button>
            <button onClick={() => navigate('/login')} className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95">
              Go to Drive
            </button>
          </div>

          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-600 hover:text-slate-900 focus:outline-none"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg border-t border-slate-100">
          <div className="px-4 pt-2 pb-6 space-y-4 flex flex-col">
            <a href="#features" className="block px-3 py-2 text-base font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-md">Features</a>
            <a href="#for-work" className="block px-3 py-2 text-base font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-md">For Work</a>
            <a href="#pricing" className="block px-3 py-2 text-base font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-md">Pricing</a>
            <div className="border-t border-slate-100 pt-4 flex flex-col space-y-3">
              <button onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} className="w-full text-left px-3 py-2 text-base font-medium text-slate-700 hover:text-blue-600">Sign in</button>
              <button onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} className="w-full px-3 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg text-center">
                Go to Drive
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavbarPlatformpage;
