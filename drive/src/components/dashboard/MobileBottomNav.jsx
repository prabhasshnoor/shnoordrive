import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { HardDrive, Clock, Star, Trash2, Cloud } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * MobileBottomNav - Premium mobile navigation drawer.
 * Visible on viewport widths below 'md' (768px).
 * Uses Framer Motion layout transitions for premium native-app feel.
 */
const MobileBottomNav = () => {
  const location = useLocation();
  const activePath = location.pathname;

  const navItems = [
    { icon: HardDrive, label: 'My Drive', to: '/drive' },
    { icon: Clock, label: 'Recent', to: '/drive/recent' },
    { icon: Star, label: 'Starred', to: '/drive/starred' },
    { icon: Trash2, label: 'Bin', to: '/drive/bin' },
    { icon: Cloud, label: 'Storage', to: '/drive/storage' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-lg border-t border-slate-200/80 shadow-lg z-40 flex items-center justify-around px-2 pb-safe">
      {navItems.map((item) => {
        const isActive = activePath === item.to;
        const Icon = item.icon;

        return (
          <Link 
            key={item.label} 
            to={item.to} 
            className="flex flex-col items-center justify-center flex-1 h-full relative"
          >
            {/* Active Highlight Background Pill */}
            {isActive && (
              <motion.div 
                layoutId="mobileActiveTab"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="absolute top-1 w-12 h-8 bg-blue-50 rounded-full -z-10"
              />
            )}

            {/* Icon & Label */}
            <div className={`flex flex-col items-center space-y-0.5 transition-colors duration-200 ${isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'}`}>
              <Icon 
                size={20} 
                className={`transition-transform duration-200 active:scale-90 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} 
              />
              <span className="text-[10px] tracking-wide select-none">{item.label}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
