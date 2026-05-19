import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Info, File, FileImage, FileVideo, FileText, Music, 
  Trash2, Eye, Download, Loader2, Folder, ChevronRight,
  Clock, Star, Trash, HardDrive, RotateCcw, Cloud
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDrive } from '../../context/DriveContext';

const formatBytes = (bytes, decimals = 1) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

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

const getIconColorClass = (mimeType) => {
  if (!mimeType) return 'text-slate-400 bg-slate-100';
  if (mimeType === 'folder') return 'text-amber-500 bg-amber-50';
  if (mimeType.startsWith('image/')) return 'text-blue-500 bg-blue-50';
  if (mimeType.startsWith('video/')) return 'text-purple-500 bg-purple-50';
  if (mimeType.startsWith('audio/')) return 'text-amber-500 bg-amber-50';
  if (mimeType.includes('pdf')) return 'text-red-500 bg-red-50';
  if (mimeType.includes('text/')) return 'text-emerald-500 bg-emerald-50';
  return 'text-slate-500 bg-slate-100';
};

const getFileTypeLabel = (mimeType) => {
  if (!mimeType) return 'Unknown file';
  if (mimeType === 'folder') return 'Folder';
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('video/')) return 'Video';
  if (mimeType.startsWith('audio/')) return 'Audio';
  if (mimeType.includes('pdf')) return 'PDF document';
  if (mimeType.includes('text/')) return 'Text document';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Spreadsheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'Presentation';
  return 'Document';
};

