import React, { useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Plus, Home, Activity, Layers, HardDrive, Users, Share2, Clock, 
  Star, AlertOctagon, Trash2, Cloud, FolderPlus, FileUp, FolderUp,
  FileText, FileSpreadsheet, Presentation, Video, ClipboardList, 
  MoreHorizontal, ChevronRight 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDrive } from '../../context/DriveContext';

const NavItem = ({ icon: Icon, label, to = '/drive', active = false }) => {
  return (
    <Link to={to} className="block no-underline select-none">
      <div className={`flex items-center px-6 py-2 mx-2 mb-0.5 rounded-full cursor-pointer transition-colors ${active ? 'bg-blue-100 text-blue-900 font-medium' : 'hover:bg-slate-100 text-slate-700'}`}>
        <Icon size={20} className={`mr-4 ${active ? 'text-blue-700' : 'text-slate-600'}`} />
        <span className="text-sm tracking-wide">{label}</span>
      </div>
    </Link>
  );
};

const DashboardSidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('Untitled folder');
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const { storageUsed, storageLimit, uploadFile, createFolder } = useDrive();

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsOpen(false); // Close dropdown menu
    await uploadFile(file);
    e.target.value = ''; // Reset input to allow uploading the same file again
  };

  const handleFolderChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setIsOpen(false);

    // Extract the top-level directory's name from webkitRelativePath (e.g. "MyPhotos/img.png" -> "MyPhotos")
    const firstRelativePath = files[0].webkitRelativePath || '';
    const folderName = firstRelativePath.split('/')[0] || 'Uploaded Folder';

    // 1. Create the virtual folder with the directory's existing name
    await createFolder(folderName);

    // 2. Upload all files inside this directory sequentially to retain pathway mappings
    for (const file of files) {
      await uploadFile(file, file.webkitRelativePath);
    }
    e.target.value = '';
  };

  const handleNewFolderClick = () => {
    setNewFolderName('Untitled folder');
    setIsNewFolderModalOpen(true);
    setIsOpen(false); // Close dropdown
  };

  const handleFolderModalSubmit = async () => {
    if (!newFolderName || !newFolderName.trim()) return;
    setIsNewFolderModalOpen(false);
    await createFolder(newFolderName.trim());
  };

  // Convert bytes to MB dynamically
  const usedMB = (storageUsed / (1024 * 1024)).toFixed(1);
  const limitMB = (storageLimit / (1024 * 1024)).toFixed(0);
  const percentage = storageLimit > 0 ? (storageUsed / storageLimit) * 100 : 0;
  
  // Choose color based on storage percentage usage
  let progressBarColor = 'bg-blue-600';
  if (percentage > 90) {
    progressBarColor = 'bg-red-600';
  } else if (percentage > 75) {
    progressBarColor = 'bg-amber-500';
  }

  return (
    <div className="w-[280px] flex flex-col h-[calc(100vh-65px)] bg-slate-50 border-r border-slate-100 pt-4 overflow-y-auto relative">
      {/* Hidden File Input for uploading */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />

      {/* Hidden Folder directory upload input */}
      <input 
        type="file" 
        ref={folderInputRef} 
        onChange={handleFolderChange} 
        webkitdirectory=""
        directory=""
        multiple
        className="hidden" 
      />
      
      <div className="px-4 mb-4 relative z-50">
        <button 
          onClick={toggleDropdown}
          className="flex items-center space-x-3 bg-white hover:bg-blue-50 text-slate-700 py-4 px-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all active:shadow-sm group w-auto"
        >
          <Plus size={24} className="text-slate-600 group-hover:text-blue-600" />
          <span className="font-medium text-sm">New</span>
        </button>

        {isOpen && (
          <>
            {/* Backdrop to close when clicking outside */}
            <div 
              className="fixed inset-0 z-40 bg-transparent" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown Menu (Fixed position to prevent overflow clipping by sidebar) */}
            <div className="fixed left-4 top-[135px] w-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 py-1.5 animate-fade-in font-sans text-slate-800">
              
              {/* Folder & Upload Options */}
              <div className="py-0.5">
                <button 
                  onClick={handleNewFolderClick}
                  className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-100 text-left transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <FolderPlus size={18} className="text-slate-500" />
                    <span className="text-[14px] text-slate-700">New folder</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-normal">Alt+C then F</span>
                </button>
                
                <div className="border-t border-slate-100 my-1"></div>
                
                <button 
                  onClick={() => fileInputRef.current.click()}
                  className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-100 text-left transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <FileUp size={18} className="text-slate-500" />
                    <span className="text-[14px] text-slate-700">File upload</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-normal">Alt+C then U</span>
                </button>
                
                <button 
                  onClick={() => folderInputRef.current.click()}
                  className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-100 text-left transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <FolderUp size={18} className="text-slate-500" />
                    <span className="text-[14px] text-slate-700">Folder upload</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-normal">Alt+C then I</span>
                </button>
              </div>

              <div className="border-t border-slate-200 my-1"></div>

              {/* Google Suite Apps */}
              <div className="py-0.5">
                <button className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-100 text-left transition-colors">
                  <div className="flex items-center space-x-3">
                    <FileText size={18} className="text-blue-500 fill-blue-50" />
                    <span className="text-[14px] text-slate-700">Google Docs</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>

                <button className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-100 text-left transition-colors">
                  <div className="flex items-center space-x-3">
                    <FileSpreadsheet size={18} className="text-emerald-600 fill-emerald-50" />
                    <span className="text-[14px] text-slate-700">Google Sheets</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>

                <button className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-100 text-left transition-colors">
                  <div className="flex items-center space-x-3">
                    <Presentation size={18} className="text-amber-500 fill-amber-50" />
                    <span className="text-[14px] text-slate-700">Google Slides</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>

                <button className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-100 text-left transition-colors">
                  <div className="flex items-center space-x-3">
                    <Video size={18} className="text-indigo-500 fill-indigo-50" />
                    <span className="text-[14px] text-slate-700">Google Vids</span>
                  </div>
                </button>

                <button className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-100 text-left transition-colors">
                  <div className="flex items-center space-x-3">
                    <ClipboardList size={18} className="text-purple-600 fill-purple-50" />
                    <span className="text-[14px] text-slate-700">Google Forms</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>
              </div>

              <div className="border-t border-slate-200 my-1"></div>

              {/* More */}
              <div className="py-0.5">
                <button className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-100 text-left transition-colors">
                  <div className="flex items-center space-x-3">
                    <MoreHorizontal size={18} className="text-slate-500" />
                    <span className="text-[14px] text-slate-700">More</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-400" />
                </button>
              </div>

            </div>
          </>
        )}
      </div>

      <div className="flex-grow space-y-1">
        <NavItem icon={Home} label="Home" to="/drive" active={location.pathname === '/drive'} />
        <NavItem icon={Activity} label="Activity" to="#" active={false} />
        <NavItem icon={Layers} label="Workspaces" to="#" active={false} />
        
        <div className="my-3 border-t border-slate-200 mx-4"></div>
        
        <NavItem icon={HardDrive} label="My Drive" to="/drive" active={location.pathname === '/drive'} />
        <NavItem icon={Users} label="Shared drives" to="#" active={false} />
        
        <div className="my-3 border-t border-slate-200 mx-4"></div>
        
        <NavItem icon={Share2} label="Shared with me" to="#" active={false} />
        <NavItem icon={Clock} label="Recent" to="/drive/recent" active={location.pathname === '/drive/recent'} />
        <NavItem icon={Star} label="Starred" to="/drive/starred" active={location.pathname === '/drive/starred'} />
        
        <div className="my-3 border-t border-slate-200 mx-4"></div>
        
        <NavItem icon={AlertOctagon} label="Spam" to="#" active={false} />
        <NavItem icon={Trash2} label="Bin" to="/drive/bin" active={location.pathname === '/drive/bin'} />
        
        <div className="my-3 border-t border-slate-200 mx-4"></div>
        
        {/* Dynamic real-time Google Drive Storage Section */}
        <div className="px-6 py-2">
          <Link to="/drive/storage" className="block no-underline select-none">
            <div className={`flex items-center px-0 py-2 rounded-full cursor-pointer transition-colors ${location.pathname === '/drive/storage' ? 'text-blue-900 font-medium' : 'text-slate-700'}`}>
              <Cloud size={20} className={`mr-4 ${location.pathname === '/drive/storage' ? 'text-blue-700' : 'text-slate-600'}`} />
              <span className="text-sm tracking-wide">Storage</span>
            </div>
          </Link>
          
          <div className="pl-9 pr-2">
            {/* Storage Progress Bar */}
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-2 shadow-inner">
              <div 
                className={`${progressBarColor} h-full rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${Math.min(100, percentage)}%` }}
              ></div>
            </div>
            
            {/* Storage Text Description */}
            <p className="text-xs text-slate-500 font-normal">
              {usedMB} MB of {limitMB} MB used
            </p>
            
            <a 
              href="#" 
              onClick={(e) => e.preventDefault()}
              className="inline-block mt-3 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-full transition-all active:scale-[0.98]"
            >
              Get more storage
            </a>
          </div>
        </div>

      </div>

      {/* High-Fidelity Google Drive Style New Folder Modal */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-[1px] z-[99999] flex items-center justify-center font-sans animate-fade-in">
          {/* Backdrop to dismiss modal */}
          <div 
            className="absolute inset-0" 
            onClick={() => setIsNewFolderModalOpen(false)}
          />
          
          {/* Modal Card */}
          <div className="relative bg-white w-[360px] rounded-3xl p-6 shadow-2xl border border-slate-100 animate-scale-up text-slate-800">
            <h3 className="text-[22px] font-normal text-slate-800 mb-6 tracking-tight">New folder</h3>
            
            {/* Input field wrapper */}
            <div className="mb-6">
              <input 
                type="text" 
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-600 rounded-lg outline-none text-base font-normal text-slate-700 focus:border-blue-700 transition-colors"
                placeholder="Folder name"
                autoFocus
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFolderModalSubmit();
                  if (e.key === 'Escape') setIsNewFolderModalOpen(false);
                }}
              />
            </div>
            
            {/* Action buttons (Cancel & Create) */}
            <div className="flex justify-end space-x-6 text-sm font-semibold select-none">
              <button 
                onClick={() => setIsNewFolderModalOpen(false)}
                className="text-blue-600 hover:text-blue-700 transition-colors py-2 px-3.5 rounded-full hover:bg-blue-50/50 active:scale-95"
              >
                Cancel
              </button>
              <button 
                onClick={handleFolderModalSubmit}
                className="text-blue-600 hover:text-blue-700 transition-colors py-2 px-3.5 rounded-full hover:bg-blue-50/50 active:scale-95"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardSidebar;
