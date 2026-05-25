import React, { useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Plus, HardDrive, Clock, Star, Share2, Trash2, Cloud, FolderPlus, 
  FileUp, FolderUp, ChevronRight, X, LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDrive } from '../../context/DriveContext';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * NavItem - Sleek navigation item with Framer Motion active bubbles.
 */
const NavItem = ({ icon: Icon, label, to = '/drive', active = false, onClick, badge }) => {
  return (
    <Link to={to} onClick={onClick} className="block no-underline select-none">
      <div className={`flex items-center px-4 py-2.5 mx-3 mb-1 rounded-xl cursor-pointer relative transition-all group ${active ? 'text-blue-600 font-bold' : 'hover:bg-slate-100/80 text-slate-600 hover:text-slate-900'}`}>
        
        {/* Active Pill Indicator */}
        {active && (
          <motion.div 
            layoutId="sidebarActiveIndicator"
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="absolute inset-0 bg-blue-50/70 border-l-[3px] border-blue-600 rounded-xl -z-10"
          />
        )}
        
        <Icon size={18} className={`mr-3.5 transition-transform duration-200 group-hover:scale-105 ${active ? 'text-blue-600 stroke-[2.2]' : 'text-slate-500 group-hover:text-slate-700 stroke-[1.8]'}`} />
        <span className="text-xs tracking-wider uppercase font-semibold flex-1">{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className="bg-blue-100 text-blue-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full select-none">
            {badge}
          </span>
        )}
      </div>
    </Link>
  );
};

const DashboardSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderName, setFolderName] = useState('Untitled folder');
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const { storageUsed, storageLimit, uploadFile, createFolder, sharedLinks } = useDrive();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsNewMenuOpen(false);
    await uploadFile(file);
    e.target.value = '';
  };

  const handleFolderChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setIsNewMenuOpen(false);

    const firstRelativePath = files[0].webkitRelativePath || '';
    const nameOfFolder = firstRelativePath.split('/')[0] || 'Uploaded Folder';

    await createFolder(nameOfFolder);

    for (const file of files) {
      await uploadFile(file, file.webkitRelativePath);
    }
    e.target.value = '';
  };

  const handleFolderCreate = async () => {
    if (!folderName || !folderName.trim()) return;
    setIsFolderModalOpen(false);
    await createFolder(folderName.trim());
  };

  // Convert bytes to MB/GB dynamically
  const usedMB = (storageUsed / (1024 * 1024)).toFixed(1);
  const limitMB = (storageLimit / (1024 * 1024)).toFixed(0);
  const percentage = storageLimit > 0 ? (storageUsed / storageLimit) * 100 : 0;
  
  let progressBarColor = 'bg-blue-600';
  if (percentage > 90) {
    progressBarColor = 'bg-red-500';
  } else if (percentage > 75) {
    progressBarColor = 'bg-amber-500';
  }

  // Sidebar Inner Markup used for both Desktop and Mobile views
  const renderSidebarContent = (isMobileView = false) => (
    <div className="flex flex-col h-full bg-white select-none">
      
      {/* Mobile Drawer Close Button */}
      {isMobileView && (
        <div className="p-4 flex items-center justify-between border-b border-slate-100">
          <span className="text-sm font-bold text-slate-800 tracking-tight">Navigation</span>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 active:scale-90 transition-all cursor-pointer"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Hidden File/Folder inputs */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      <input type="file" ref={folderInputRef} onChange={handleFolderChange} webkitdirectory="" directory="" multiple className="hidden" />

      {/* 1. Large "New" Action Button */}
      <div className="px-5 py-5 relative">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
          className="flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-500 text-white py-3 px-5 w-full rounded-2xl shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/15 transition-all select-none cursor-pointer group"
        >
          <Plus size={20} className="stroke-[2.5]" />
          <span className="font-bold text-xs uppercase tracking-wider">New Action</span>
        </motion.button>

        {/* Dropdown Menu popover */}
        <AnimatePresence>
          {isNewMenuOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsNewMenuOpen(false)} />
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="absolute left-5 right-5 top-18 bg-white border border-slate-200/80 rounded-2xl shadow-2xl z-50 py-2.5 font-sans"
              >
                <button 
                  onClick={() => { setIsFolderModalOpen(true); setIsNewMenuOpen(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-slate-50 text-left transition-colors cursor-pointer"
                >
                  <FolderPlus size={18} className="text-slate-500 shrink-0" />
                  <span className="text-sm font-semibold text-slate-700">New Folder</span>
                </button>
                <div className="border-t border-slate-100 my-1.5" />
                <button 
                  onClick={() => { fileInputRef.current.click(); setIsNewMenuOpen(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-slate-50 text-left transition-colors cursor-pointer"
                >
                  <FileUp size={18} className="text-slate-500 shrink-0" />
                  <span className="text-sm font-semibold text-slate-700">Upload File</span>
                </button>
                <button 
                  onClick={() => { folderInputRef.current.click(); setIsNewMenuOpen(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-slate-50 text-left transition-colors cursor-pointer"
                >
                  <FolderUp size={18} className="text-slate-500 shrink-0" />
                  <span className="text-sm font-semibold text-slate-700">Upload Directory</span>
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Navigation Items List */}
      <div className="flex-1 overflow-y-auto space-y-0.5">
        <NavItem icon={HardDrive} label="My Drive" to="/drive" active={location.pathname === '/drive'} onClick={() => isMobileView && onClose()} />
        <NavItem icon={Clock} label="Recent" to="/drive/recent" active={location.pathname === '/drive/recent'} onClick={() => isMobileView && onClose()} />
        <NavItem icon={Star} label="Starred" to="/drive/starred" active={location.pathname === '/drive/starred'} onClick={() => isMobileView && onClose()} />
        <NavItem icon={Share2} label="Shared Links" to="/drive/shared-links" active={location.pathname === '/drive/shared-links'} badge={sharedLinks?.length} onClick={() => isMobileView && onClose()} />
        <NavItem icon={Trash2} label="Bin" to="/drive/bin" active={location.pathname === '/drive/bin'} onClick={() => isMobileView && onClose()} />
        <NavItem icon={Cloud} label="Storage" to="/drive/storage" active={location.pathname === '/drive/storage'} onClick={() => isMobileView && onClose()} />
        
        <div className="border-t border-slate-100 my-4 mx-4" />
        
        <button 
          onClick={logout}
          className="w-[calc(100%-24px)] flex items-center px-4 py-2.5 mx-3 mb-1 rounded-xl text-rose-500 hover:bg-rose-50 active:scale-95 transition-all cursor-pointer select-none"
        >
          <LogOut size={18} className="mr-3.5 stroke-[2]" />
          <span className="text-xs tracking-wider uppercase font-semibold">Sign Out</span>
        </button>
      </div>

      {/* 3. Real-Time Custom Storage Metrics Widget */}
      <div className="p-4 border-t border-slate-100/80 bg-slate-50/50">
        <div className="bg-white border border-slate-200/60 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center space-x-2 text-slate-700 mb-2">
            <Cloud size={16} className="text-blue-600 shrink-0" />
            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Cloud Space</span>
          </div>

          {/* Animated Linear Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2.5 shadow-inner border border-slate-200/50">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, percentage)}%` }}
              transition={{ ease: 'easeOut', duration: 0.8 }}
              className={`${progressBarColor} h-full rounded-full`}
            />
          </div>

          <p className="text-[11px] text-slate-500 font-semibold leading-none">
            {usedMB} MB of {limitMB} MB used ({percentage.toFixed(1)}%)
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Rendered statically beside central panel) */}
      <aside className="hidden md:flex flex-col w-[260px] bg-white border-r border-slate-200/80 shrink-0 h-[calc(100vh-61px)] relative z-20">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Drawer (Collapsible slide-over drawer triggered by header menu clicks) */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] md:hidden">
            {/* Dark blur backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
            />
            
            {/* Slide-over panel */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="absolute top-0 bottom-0 left-0 w-[280px] bg-white shadow-2xl overflow-hidden"
            >
              {renderSidebarContent(true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Folder Modal Panel */}
      <AnimatePresence>
        {isFolderModalOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[1px] z-[99999] flex items-center justify-center font-sans">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFolderModalOpen(false)}
              className="absolute inset-0"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-[340px] rounded-3xl p-6 shadow-2xl border border-slate-100 text-slate-800 z-10"
            >
              <h3 className="text-xl font-bold text-slate-800 mb-5 tracking-tight">New folder</h3>
              <div className="mb-5">
                <input 
                  type="text" 
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  placeholder="Folder name"
                  autoFocus
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFolderCreate();
                    if (e.key === 'Escape') setIsFolderModalOpen(false);
                  }}
                />
              </div>
              <div className="flex justify-end space-x-3 text-xs font-bold uppercase tracking-wider">
                <button 
                  onClick={() => setIsFolderModalOpen(false)}
                  className="text-slate-500 hover:bg-slate-50 py-2 px-3.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleFolderCreate}
                  className="bg-blue-600 hover:bg-blue-500 text-white py-2.5 px-4 rounded-xl cursor-pointer shadow-md shadow-blue-500/10"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DashboardSidebar;
