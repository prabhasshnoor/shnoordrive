import React, { useState, useEffect } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { 
  Info, File, FileImage, FileVideo, FileText, Music, 
  Trash2, Eye, Download, Folder, ChevronRight,
  Clock, Star, HardDrive, RotateCcw, Cloud, LayoutGrid, List,
  MoreVertical, Check, FolderOpen, Share2, Link2, Users, AlertCircle
} from 'lucide-react';
import { useDrive } from '../../context/DriveContext';
import { motion, AnimatePresence } from 'framer-motion';
import SharedBadge from './SharedBadge';
import ShareModal from './ShareModal';
import SharedLinksPage from './SharedLinksPage';
import toast from 'react-hot-toast';
import axios from 'axios';
import api from '../../api/axios';

/**
 * Helper to convert raw byte sizes into human readable formats.
 */
const formatBytes = (bytes, decimals = 1) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Returns the matching Lucide icon based on the file's mime type.
 */
const getFileIcon = (mimeType) => {
  if (!mimeType) return File;
  if (mimeType === 'folder') return Folder;
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.startsWith('video/')) return FileVideo;
  if (mimeType.startsWith('audio/')) return Music;
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('text/')) return FileText;
  return File;
};

/**
 * Returns corresponding Tailwind color badges for individual file types.
 */
const getIconColorClass = (mimeType) => {
  if (!mimeType) return 'text-slate-400 bg-slate-100';
  if (mimeType === 'folder') return 'text-amber-500 bg-amber-50 border-amber-100';
  if (mimeType.startsWith('image/')) return 'text-blue-500 bg-blue-50 border-blue-100';
  if (mimeType.startsWith('video/')) return 'text-purple-500 bg-purple-50 border-purple-100';
  if (mimeType.startsWith('audio/')) return 'text-amber-500 bg-amber-50 border-amber-100';
  if (mimeType.includes('pdf')) return 'text-red-500 bg-red-50 border-red-100';
  if (mimeType.includes('text/')) return 'text-emerald-500 bg-emerald-50 border-emerald-100';
  return 'text-slate-500 bg-slate-50 border-slate-200/60';
};

const getFileTypeLabel = (mimeType) => {
  if (!mimeType) return 'Unknown file';
  if (mimeType === 'folder') return 'Folder';
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('video/')) return 'Video';
  if (mimeType.startsWith('audio/')) return 'Audio';
  if (mimeType.includes('pdf')) return 'PDF Document';
  if (mimeType.includes('text/')) return 'Text Document';
  return 'Document';
};

