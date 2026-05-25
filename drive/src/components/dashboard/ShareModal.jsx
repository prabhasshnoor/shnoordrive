// src/components/dashboard/ShareModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Download, Share2, Link, Check, File } from 'lucide-react';
import toast from 'react-hot-toast';

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
 * A sleek, high-fidelity modal that showcases the public link, includes quick-copy,
 * immediate download options, and matches Google Drive aesthetic with Framer Motion.
 */
const ShareModal = ({ isOpen, onClose, file, shareUrl }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !file) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied successfully');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
      toast.error('Failed to copy link');
    }
  };

  const handleDownload = () => {
    try {
      const backendUrl = `${import.meta.env.VITE_BACKEND_URL}${file.fileUrl}`;
      const downloadLink = `${backendUrl}?download=true`;
      
      const link = document.createElement('a');
      link.href = downloadLink;
      link.setAttribute('download', file.fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
    } catch (err) {
      console.error('Download trigger failed:', err);
      toast.error('Download failed');
    }
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
          className="fixed inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        />

        {/* Modal content box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
          className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100/80 text-slate-800 z-10 overflow-hidden font-sans"
        >
          {/* Top visual accents */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600" />

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/60">
                <Share2 size={18} strokeWidth={2.2} />
              </div>
              <h3 className="text-base font-bold text-slate-800">Share Public Link</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 active:scale-90 transition-all cursor-pointer border border-transparent hover:border-slate-200/50"
            >
              <X size={16} strokeWidth={2.2} />
            </button>
          </div>

          {/* File Card Info */}
          <div className="flex items-center p-3 bg-slate-50 border border-slate-150 rounded-2xl mb-5 space-x-3">
            <div className="p-2.5 bg-white border border-slate-200/60 rounded-xl text-slate-500 shrink-0 shadow-sm">
              <File size={20} className="text-slate-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate" title={file.fileName}>
                {file.fileName}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                {file.type ? file.type.split('/')[1] || file.type : 'File'} • {formatBytes(file.size)}
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs font-semibold text-slate-500 mb-2.5">
            Anyone on the internet with this link can view and download this file:
          </p>

          {/* Link display & action */}
          <div className="flex items-center bg-slate-50 border border-slate-200/80 rounded-2xl p-1.5 mb-6 focus-within:border-blue-500/50 transition-all">
            <div className="p-2 text-slate-400 shrink-0 pl-3">
              <Link size={14} />
            </div>
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full bg-transparent border-none outline-none text-xs text-slate-600 font-medium px-1 select-all"
            />
            <button
              onClick={handleCopy}
              className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all select-none cursor-pointer border shadow-sm ${
                copied 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                  : 'bg-white hover:bg-slate-50 text-blue-600 hover:text-blue-700 border-slate-200 active:scale-95'
              }`}
            >
              {copied ? (
                <>
                  <Check size={13} strokeWidth={2.5} />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={13} strokeWidth={2.2} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 text-xs font-bold uppercase tracking-wider">
            <button
              onClick={onClose}
              className="text-slate-500 hover:bg-slate-50 py-2.5 px-4 rounded-xl cursor-pointer transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white py-2.5 px-4 rounded-xl cursor-pointer shadow-md shadow-blue-500/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download size={14} strokeWidth={2.5} />
              <span>Download File</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ShareModal;