const DashboardMainContent = () => {
  const location = useLocation();
  const { files, loadingDrive, deleteFileById, restoreFileById, storageUsed, storageLimit } = useDrive();
  const [currentFolder, setCurrentFolder] = useState(null); // null = Root Drive, String = Folder name

  const isRecentView = location.pathname === '/drive/recent';
  const isStarredView = location.pathname === '/drive/starred';
  const isBinView = location.pathname === '/drive/bin';
  const isStorageView = location.pathname === '/drive/storage';

  const handleDelete = async (fileId) => {
    const file = files.find(f => f._id === fileId);
    const isPermanent = isBinView || (file && file.isDeleted);
    const confirmMsg = isPermanent
      ? 'Are you sure you want to delete this permanently? This action cannot be undone.'
      : 'Are you sure you want to move this item to the bin?';

    if (window.confirm(confirmMsg)) {
      await deleteFileById(fileId);
    }
  };

  const handleRestore = async (fileId) => {
    await restoreFileById(fileId);
  };

  // 1. Get virtual folders at root level (folders are always global virtual markers) - only for normal active drive view
  const rootFolders = isRecentView || isStarredView || isBinView || isStorageView
    ? []
    : files.filter(f => f.type === 'folder' && f.isDeleted !== true);

  // 2. Filter files based on navigation depth & active view
  const visibleFiles = files.filter(file => {
    // If it is a virtual folder reference, exclude it from main table list except in Bin view
    if (file.type === 'folder' && !isBinView) return false;

    if (isBinView) {
      // Bin view: show all items that are soft-deleted
      return file.isDeleted === true;
    }

    // Standard views: exclude soft-deleted items
    if (file.isDeleted === true) return false;

    if (isRecentView || isStorageView) {
      // Recent & Storage view: show all uploaded user files
      return true;
    }
    if (isStarredView) {
      // Starred: filter out everything for standard empty state
      return false;
    }

    if (currentFolder === null) {
      // Root level: show files that aren't inside any folder (no slashes in relativePath)
      return !file.relativePath || !file.relativePath.includes('/');
    } else {
      // Inside folder: show files that start with "currentFolder/"
      return file.relativePath && file.relativePath.startsWith(`${currentFolder}/`);
    }
  });

  // Sort files dynamically (Storage view is sorted by size descending, others chronologically)
  const sortedFiles = isStorageView
    ? [...visibleFiles].sort((a, b) => b.size - a.size)
    : [...visibleFiles].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Convert bytes to MB dynamically for calculations
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
    <div className="flex-1 bg-white flex flex-col h-[calc(100vh-65px)] overflow-hidden rounded-tl-2xl border-t border-l border-slate-200 mt-2 ml-2">
      {/* Header & Google Drive Breadcrumbs */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center text-slate-800 text-lg font-normal select-none">
          {isRecentView ? (
            <div className="flex items-center space-x-2">
              <Clock size={20} className="text-slate-600" />
              <span className="text-slate-800 font-semibold">Recent</span>
            </div>
          ) : isStarredView ? (
            <div className="flex items-center space-x-2">
              <Star size={20} className="text-amber-500 fill-amber-400" />
              <span className="text-slate-800 font-semibold">Starred</span>
            </div>
          ) : isBinView ? (
            <div className="flex items-center space-x-2">
              <Trash2 size={20} className="text-slate-600" />
              <span className="text-slate-800 font-semibold">Bin</span>
            </div>
          ) : isStorageView ? (
            <div className="flex items-center space-x-2">
              <HardDrive size={20} className="text-slate-600" />
              <span className="text-slate-800 font-semibold">Storage</span>
            </div>
          ) : currentFolder === null ? (
            <span className="text-slate-800 font-medium">My Drive</span>
          ) : (
            <div className="flex items-center text-sm font-medium">
              <button 
                onClick={() => setCurrentFolder(null)}
                className="text-slate-500 hover:text-slate-800 hover:underline transition-colors"
              >
                My Drive
              </button>
              <ChevronRight size={16} className="mx-2 text-slate-400" />
              <span className="text-slate-800 font-semibold">{currentFolder}</span>
            </div>
          )}
        </div>
        <button className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
          <Info size={20} />
        </button>
      </div>
      
      {/* Main Area */}
      <div className="flex-1 overflow-y-auto py-4">
        {loadingDrive ? (
          // Loading spinner
          <div className="h-full flex items-center justify-center flex-col space-y-3">
            <Loader2 size={36} className="text-blue-600 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Loading your files...</p>
          </div>
        ) : (
          <>
            {/* 1. Starred Empty State */}
            {/* 1. Starred Empty State */}
            {isStarredView && (
              <div className="h-[calc(100vh-220px)] flex flex-col items-center justify-center px-4 animate-fade-in-up">
                <div className="max-w-md w-full flex flex-col items-center text-center">
                  <div className="p-6 rounded-full bg-amber-50 text-amber-500 mb-6">
                    <Star size={64} className="fill-amber-400" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-700 mb-1">No starred files</h3>
                  <p className="text-sm text-slate-500 max-w-xs">
                    Stars help you easily find files and folders that are highly important to you.
                  </p>
                </div>
              </div>
            )}

            {/* 2. Bin Empty State */}
            {isBinView && (
              <div className="h-[calc(100vh-220px)] flex flex-col items-center justify-center px-4 animate-fade-in-up">
                <div className="max-w-md w-full flex flex-col items-center text-center">
                  <div className="p-6 rounded-full bg-slate-50 text-slate-400 mb-6">
                    <Trash2 size={64} className="text-slate-500" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-700 mb-1">Bin is empty</h3>
                  <p className="text-sm text-slate-500 max-w-xs">
                    Items you move to the bin will be preserved here before being permanently cleared.
                  </p>
                </div>
              </div>
            )}

            {/* 3. Recent Empty State */}
            {isRecentView && sortedFiles.length === 0 && (
              <div className="h-[calc(100vh-220px)] flex flex-col items-center justify-center px-4 animate-fade-in-up">
                <div className="max-w-md w-full flex flex-col items-center text-center">
                  <div className="p-6 rounded-full bg-blue-50 text-blue-500 mb-6">
                    <Clock size={64} className="text-blue-500" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-700 mb-1">No recent uploads</h3>
                  <p className="text-sm text-slate-500 max-w-xs">
                    Upload documents or images using the 'New' button to see them instantly tracked here.
                  </p>
                </div>
              </div>
            )}

            {/* 3b. Google Drive-style Storage Page Header Card & Progress */}
            {isStorageView && (
              <div className="px-6 mb-6 animate-fade-in-up">
                <div className="bg-slate-50/80 border border-slate-200/60 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Cloud size={24} className="text-blue-600 animate-pulse" />
                      <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Your cloud storage</h2>
                    </div>
                    <p className="text-sm text-slate-500 font-normal mb-5">
                      Storage is shared across Shnoor Drive uploads, pathway retention mappings, and virtual directories.
                    </p>
                    
                    {/* Horizontal Progress Bar */}
                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden mb-3.5 shadow-inner">
                      <div 
                        className={`${progressBarColor} h-full rounded-full transition-all duration-700 ease-out`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      ></div>
                    </div>
                    
                    <p className="text-[15px] font-semibold text-slate-700">
                      {usedMB} MB of {limitMB} MB used ({percentage.toFixed(1)}%)
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
                    <a 
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-semibold shadow-md shadow-blue-500/20 text-center transition-all hover:scale-[1.02] active:scale-[0.98] select-none"
                    >
                      Buy Storage
                    </a>
                    <a 
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full text-sm font-semibold text-center transition-all active:scale-[0.98] select-none"
                    >
                      Clean Up Space
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* 3c. Storage Empty State (No files take up space) */}
            {isStorageView && sortedFiles.length === 0 && (
              <div className="h-[calc(100vh-420px)] flex flex-col items-center justify-center px-4 animate-fade-in-up">
                <div className="max-w-md w-full flex flex-col items-center text-center">
                  <div className="p-6 rounded-full bg-blue-50 text-blue-500 mb-6">
                    <Cloud size={64} className="text-blue-500" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-700 mb-1">No files using storage</h3>
                  <p className="text-sm text-slate-500 max-w-xs">
                    Your active files will be listed here from largest to smallest once you upload them.
                  </p>
                </div>
              </div>
            )}

            {/* 4. Folders Section (Only visible at root My Drive level) */}
            {currentFolder === null && rootFolders.length > 0 && (
              <div className="mb-6 animate-fade-in-up">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-6">
                  Folders
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-6">
                  {rootFolders.map((folder) => (
                    <div 
                      key={folder._id}
                      onClick={() => setCurrentFolder(folder.fileName)}
                      className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 rounded-2xl cursor-pointer transition-all active:scale-[0.98] shadow-sm hover:shadow-md group"
                    >
                      <div className="flex items-center space-x-3.5 truncate">
                        <div className="p-2.5 rounded-xl bg-slate-200/60 text-slate-700 shrink-0">
                          {/* Solid Slate Folder Icon */}
                          <Folder size={18} className="fill-slate-600 text-slate-600" />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-semibold text-slate-800 truncate max-w-[130px]" title={folder.fileName}>
                            {folder.fileName}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">in My Drive</p>
                        </div>
                      </div>
                      
                      {/* Delete folder button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(folder._id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200/50 transition-colors shrink-0"
                        title="Delete folder permanently"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Files Section */}
            {(!isStarredView && !isBinView && !(isRecentView && sortedFiles.length === 0) && !(isStorageView && sortedFiles.length === 0)) && (
              <div className="animate-fade-in-up">
                {/* Show file subheader if at root and folders exist */}
                {currentFolder === null && rootFolders.length > 0 && sortedFiles.length > 0 && (
                  <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-6">
                    Files
                  </h2>
                )}

                {sortedFiles.length > 0 ? (
                  // Files list Table
                  <div className="px-6">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider select-none">
                          <th className="pb-3 font-semibold text-slate-500">Name</th>
                          {isStorageView && <th className="pb-3 font-semibold text-slate-500">Type</th>}
                          <th className="pb-3 font-semibold text-slate-500">{isStorageView ? 'Storage used' : 'Size'}</th>
                          <th className="pb-3 font-semibold text-slate-500">{isStorageView ? 'Modified' : 'Uploaded'}</th>
                          <th className="pb-3 font-semibold text-slate-500 text-right pr-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sortedFiles.map((file) => {
                          const IconComponent = getFileIcon(file.type);
                          const iconColor = getIconColorClass(file.type);
                          const backendUrl = `${import.meta.env.VITE_BACKEND_URL}${file.fileUrl}`;
                          
                          // Extract leaf name when deep in a folder view (e.g. "MyPhotos/logo.png" -> "logo.png")
                          const displayName = currentFolder !== null && file.relativePath
                            ? file.relativePath.substring(file.relativePath.indexOf('/') + 1)
                            : file.relativePath || file.fileName;

                          return (
                            <tr key={file._id} className="hover:bg-slate-50/80 transition-colors group">
                              {/* Name with Icon */}
                              <td className="py-3.5 flex items-center space-x-3">
                                <div className={`p-2 rounded-lg shrink-0 ${iconColor}`}>
                                  <IconComponent size={18} />
                                </div>
                                <span className="text-sm text-slate-700 font-medium truncate max-w-[340px]" title={file.relativePath || file.fileName}>
                                  {displayName}
                                </span>
                              </td>

                              {/* File Type (Storage View Only) */}
                              {isStorageView && (
                                <td className="py-3.5 text-sm text-slate-500 font-normal">
                                  {getFileTypeLabel(file.type)}
                                </td>
                              )}

                              {/* File Size */}
                              <td className="py-3.5 text-sm text-slate-500">
                                {formatBytes(file.size)}
                              </td>

                              {/* Upload Date */}
                              <td className="py-3.5 text-sm text-slate-500">
                                {new Date(file.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </td>

                              {/* Action buttons (Open/Delete or Restore/Permanent Delete) */}
                              <td className="py-3.5 text-right pr-4">
                                <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  
                                  {isBinView ? (
                                    <>
                                      {/* Restore Item */}
                                      <button 
                                        onClick={() => handleRestore(file._id)}
                                        title="Restore Item"
                                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all active:scale-95"
                                      >
                                        <RotateCcw size={16} />
                                      </button>

                                      {/* Delete Permanently */}
                                      <button 
                                        onClick={() => handleDelete(file._id)}
                                        title="Delete Permanently"
                                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      {/* Open/View File */}
                                      <a 
                                        href={backendUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        title="Preview File"
                                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all active:scale-95"
                                      >
                                        <Eye size={16} />
                                      </a>

                                      {/* Force Download File */}
                                      <a 
                                        href={`${backendUrl}?download=true`} 
                                        download={file.fileName} 
                                        title="Download File"
                                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all active:scale-95"
                                      >
                                        <Download size={16} />
                                      </a>

                                      {/* Delete File */}
                                      <button 
                                        onClick={() => handleDelete(file._id)}
                                        title="Delete permanently"
                                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </>
                                  )}

                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  // Empty State (Only shows if no folders AND no files exist in root, or no files in child folder)
                  (currentFolder !== null || rootFolders.length === 0) && (
                    <div className="h-[calc(100vh-220px)] flex flex-col items-center justify-center px-4 animate-fade-in">
                      <div className="max-w-md w-full flex flex-col items-center text-center">
                        <div className="relative w-48 h-48 mb-6">
                          <svg viewBox="0 0 200 200" className="w-full h-full" fill="none">
                            <path 
                              d="M40 55 L100 55 L115 85 L160 85 L160 145 L40 145 Z" 
                              fill="#eff6ff" 
                              stroke="#60a5fa" 
                              strokeWidth="5" 
                              strokeLinejoin="round" 
                            />
                          </svg>
                        </div>
                        
                        <h3 className="text-base font-semibold text-slate-700 mb-1">
                          {currentFolder === null ? 'Your drive is empty' : 'This folder is empty'}
                        </h3>
                        
                        <p className="text-sm text-slate-500 max-w-xs">
                          Use the 'New' button in the sidebar to upload files instantly.
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardMainContent;