const DashboardMainContent = ({ onMenuClick }) => {
  const location = useLocation();
  const { shareId } = useParams();
  const { files, loadingDrive, deleteFileById, restoreFileById, storageUsed, storageLimit, shareFileById, fetchDriveData } = useDrive();
  const [currentFolder, setCurrentFolder] = useState(null); // null = Root, string = active folder directory
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [activeMenuId, setActiveMenuId] = useState(null); // Tracks open action dropdowns for files

  // Premium Custom States for Sleek Delete Experience
  const [deleteConfirmFile, setDeleteConfirmFile] = useState(null); // Selected file for the delete modal
  const [deletingFileId, setDeletingFileId] = useState(null);       // Tracks background API delete loading states

  // Share Modal States
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareModalFile, setShareModalFile] = useState(null);
  const [shareModalUrl, setShareModalUrl] = useState('');

  const isRecentView = location.pathname === '/drive/recent';
  const isStarredView = location.pathname === '/drive/starred';
  const isBinView = location.pathname === '/drive/bin';
  const isStorageView = location.pathname === '/drive/storage';
  const isSharedLinkView = location.pathname.startsWith('/drive/shared/');
  const isSharedLinksView = location.pathname === '/drive/shared-links';

  // States for shared link details
  const [sharedLinkData, setSharedLinkData] = useState(null);
  const [loadingSharedLink, setLoadingSharedLink] = useState(false);
  const [sharedLinkError, setSharedLinkError] = useState(null);
  const [openedTime, setOpenedTime] = useState('');

  // Fetch shared file metadata if in shared link view
  useEffect(() => {
    const fetchSharedLink = async () => {
      if (!shareId) return;
      setLoadingSharedLink(true);
      setSharedLinkError(null);
      try {
        const response = await api.get(`/shared/${shareId}`);
        if (response.data.success) {
          setSharedLinkData(response.data);
          // Set openedTime to current time format HH:MM
          const now = new Date();
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          setOpenedTime(`${hours}:${minutes}`);
          // Sync the user's active drive files and storage consumption in context
          fetchDriveData();
        } else {
          setSharedLinkError(response.data.message || 'Unable to load shared file.');
        }
      } catch (err) {
        console.error('Fetch shared file failed:', err);
        const msg = err.response?.data?.message || 'An error occurred while loading the shared file.';
        setSharedLinkError(msg);
      } finally {
        setLoadingSharedLink(false);
      }
    };

    if (isSharedLinkView && shareId) {
      fetchSharedLink();
    } else {
      setSharedLinkData(null);
      setSharedLinkError(null);
    }
  }, [isSharedLinkView, shareId, fetchDriveData]);

  // Helper helper to display animated toast messages using react-hot-toast
  const showToast = (message, type = 'success') => {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  // Triggers the custom styled delete confirmation modal popup
  const triggerDeleteConfirm = (fileId) => {
    const file = files.find(f => f._id === fileId);
    if (!file) return;
    setDeleteConfirmFile(file);
    setActiveMenuId(null); // Close dropdown
  };

  // Executes the real-time delete with optimistic UI updates and toast callbacks
  const confirmDelete = async () => {
    if (!deleteConfirmFile) return;
    const fileId = deleteConfirmFile._id;
    const file = deleteConfirmFile;
    const isPermanent = isBinView || file.isDeleted;
    
    setDeletingFileId(fileId);
    setDeleteConfirmFile(null); // Close the confirmation modal instantly

    try {
      const result = await deleteFileById(fileId);
      if (result && result.success) {
        showToast(
          isPermanent 
            ? `Permanently deleted "${file.fileName}" successfully!` 
            : `Moved "${file.fileName}" to Bin.`, 
          'success'
        );
      } else {
        showToast(result?.message || 'Delete operation failed.', 'error');
      }
    } catch (err) {
      showToast('Delete operation failed due to a network error.', 'error');
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleRestore = async (fileId) => {
    setActiveMenuId(null);
    try {
      const result = await restoreFileById(fileId);
      if (result && result.success) {
        showToast('Item restored to active drive successfully!', 'success');
      } else {
        showToast(result?.message || 'Restoration failed.', 'error');
      }
    } catch (err) {
      showToast('Restoration failed due to a network error.', 'error');
    }
  };

  const handleShare = async (file) => {
    setActiveMenuId(null);
    try {
      const result = await shareFileById(file._id);
      if (result && result.success) {
        toast.success('Share link generated');
        const frontendUrl = window.location.origin;
        const shareUrl = `${frontendUrl}/shared/${result.shareId}`;
        setShareModalFile(file);
        setShareModalUrl(shareUrl);
        setIsShareModalOpen(true);
      } else {
        toast.error(result?.message || 'Share failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Share failed');
    }
  };

  const handleCopyLink = async (file) => {
    setActiveMenuId(null);
    try {
      if (file.isShared && file.shareId) {
        const frontendUrl = window.location.origin;
        const shareUrl = `${frontendUrl}/shared/${file.shareId}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied successfully');
      } else {
        const result = await shareFileById(file._id);
        if (result && result.success) {
          toast.success('Share link generated');
          const frontendUrl = window.location.origin;
          const shareUrl = `${frontendUrl}/shared/${result.shareId}`;
          await navigator.clipboard.writeText(shareUrl);
          toast.success('Link copied successfully');
        } else {
          toast.error(result?.message || 'Share failed');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Share failed');
    }
  };

  // Filter virtual folders for My Drive active directory view
  const rootFolders = isRecentView || isStarredView || isBinView || isStorageView
    ? []
    : files.filter(f => f.type === 'folder' && f.isDeleted !== true);

  // Filter files based on navigation pathway
  const visibleFiles = files.filter(file => {
    if (file.type === 'folder' && !isBinView) return false;

    if (isBinView) {
      return file.isDeleted === true;
    }

    if (file.isDeleted === true) return false;

    if (isRecentView || isStorageView) {
      return true;
    }
    if (isStarredView) {
      return false; // Empty starred state as default
    }

    if (currentFolder === null) {
      return !file.relativePath || !file.relativePath.includes('/');
    } else {
      return file.relativePath && file.relativePath.startsWith(`${currentFolder}/`);
    }
  });

  const sortedFiles = isStorageView
    ? [...visibleFiles].sort((a, b) => b.size - a.size)
    : [...visibleFiles].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Storage metrics conversions
  const usedMB = (storageUsed / (1024 * 1024)).toFixed(1);
  const limitMB = (storageLimit / (1024 * 1024)).toFixed(0);
  const percentage = storageLimit > 0 ? (storageUsed / storageLimit) * 100 : 0;

  let progressBarColor = 'bg-blue-600';
  if (percentage > 90) {
    progressBarColor = 'bg-red-500';
  } else if (percentage > 75) {
    progressBarColor = 'bg-amber-500';
  }

  // 1. Sleek Skeleton loader markup to prevent layout shift
  const renderSkeletons = () => (
    <div className="px-6 space-y-6 animate-pulse">
      {/* Folder skeletons */}
      {currentFolder === null && !isRecentView && !isStarredView && !isBinView && !isStorageView && !isSharedLinksView && (
        <div>
          <div className="w-24 h-4 bg-slate-200 rounded-md mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="h-16 bg-slate-100 rounded-2xl border border-slate-200/50 skeleton-wave" />
            ))}
          </div>
        </div>
      )}

      {/* File skeletons */}
      <div>
        <div className="w-24 h-4 bg-slate-200 rounded-md mb-4" />
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(idx => (
              <div key={idx} className="h-44 bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 relative overflow-hidden skeleton-wave">
                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                <div className="w-2/3 h-4 bg-slate-200 rounded-md" />
                <div className="w-1/2 h-3 bg-slate-200 rounded-md" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map(idx => (
              <div key={idx} className="h-12 bg-slate-50 border-b border-slate-100 flex items-center justify-between px-3 relative overflow-hidden skeleton-wave">
                <div className="w-1/3 h-4 bg-slate-200 rounded-md" />
                <div className="w-20 h-4 bg-slate-200 rounded-md" />
                <div className="w-24 h-4 bg-slate-200 rounded-md" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-white flex flex-col h-[calc(100vh-61px)] md:h-[calc(100vh-61px)] pb-16 md:pb-0 overflow-hidden relative font-sans text-slate-800">
      
      {/* Top Breadcrumb & Controls bar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-slate-100 shrink-0 select-none">
        <div className="flex items-center text-slate-800 text-base font-semibold leading-none">
          {isRecentView ? (
            <div className="flex items-center space-x-2">
              <Clock size={18} className="text-blue-600 stroke-[2.2]" />
              <span className="text-slate-800">Recent Uploads</span>
            </div>
          ) : isStarredView ? (
            <div className="flex items-center space-x-2">
              <Star size={18} className="text-amber-500 fill-amber-400 stroke-[2]" />
              <span className="text-slate-800">Starred Files</span>
            </div>
          ) : isBinView ? (
            <div className="flex items-center space-x-2">
              <Trash2 size={18} className="text-slate-600 stroke-[2]" />
              <span className="text-slate-800">Bin Purge View</span>
            </div>
          ) : isStorageView ? (
            <div className="flex items-center space-x-2">
              <Cloud size={18} className="text-blue-600 stroke-[2]" />
              <span className="text-slate-800">Storage Overview</span>
            </div>
          ) : isSharedLinksView ? (
            <div className="flex items-center space-x-2">
              <Share2 size={18} className="text-blue-600 stroke-[2]" />
              <span className="text-slate-800">Shared Links</span>
            </div>
          ) : isSharedLinkView ? (
            <div className="flex items-center space-x-2">
              <Users size={18} className="text-blue-600 stroke-[2.2]" />
              <span className="text-slate-800">Shared Link</span>
            </div>
          ) : currentFolder === null ? (
            <span className="text-slate-800">My Drive</span>
          ) : (
            <div className="flex items-center text-sm font-bold">
              <button 
                onClick={() => setCurrentFolder(null)}
                className="text-blue-600 hover:text-blue-700 hover:underline transition-all cursor-pointer"
              >
                My Drive
              </button>
              <ChevronRight size={14} className="mx-1.5 text-slate-400 shrink-0" />
              <span className="text-slate-800 truncate max-w-[150px]">{currentFolder}</span>
            </div>
          )}
        </div>

        {/* List / Grid Toggle bar & details */}
        <div className="flex items-center space-x-2">
          {!isStorageView && !isSharedLinkView && !isSharedLinksView && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/50">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all active:scale-95 cursor-pointer ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                title="Grid view"
              >
                <LayoutGrid size={16} strokeWidth={2.2} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all active:scale-95 cursor-pointer ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                title="List view"
              >
                <List size={16} strokeWidth={2.2} />
              </button>
            </div>
          )}

          <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 active:scale-95 transition-all cursor-pointer">
            <Info size={18} strokeWidth={2} />
          </button>
        </div>
      </div>
      
      {/* Scrollable primary body space */}
      <div className="flex-1 overflow-y-auto py-4">
        {isSharedLinksView ? (
          <SharedLinksPage />
        ) : isSharedLinkView ? (
          <AnimatePresence mode="popLayout">
            <div className="px-4 md:px-6 overflow-x-auto pb-48">
              {loadingSharedLink ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-3 border-blue-150 border-t-blue-600 rounded-full animate-spin" />
                  <p className="text-xs font-semibold text-slate-500">Retrieving shared file details...</p>
                </div>
              ) : sharedLinkError ? (
                <div className="py-12 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3 font-sans">
                  <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 animate-pulse">
                    <AlertCircle size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Unable to view shared file</h3>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    {sharedLinkError}
                  </p>
                </div>
              ) : sharedLinkData ? (
                <>
                  <table className="w-full text-left border-collapse min-w-[700px] select-none font-sans">
                    <thead>
                      <tr className="border-b border-slate-200/60 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <th className="pb-3 pl-2">Name</th>
                        <th className="pb-3">Reason suggested</th>
                        <th className="pb-3">Owner</th>
                        <th className="pb-3">Location</th>
                        <th className="pb-3 text-right pr-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const file = sharedLinkData.file;
                        const owner = sharedLinkData.owner;
                        const downloadUrl = sharedLinkData.downloadUrl;
                        const IconComponent = getFileIcon(file.type);
                        const iconColor = getIconColorClass(file.type);
                        const backendUrl = `${import.meta.env.VITE_BACKEND_URL}${file.fileUrl}`;
                        
                        // Fallback avatar initial
                        const ownerInitial = owner.name ? owner.name.charAt(0).toUpperCase() : 'U';
                        
                        return (
                          <tr key={file._id} className={`hover:bg-slate-50/40 transition-colors group relative ${activeMenuId === file._id ? 'z-40' : 'z-auto'}`}>
                            {/* 1. Name: Icon, File Name, and SharedBadge */}
                            <td className="py-3 flex items-center space-x-3 pl-2">
                              <div className={`p-2 rounded-lg border shrink-0 ${iconColor}`}>
                                <IconComponent size={16} />
                              </div>
                              <span className="text-xs font-bold text-slate-700 truncate max-w-[285px]" title={file.fileName}>
                                {file.fileName}
                              </span>
                              <span 
                                className="inline-flex items-center justify-center p-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100/60 shadow-sm transition-all hover:scale-110 active:scale-95 group/badge relative shrink-0"
                                title="Shared publicly via link"
                              >
                                <Users size={11} strokeWidth={2.5} />
                                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover/badge:opacity-100 transition-opacity duration-200 bg-slate-900/95 backdrop-blur-[2px] text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-50 border border-slate-700/30">
                                  Shared publicly
                                </span>
                              </span>
                            </td>
  
                            {/* 2. Reason suggested: You opened • HH:MM */}
                            <td className="py-3 text-xs font-semibold text-slate-500">
                              You opened • {openedTime}
                            </td>
  
                            {/* 3. Owner: Colored circle badge with Owner Name */}
                            <td className="py-3 text-xs font-semibold text-slate-500">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 rounded-full bg-[#a82424] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {ownerInitial}
                                </div>
                                <span className="truncate max-w-[150px]" title={owner.name}>
                                  {owner.name || 'Unknown User'}
                                </span>
                              </div>
                            </td>
  
                            {/* 4. Location: Icon with Shared with... */}
                            <td className="py-3 text-xs font-semibold text-slate-500">
                              <div className="flex items-center space-x-2 text-slate-500">
                                <Users size={14} className="stroke-[2.2]" />
                                <span>Shared wi...</span>
                              </div>
                            </td>
  
                            {/* 5. Actions: Eye (preview), Download, and options dropdown */}
                            <td className={`py-3 text-right pr-4 relative ${activeMenuId === file._id ? 'z-50' : 'z-auto'}`}>
                              <div className="flex items-center justify-end space-x-1.5">
                                <a 
                                  href={backendUrl} target="_blank" rel="noopener noreferrer"
                                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 active:scale-95 transition-all"
                                  title="Preview file"
                                >
                                  <Eye size={16} />
                                </a>
                                <button 
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = `${backendUrl}?download=true`;
                                    link.setAttribute('download', file.fileName);
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 active:scale-95 transition-all cursor-pointer"
                                  title="Download file"
                                >
                                  <Download size={16} />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(activeMenuId === file._id ? null : file._id);
                                  }}
                                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 active:scale-95 transition-all cursor-pointer"
                                  title="More actions"
                                >
                                  <MoreVertical size={16} />
                                </button>
  
                                {/* Dropdown Floating Actions Menu */}
                                <AnimatePresence>
                                  {activeMenuId === file._id && (
                                    <>
                                      <div className="fixed inset-0 z-30" onClick={() => setActiveMenuId(null)} />
                                      <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="absolute right-4 top-10 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 w-40 text-left font-sans"
                                      >
                                        <a 
                                          href={backendUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          onClick={() => setActiveMenuId(null)}
                                          className="flex items-center space-x-2.5 px-3 py-1.5 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                                        >
                                          <Eye size={14} />
                                          <span>Preview</span>
                                        </a>
                                        <button 
                                          onClick={() => {
                                            setActiveMenuId(null);
                                            const link = document.createElement('a');
                                            link.href = `${backendUrl}?download=true`;
                                            link.setAttribute('download', file.fileName);
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                          }}
                                          className="w-full flex items-center space-x-2.5 px-3 py-1.5 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer text-left"
                                        >
                                          <Download size={14} />
                                          <span>Download</span>
                                        </button>
                                        <button 
                                          onClick={() => {
                                            setActiveMenuId(null);
                                            const shareUrl = `${window.location.origin}/shared/${file.shareId}`;
                                            navigator.clipboard.writeText(shareUrl);
                                            toast.success('Link copied successfully');
                                          }}
                                          className="w-full flex items-center space-x-2.5 px-3 py-1.5 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer text-left"
                                        >
                                          <Link2 size={14} />
                                          <span>Copy Link</span>
                                        </button>
                                      </motion.div>
                                    </>
                                  )}
                                </AnimatePresence>
                              </div>
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                  <div className="mt-4 pl-2 text-left">
                    <Link 
                      to="/drive"
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all cursor-pointer font-sans block w-fit"
                    >
                      View more
                    </Link>
                  </div>
                </>
              ) : null}
            </div>
          </AnimatePresence>
        ) : loadingDrive ? (
          renderSkeletons()
        ) : (
          <AnimatePresence mode="popLayout">
            
            {/* 2a. Starred Empty Card */}
            {isStarredView && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="h-[calc(100vh-240px)] flex flex-col items-center justify-center px-4 text-center font-sans"
              >
                <div className="p-5 rounded-full bg-amber-50 text-amber-500 mb-4 border border-amber-100 animate-bounce">
                  <Star size={44} className="fill-amber-400 stroke-[1.8]" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">No Starred files found</h3>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-semibold">
                  Starred items act as bookmarks for your most critical workflows.
                </p>
              </motion.div>
            )}

            {/* 2b. Bin Empty Card */}
            {isBinView && visibleFiles.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="h-[calc(100vh-240px)] flex flex-col items-center justify-center px-4 text-center font-sans"
              >
                <div className="p-5 rounded-full bg-slate-50 text-slate-400 mb-4 border border-slate-200/60">
                  <Trash2 size={44} strokeWidth={1.8} />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">Your bin is completely empty</h3>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-semibold">
                  Items you soft-delete will wait here before being permanently cleared from space.
                </p>
              </motion.div>
            )}

            {/* 2c. Recent Empty Card */}
            {isRecentView && sortedFiles.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="h-[calc(100vh-240px)] flex flex-col items-center justify-center px-4 text-center font-sans"
              >
                <div className="p-5 rounded-full bg-blue-50 text-blue-500 mb-4 border border-blue-100">
                  <Clock size={44} strokeWidth={1.8} />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">No uploads found</h3>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-semibold">
                  Start uploading using the sidebar new menus to build your active drive.
                </p>
              </motion.div>
            )}

            {/* 2d. Storage Page Dashboard overview */}
            {isStorageView && (
              <div className="px-4 md:px-6 mb-6">
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl filter animate-blob" />
                  
                  <div className="flex-1 relative z-10">
                    <div className="flex items-center space-x-3 mb-2.5">
                      <Cloud size={24} className="text-blue-500" />
                      <h2 className="text-lg font-bold uppercase tracking-wider">Storage space dashboard</h2>
                    </div>
                    <p className="text-xs text-slate-400 max-w-md leading-relaxed font-semibold mb-5">
                      Synchronized across uploads, directories, and virtual pathways.
                    </p>
                    
                    {/* Progress slider bar */}
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-3 shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, percentage)}%` }}
                        transition={{ ease: 'easeOut', duration: 0.8 }}
                        className={`${progressBarColor} h-full rounded-full`}
                      />
                    </div>
                    
                    <p className="text-sm font-bold text-slate-200">
                      {usedMB} MB of {limitMB} MB used ({percentage.toFixed(1)}%)
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 relative z-10">
                    <a 
                      href="#" onClick={(e) => e.preventDefault()}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider text-center transition-all hover:scale-[1.02] active:scale-[0.98] select-none cursor-pointer shadow-md shadow-blue-500/10"
                    >
                      Request Extension
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Folders Section Grid (My Drive root only) */}
            {!isSharedLinkView && currentFolder === null && rootFolders.length > 0 && (
              <div className="mb-6 font-sans">
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-4 md:px-6">
                  Folders
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 md:px-6">
                  {rootFolders.map((folder) => (
                    <motion.div 
                      key={folder._id}
                      layout
                      whileHover={{ y: -3, scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setCurrentFolder(folder.fileName)}
                      className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/50 rounded-2xl cursor-pointer transition-all shadow-sm group relative"
                    >
                      <div className="flex items-center space-x-3 truncate pl-0.5">
                        <div className="p-2 rounded-xl bg-amber-50 text-amber-500 border border-amber-100 shrink-0">
                          <Folder size={18} className="fill-amber-400 text-amber-500" />
                        </div>
                        <div className="truncate pr-2">
                          <p className="text-xs font-bold text-slate-800 truncate max-w-[120px]" title={folder.fileName}>
                            {folder.fileName}
                          </p>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">directory</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerDeleteConfirm(folder._id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-200/60 transition-all shrink-0 cursor-pointer"
                        title="Delete permanently"
                      >
                        <Trash2 size={15} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Files Section Grid or Table List */}
            {!isSharedLinkView && (!isStarredView && !isBinView && !(isRecentView && sortedFiles.length === 0) && !(isStorageView && sortedFiles.length === 0)) && (
              <div className="font-sans">
                {currentFolder === null && rootFolders.length > 0 && sortedFiles.length > 0 && (
                  <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-4 md:px-6">
                    Files
                  </h2>
                )}

                {sortedFiles.length > 0 ? (
                  viewMode === 'grid' ? (
                    
                    /* Grid File Cards View mode */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 px-4 md:px-6">
                      {sortedFiles.map((file) => {
                        const IconComponent = getFileIcon(file.type);
                        const iconColor = getIconColorClass(file.type);
                        const isImage = file.type.startsWith('image/');
                        const backendUrl = `${import.meta.env.VITE_BACKEND_URL}${file.fileUrl}`;
                        const displayName = currentFolder !== null && file.relativePath
                          ? file.relativePath.substring(file.relativePath.indexOf('/') + 1)
                          : file.relativePath || file.fileName;

                        return (
                          <motion.div 
                            key={file._id}
                            layout
                            whileHover={{ y: -4, boxShadow: '0 12px 24px -10px rgba(0,0,0,0.06)' }}
                            className={`bg-white border border-slate-200/80 rounded-2xl flex flex-col h-44 relative group transition-all ${activeMenuId === file._id ? 'z-50 overflow-visible' : 'z-10 overflow-hidden'}`}
                          >
                            {/* Card Top Preview section (Actual backend image previews!) */}
                            <div className="flex-1 bg-slate-50 flex items-center justify-center border-b border-slate-100 relative">
                              {isImage ? (
                                <img 
                                  src={backendUrl} 
                                  alt={file.fileName}
                                  className="w-full h-full object-cover select-none rounded-t-2xl"
                                  loading="lazy"
                                />
                              ) : (
                                <div className={`p-4 rounded-2xl border ${iconColor}`}>
                                  <IconComponent size={24} strokeWidth={2} />
                                </div>
                              )}

                              {/* Three dot context menu toggle */}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === file._id ? null : file._id);
                                }}
                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all active:scale-90 cursor-pointer z-10 border border-slate-200/20"
                              >
                                <MoreVertical size={15} />
                              </button>

                              {/* Dropdown Floating Actions Menu */}
                              <AnimatePresence>
                                {activeMenuId === file._id && (
                                  <>
                                    <div className="fixed inset-0 z-30" onClick={() => setActiveMenuId(null)} />
                                    <motion.div 
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.95 }}
                                      className="absolute right-2 top-10 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 w-40 text-left font-sans"
                                    >
                                      <a 
                                        href={backendUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        onClick={() => setActiveMenuId(null)}
                                        className="flex items-center space-x-2.5 px-3 py-1.5 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                                      >
                                        <Eye size={14} />
                                        <span>Preview</span>
                                      </a>
                                      <button 
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          const link = document.createElement('a');
                                          link.href = `${backendUrl}?download=true`;
                                          link.setAttribute('download', file.fileName);
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                        }}
                                        className="w-full flex items-center space-x-2.5 px-3 py-1.5 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                                      >
                                        <Download size={14} />
                                        <span>Download</span>
                                      </button>
                                      <button 
                                        onClick={() => handleShare(file)}
                                        className="w-full flex items-center space-x-2.5 px-3 py-1.5 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                                      >
                                        <Share2 size={14} />
                                        <span>Share</span>
                                      </button>
                                      <button 
                                        onClick={() => handleCopyLink(file)}
                                        className="w-full flex items-center space-x-2.5 px-3 py-1.5 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                                      >
                                        <Link2 size={14} />
                                        <span>Copy Link</span>
                                      </button>
                                      <div className="border-t border-slate-100 my-1" />
                                      <button 
                                        onClick={() => triggerDeleteConfirm(file._id)}
                                        className="w-full flex items-center space-x-2.5 px-3 py-1.5 hover:bg-rose-50 text-rose-600 text-xs font-semibold cursor-pointer"
                                      >
                                        <Trash2 size={14} />
                                        <span>Delete</span>
                                      </button>
                                    </motion.div>
                                  </>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Card Bottom Details section */}
                            <div className="p-3 select-none">
                              <div className="flex items-center space-x-1.5 justify-between">
                                <p className="text-xs font-bold text-slate-800 truncate flex-1 font-sans" title={file.fileName}>
                                  {displayName}
                                </p>
                                {file.isShared && <SharedBadge className="shrink-0" />}
                              </div>
                              <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                <span>{getFileTypeLabel(file.type)}</span>
                                <span>{formatBytes(file.size)}</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    
                    /* Detailed Tabular List View mode */
                    <div className="px-4 md:px-6 overflow-x-auto pb-48">
                      <table className="w-full text-left border-collapse min-w-[600px] select-none">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                            <th className="pb-3 pl-2">Name</th>
                            <th className="pb-3">Type</th>
                            <th className="pb-3">Size</th>
                            <th className="pb-3">Modified</th>
                            <th className="pb-3 text-right pr-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/80">
                          {sortedFiles.map((file) => {
                            const IconComponent = getFileIcon(file.type);
                            const iconColor = getIconColorClass(file.type);
                            const backendUrl = `${import.meta.env.VITE_BACKEND_URL}${file.fileUrl}`;
                            const displayName = currentFolder !== null && file.relativePath
                              ? file.relativePath.substring(file.relativePath.indexOf('/') + 1)
                              : file.relativePath || file.fileName;

                            return (
                              <tr key={file._id} className={`hover:bg-slate-50/70 transition-colors group relative ${activeMenuId === file._id ? 'z-40' : 'z-auto'}`}>
                                <td className="py-3 flex items-center space-x-3 pl-2">
                                  <div className={`p-2 rounded-lg border shrink-0 ${iconColor}`}>
                                    <IconComponent size={16} />
                                  </div>
                                  <span className="text-xs font-bold text-slate-700 truncate max-w-[285px]" title={file.fileName}>
                                    {displayName}
                                  </span>
                                  {file.isShared && <SharedBadge className="shrink-0" />}
                                </td>
                                <td className="py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                  {getFileTypeLabel(file.type)}
                                </td>
                                <td className="py-3 text-xs font-semibold text-slate-500">
                                  {formatBytes(file.size)}
                                </td>
                                <td className="py-3 text-xs font-semibold text-slate-500">
                                  {new Date(file.createdAt).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </td>
                                <td className={`py-3 text-right pr-4 relative ${activeMenuId === file._id ? 'z-50' : 'z-auto'}`}>
                                  <div className="flex items-center justify-end space-x-1.5">
                                    <a 
                                      href={backendUrl} target="_blank" rel="noopener noreferrer"
                                      className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 active:scale-95 transition-all"
                                      title="Preview file"
                                    >
                                      <Eye size={16} />
                                    </a>
                                    <button 
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = `${backendUrl}?download=true`;
                                        link.setAttribute('download', file.fileName);
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      }}
                                      className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 active:scale-95 transition-all cursor-pointer"
                                      title="Download file"
                                    >
                                      <Download size={16} />
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenuId(activeMenuId === file._id ? null : file._id);
                                      }}
                                      className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 active:scale-95 transition-all cursor-pointer"
                                      title="More actions"
                                    >
                                      <MoreVertical size={16} />
                                    </button>

                                    {/* Dropdown Floating Actions Menu */}
                                    <AnimatePresence>
                                      {activeMenuId === file._id && (
                                        <>
                                          <div className="fixed inset-0 z-30" onClick={() => setActiveMenuId(null)} />
                                          <motion.div 
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="absolute right-4 top-10 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 w-40 text-left font-sans"
                                          >
                                            <a 
                                              href={backendUrl} 
                                              target="_blank" 
                                              rel="noopener noreferrer" 
                                              onClick={() => setActiveMenuId(null)}
                                              className="flex items-center space-x-2.5 px-3 py-1.5 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                                            >
                                              <Eye size={14} />
                                              <span>Preview</span>
                                            </a>
                                            <button 
                                              onClick={() => {
                                                setActiveMenuId(null);
                                                const link = document.createElement('a');
                                                link.href = `${backendUrl}?download=true`;
                                                link.setAttribute('download', file.fileName);
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                              }}
                                              className="w-full flex items-center space-x-2.5 px-3 py-1.5 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                                            >
                                              <Download size={14} />
                                              <span>Download</span>
                                            </button>
                                            <button 
                                              onClick={() => handleShare(file)}
                                              className="w-full flex items-center space-x-2.5 px-3 py-1.5 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                                            >
                                              <Share2 size={14} />
                                              <span>Share</span>
                                            </button>
                                            <button 
                                              onClick={() => handleCopyLink(file)}
                                              className="w-full flex items-center space-x-2.5 px-3 py-1.5 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                                            >
                                              <Link2 size={14} />
                                              <span>Copy Link</span>
                                            </button>
                                            <div className="border-t border-slate-100 my-1" />
                                            <button 
                                              onClick={() => triggerDeleteConfirm(file._id)}
                                              className="w-full flex items-center space-x-2.5 px-3 py-1.5 hover:bg-rose-50 text-rose-600 text-xs font-semibold cursor-pointer"
                                            >
                                              <Trash2 size={14} />
                                              <span>Delete</span>
                                            </button>
                                          </motion.div>
                                        </>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  
                  /* Central directory folder Empty State */
                  (currentFolder !== null || rootFolders.length === 0) && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-[calc(100vh-240px)] flex flex-col items-center justify-center px-4 text-center font-sans"
                    >
                      <div className="relative w-40 h-40 mb-4 select-none">
                        <FolderOpen size={64} className="text-blue-100 stroke-[1.2] w-full h-full" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 mb-1">
                        {currentFolder === null ? 'Your drive is empty' : 'This folder is empty'}
                      </h3>
                      <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-semibold">
                        Use the 'New Action' menu in the sidebar to upload files instantly.
                      </p>
                    </motion.div>
                  )
                )}
              </div>
            )}

            {/* 5. Detailed Bin Active Listing View Mode */}
            {isBinView && visibleFiles.length > 0 && (
              <div className="px-4 md:px-6 overflow-x-auto font-sans">
                <table className="w-full text-left border-collapse min-w-[600px] select-none">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="pb-3 pl-2">Deleted Name</th>
                      <th className="pb-3">Size</th>
                      <th className="pb-3">Deleted Date</th>
                      <th className="pb-3 text-right pr-4">Bin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {visibleFiles.map((file) => {
                      const IconComponent = getFileIcon(file.type);
                      const iconColor = getIconColorClass(file.type);

                      return (
                        <tr key={file._id} className="hover:bg-slate-50/70 transition-colors group">
                          <td className="py-3 flex items-center space-x-3 pl-2">
                            <div className={`p-2 rounded-lg border shrink-0 ${iconColor}`}>
                              <IconComponent size={16} />
                            </div>
                            <span className="text-xs font-bold text-slate-700 truncate max-w-[280px]" title={file.fileName}>
                              {file.relativePath || file.fileName}
                            </span>
                          </td>
                          <td className="py-3 text-xs font-semibold text-slate-500">
                            {formatBytes(file.size)}
                          </td>
                          <td className="py-3 text-xs font-semibold text-slate-500">
                            {new Date(file.updatedAt || file.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="py-3 text-right pr-4">
                            <div className="flex items-center justify-end space-x-2.5">
                              <button 
                                onClick={() => handleRestore(file._id)}
                                className="p-1.5 rounded-xl text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 active:scale-95 transition-all cursor-pointer"
                                title="Restore item to drive"
                              >
                                <RotateCcw size={17} />
                              </button>
                              <button 
                                onClick={() => triggerDeleteConfirm(file._id)}
                                className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 active:scale-95 transition-all cursor-pointer"
                                title="Permanently delete item"
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </AnimatePresence>
        )}
      </div>

      {/* Sleek Confirmation Modal Popup */}
      <AnimatePresence>
        {deleteConfirmFile && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[1px] z-[99999] flex items-center justify-center font-sans">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmFile(null)}
              className="absolute inset-0"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative bg-white w-[350px] rounded-3xl p-6 shadow-2xl border border-slate-100 text-slate-800 z-10"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-4 animate-pulse">
                  <Trash2 size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2 font-sans">Delete Confirmation</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold mb-6 px-2">
                  {deleteConfirmFile.isDeleted || isBinView
                    ? `Are you sure you want to permanently delete "${deleteConfirmFile.fileName}"? This action cannot be undone.`
                    : `Move "${deleteConfirmFile.fileName}" to the bin? You can restore it later.`}
                </p>
              </div>
              <div className="flex justify-end space-x-3 text-xs font-bold uppercase tracking-wider">
                <button 
                  onClick={() => setDeleteConfirmFile(null)}
                  className="text-slate-500 hover:bg-slate-50 py-2.5 px-4 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="bg-rose-600 hover:bg-rose-500 text-white py-2.5 px-4 rounded-xl cursor-pointer shadow-md shadow-rose-500/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Background Deleting Loading Spinner */}
      <AnimatePresence>
        {deletingFileId && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-20 md:bottom-6 right-4 md:right-6 bg-slate-900 border border-slate-800 text-white px-4 py-3 rounded-2xl shadow-2xl z-[999] flex items-center space-x-3 text-xs font-semibold"
          >
            <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Deleting file from Cloud Storage...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal Component */}
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        file={shareModalFile} 
        shareUrl={shareModalUrl} 
      />
    </div>
  );
};

export default DashboardMainContent;
