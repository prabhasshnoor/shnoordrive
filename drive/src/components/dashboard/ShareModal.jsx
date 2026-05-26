
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Copy, Download, Share2, Link, Check, File, 
  Eye, MoreHorizontal, Globe, Lock, Trash2, Info 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDrive } from '../../context/DriveContext';

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
 * ShareModal component
 * A premium, high-fidelity SaaS-style dropdown share menu UI matching Notion/iCloud/Google Drive.
 * Includes interactive tooltips, access states (Public/Private), and three-dot dropdown action lists.
 */
const ShareModal = ({ isOpen, onClose, file, shareUrl }) => {
  const { shareFileById } = useDrive();
  const [copied, setCopied] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [accessType, setAccessType] = useState(file?.visibility || 'public'); // 'public' or 'private'
  const [hoveredOption, setHoveredOption] = useState(null); // 'public', 'private', or null for active tooltip info

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && file) {
      setIsMoreOpen(false);
      setAccessType(file.visibility || 'public');
    }
  }, [isOpen, file]);

  if (!isOpen || !file) return null;

  const handleAccessChange = async (type) => {
    setAccessType(type);
    try {
      const result = await shareFileById(file._id, type);
      if (result && result.success) {
        toast.success(`Access mode updated to ${type}`);
      } else {
        toast.error(result.message || 'Failed to update access mode');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update access mode');
    }
  };

  const backendUrl = `${import.meta.env.VITE_BACKEND_URL}${file.fileUrl}`;
  const downloadLink = `${backendUrl}?download=true`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied successfully');
      setTimeout(() => setCopied(false), 2000);
      setIsMoreOpen(false);
    } catch (err) {
      console.error('Failed to copy text:', err);
      toast.error('Failed to copy link');
    }
  };

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = downloadLink;
      link.setAttribute('download', file.fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
      setIsMoreOpen(false);
    } catch (err) {
      console.error('Download trigger failed:', err);
      toast.error('Download failed');
    }
  };

  const handlePreview = () => {
    window.open(backendUrl, '_blank');
    setIsMoreOpen(false);
  };

  const handleRemoveShare = () => {
    toast.error('Share access revoked successfully');
    onClose();
  };

  // Determine active description for side tooltip
  const getTooltipText = () => {
    const target = hoveredOption || accessType;
    if (target === 'public') {
      return "Direct link sharing enabled. Anyone with the link can view.";
    }
    return "Others need to request access. Only approved users can view.";
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/20 backdrop-blur-[1px]"
        />

        {/* Outer Modal Container with Relative Side Tooltip Placement */}
        <div className="relative flex items-center gap-4 z-10 w-full max-w-lg justify-center">
          
          {/* Main Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.1 }}
            className="relative bg-white w-full max-w-[380px] rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-slate-800 overflow-visible font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-50">
              <span className="text-[13px] font-bold text-slate-700">Share Settings</span>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={15} strokeWidth={2.2} />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-4 space-y-4">
              
              {/* File Info & Top Action Icons */}
              <div className="flex items-center justify-between bg-slate-50/50 border border-slate-100 rounded-xl p-3">
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <div className="p-2 bg-white border border-slate-100 rounded-lg text-slate-400 shadow-sm shrink-0">
                    <File size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 truncate" title={file.fileName}>
                      {file.fileName}
                    </p>
                    <p className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                </div>

                {/* Action Icons Panel */}
                <div className="flex items-center space-x-1 relative">
                  <button
                    onClick={handlePreview}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Preview Item"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Download"
                  >
                    <Download size={15} />
                  </button>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Copy Link"
                  >
                    {copied ? <Check size={15} className="text-emerald-500" /> : <Link size={15} />}
                  </button>
                  <button
                    onClick={() => setIsMoreOpen(!isMoreOpen)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isMoreOpen ? 'bg-slate-100 text-slate-850' : 'hover:bg-slate-100 text-slate-500'}`}
                    title="More Options"
                  >
                    <MoreHorizontal size={15} />
                  </button>

                  {/* 3-Dots Floating Dropdown Menu */}
                  <AnimatePresence>
                    {isMoreOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsMoreOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 5 }}
                          className="absolute right-0 top-9 bg-white border border-slate-100 rounded-xl shadow-lg z-50 py-1 w-40 text-left"
                        >
                          <button
                            onClick={handlePreview}
                            className="w-full flex items-center space-x-2.5 px-3 py-2 hover:bg-slate-50 text-slate-700 text-[11px] font-bold text-left cursor-pointer"
                          >
                            <Eye size={13} className="text-slate-400" />
                            <span>Preview Item</span>
                          </button>
                          <button
                            onClick={handleDownload}
                            className="w-full flex items-center space-x-2.5 px-3 py-2 hover:bg-slate-50 text-slate-700 text-[11px] font-bold text-left cursor-pointer"
                          >
                            <Download size={13} className="text-slate-400" />
                            <span>Download</span>
                          </button>
                          <button
                            onClick={handleCopy}
                            className="w-full flex items-center space-x-2.5 px-3 py-2 hover:bg-slate-50 text-slate-700 text-[11px] font-bold text-left cursor-pointer"
                          >
                            <Link size={13} className="text-slate-400" />
                            <span>Copy Share Link</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Share Access Section */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Share Access</span>
                  <div className="h-[1px] bg-slate-100 flex-1" />
                </div>

                <div className="space-y-1.5">
                  {/* Public Option Card */}
                  <div
                    onClick={() => handleAccessChange('public')}
                    onMouseEnter={() => setHoveredOption('public')}
                    onMouseLeave={() => setHoveredOption(null)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      accessType === 'public'
                        ? 'border-blue-500 bg-blue-50/20 shadow-sm shadow-blue-500/5'
                        : 'border-slate-100 hover:border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg border shrink-0 ${accessType === 'public' ? 'bg-blue-50/80 border-blue-100 text-blue-500' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                        <Globe size={15} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-800">Public</p>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Anyone with the link can view</p>
                      </div>
                    </div>
                    {accessType === 'public' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white ring-1 ring-blue-500" />
                    )}
                  </div>

                  {/* Private Option Card */}
                  <div
                    onClick={() => handleAccessChange('private')}
                    onMouseEnter={() => setHoveredOption('private')}
                    onMouseLeave={() => setHoveredOption(null)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      accessType === 'private'
                        ? 'border-blue-500 bg-blue-50/20 shadow-sm shadow-blue-500/5'
                        : 'border-slate-100 hover:border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg border shrink-0 ${accessType === 'private' ? 'bg-blue-50/80 border-blue-100 text-blue-500' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                        <Lock size={15} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-800">Private</p>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Request access from owner</p>
                      </div>
                    </div>
                    {accessType === 'private' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white ring-1 ring-blue-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Link URL preview if Public */}
              <AnimatePresence>
                {accessType === 'public' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl p-1.5">
                      <span className="text-[10px] text-slate-400 truncate flex-1 pl-2.5 select-all" title={shareUrl}>
                        {shareUrl}
                      </span>
                      <button
                        onClick={handleCopy}
                        className="py-1 px-3 rounded-lg bg-white border border-slate-100 text-slate-600 hover:text-slate-800 text-[10px] font-bold uppercase tracking-wider transition-all select-none shadow-sm cursor-pointer active:scale-95 shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Actions Area */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-50 bg-slate-50/20 rounded-b-2xl">
              <button
                onClick={handleRemoveShare}
                className="flex items-center space-x-1.5 py-2 px-3 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-600 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Remove Share</span>
              </button>

              <button
                onClick={onClose}
                className="py-2 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm shadow-slate-900/10"
              >
                Done
              </button>
            </div>
          </motion.div>

          {/* Dynamic Side Tooltip Panel (Visible on screen size desktop/tablet) */}
          <motion.div
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="hidden md:flex items-start space-x-2.5 bg-slate-900 border border-slate-800 text-slate-100 p-3.5 rounded-xl shadow-xl w-48 text-left shrink-0 self-start mt-20"
          >
            <Info size={14} className="text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Access Mode</p>
              <p className="text-[11px] text-slate-200 font-medium leading-relaxed mt-1">
                {getTooltipText()}
              </p>
            </div>
          </motion.div>

        </div>
      </div>
    </AnimatePresence>
  );
};

export default ShareModal;
