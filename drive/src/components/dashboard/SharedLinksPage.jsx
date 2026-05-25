// src/components/dashboard/SharedLinksPage.jsx
// Premium component representing the "Shared Links" view in the dashboard.
// Displays all files shared by the user with copy link, unshare, preview, and download capabilities.

import React, { useState, useEffect } from 'react';
import { useDrive } from '../../context/DriveContext';
import { 
  Share2, Eye, Download, Link2, MoreVertical, Trash2, Copy, Check,
  File, FileImage, FileVideo, FileText, Music, Folder
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SharedBadge from './SharedBadge';
import toast from 'react-hot-toast';

// Convert raw byte sizes into human readable formats
const formatBytes = (bytes, decimals = 1) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Returns the matching Lucide icon based on the file's mime type
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

// Returns corresponding Tailwind color badges for individual file types
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

const SharedLinksPage = () => {
  const { sharedLinks, unshareFileById, loadingDrive, fetchDriveData } = useDrive();
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Fetch shared links on mount to keep UI synchronized in real-time
  useEffect(() => {
    fetchDriveData();
  }, []);

  // Copy share URL to clipboard
  const handleCopyLink = async (e, shareId, fileId) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/shared/${shareId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(fileId);
      toast.success('Link copied successfully');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
      toast.error('Failed to copy link');
    }
  };

  // Perform unsharing action
  const handleUnshare = async (fileId) => {
    setActiveMenuId(null);
    try {
      const result = await unshareFileById(fileId);
      if (result.success) {
        toast.success('Shared file removed');
      } else {
        toast.error(result.message || 'Failed to remove share');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove share');
    }
  };

  if (loadingDrive && sharedLinks.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-blue-150 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Retrieving shared links...</p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 font-sans">
      <AnimatePresence mode="wait">
        {sharedLinks.length === 0 ? (
          <motion.div 
            key="empty-state"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="h-[calc(100vh-240px)] flex flex-col items-center justify-center text-center px-4"
          >
            <div className="p-5 rounded-full bg-blue-50 text-blue-500 mb-4 border border-blue-100/60 shadow-inner">
              <Share2 size={44} strokeWidth={1.8} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">No shared links yet</h3>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-semibold">
              Files you share publicly via link will appear here. Start sharing from My Drive to see them.
            </p>
          </motion.div>
        ) : (
          <motion.div 
            key="shared-links-table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="overflow-x-auto pb-48"
          >
            {/* Desktop Table View */}
            <table className="w-full text-left border-collapse min-w-[850px] select-none font-sans">
              <thead>
                <tr className="border-b border-slate-200/60 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="pb-3 pl-2">Name</th>
                  <th className="pb-3">Shared Date</th>
                  <th className="pb-3">Owner</th>
                  <th className="pb-3">Shared Link</th>
                  <th className="pb-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {sharedLinks.map((file) => {
                  const IconComponent = getFileIcon(file.type);
                  const iconColor = getIconColorClass(file.type);
                  const backendUrl = `${import.meta.env.VITE_BACKEND_URL}${file.fileUrl}`;
                  const shareUrl = `${window.location.origin}/shared/${file.shareId}`;
                  const owner = file.owner || { name: 'Unknown User', email: '', avatar: null };
                  const ownerInitial = owner.name ? owner.name.charAt(0).toUpperCase() : 'U';

                  return (
                    <tr 
                      key={file._id} 
                      className={`hover:bg-slate-50/70 transition-colors group relative ${activeMenuId === file._id ? 'z-40' : 'z-auto'}`}
                    >
                      {/* 1. Name Column */}
                      <td className="py-3 flex items-center space-x-3 pl-2">
                        <div className={`p-2 rounded-lg border shrink-0 ${iconColor}`}>
                          <IconComponent size={16} />
                        </div>
                        <div className="flex flex-col truncate max-w-[250px]">
                          <span className="text-xs font-bold text-slate-700 truncate" title={file.fileName}>
                            {file.fileName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                            {formatBytes(file.size)}
                          </span>
                        </div>
                        <SharedBadge className="shrink-0" />
                      </td>

                      {/* 2. Shared Date Column */}
                      <td className="py-3 text-xs font-semibold text-slate-500">
                        {file.sharedAt ? new Date(file.sharedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : 'N/A'}
                      </td>

                      {/* 3. Owner Column */}
                      <td className="py-3">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm border border-white"
                            style={{
                              backgroundColor: owner.name 
                                ? `hsl(${(owner.name.charCodeAt(0) * 12) % 360}, 65%, 45%)` 
                                : '#3b82f6'
                            }}
                          >
                            {owner.avatar ? (
                              <img src={owner.avatar} alt={owner.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              ownerInitial
                            )}
                          </div>
                          <div className="flex flex-col truncate max-w-[130px]">
                            <span className="text-xs font-bold text-slate-700 truncate leading-tight">
                              {owner.name}
                            </span>
                            <span className="text-[9px] text-slate-400 font-semibold truncate leading-none">
                              {owner.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 4. Shared Link Column */}
                      <td className="py-3 max-w-[200px]">
                        <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200/50 rounded-lg p-1.5 max-w-[220px]">
                          <span className="text-[10px] font-semibold text-slate-500 truncate flex-1 select-all" title={shareUrl}>
                            {shareUrl}
                          </span>
                          <button 
                            onClick={(e) => handleCopyLink(e, file.shareId, file._id)}
                            className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-white active:scale-90 transition-all cursor-pointer shadow-sm border border-transparent hover:border-slate-100"
                            title="Copy public link"
                          >
                            {copiedId === file._id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>

                      {/* 5. Actions Column */}
                      <td className={`py-3 text-right pr-4 relative ${activeMenuId === file._id ? 'z-50' : 'z-auto'}`}>
                        <div className="flex items-center justify-end space-x-1.5">
                          <a 
                            href={backendUrl} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:scale-95 transition-all"
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
                            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:scale-95 transition-all cursor-pointer"
                            title="Download file"
                          >
                            <Download size={16} />
                          </button>

                          <button 
                            onClick={(e) => handleCopyLink(e, file.shareId, file._id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:scale-95 transition-all cursor-pointer"
                            title="Copy link"
                          >
                            {copiedId === file._id ? <Check size={16} className="text-emerald-500" /> : <Link2 size={16} />}
                          </button>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === file._id ? null : file._id);
                            }}
                            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:scale-95 transition-all cursor-pointer"
                            title="More options"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {/* Dropdown Options popover */}
                          <AnimatePresence>
                            {activeMenuId === file._id && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setActiveMenuId(null)} />
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className="absolute right-4 top-10 bg-white border border-slate-200/80 rounded-2xl shadow-2xl z-50 py-1.5 w-44 text-left font-sans"
                                >
                                  <a 
                                    href={backendUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    onClick={() => setActiveMenuId(null)}
                                    className="flex items-center space-x-2.5 px-3.5 py-2 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                                  >
                                    <Eye size={14} className="text-slate-400" />
                                    <span>Preview Item</span>
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
                                    className="w-full flex items-center space-x-2.5 px-3.5 py-2 hover:bg-slate-50 text-slate-700 text-xs font-semibold text-left cursor-pointer"
                                  >
                                    <Download size={14} className="text-slate-400" />
                                    <span>Download</span>
                                  </button>

                                  <button 
                                    onClick={(e) => handleCopyLink(e, file.shareId, file._id)}
                                    className="w-full flex items-center space-x-2.5 px-3.5 py-2 hover:bg-slate-50 text-slate-700 text-xs font-semibold text-left cursor-pointer"
                                  >
                                    <Link2 size={14} className="text-slate-400" />
                                    <span>Copy Share Link</span>
                                  </button>

                                  <div className="border-t border-slate-100 my-1" />

                                  <button 
                                    onClick={() => handleUnshare(file._id)}
                                    className="w-full flex items-center space-x-2.5 px-3.5 py-2 hover:bg-rose-50 text-rose-600 text-xs font-bold text-left cursor-pointer"
                                  >
                                    <Trash2 size={14} className="text-rose-500" />
                                    <span>Remove Share</span>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SharedLinksPage;
