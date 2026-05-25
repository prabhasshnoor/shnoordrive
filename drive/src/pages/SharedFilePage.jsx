// src/pages/SharedFilePage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Download, File, FileImage, FileVideo, FileText, Music, 
  AlertCircle, Cloud, ArrowLeft, Eye, Share2, Calendar, HardDrive 
} from 'lucide-react';
import { motion } from 'framer-motion';

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
 * Returns matching Lucide icon based on the mime type.
 */
const getFileIcon = (mimeType) => {
  if (!mimeType) return File;
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.startsWith('video/')) return FileVideo;
  if (mimeType.startsWith('audio/')) return Music;
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('text/')) return FileText;
  return File;
};

const getIconColorClass = (mimeType) => {
  if (!mimeType) return 'text-slate-400 bg-slate-100 border-slate-200';
  if (mimeType.startsWith('image/')) return 'text-blue-500 bg-blue-50 border-blue-100';
  if (mimeType.startsWith('video/')) return 'text-purple-500 bg-purple-50 border-purple-100';
  if (mimeType.startsWith('audio/')) return 'text-amber-500 bg-amber-50 border-amber-100';
  if (mimeType.includes('pdf')) return 'text-red-500 bg-red-50 border-red-100';
  if (mimeType.includes('text/')) return 'text-emerald-500 bg-emerald-50 border-emerald-100';
  return 'text-slate-500 bg-slate-50 border-slate-200';
};

const getFileTypeLabel = (mimeType) => {
  if (!mimeType) return 'Unknown file';
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType.startsWith('video/')) return 'Video';
  if (mimeType.startsWith('audio/')) return 'Audio';
  if (mimeType.includes('pdf')) return 'PDF Document';
  if (mimeType.includes('text/')) return 'Text Document';
  return 'Document';
};

/**
 * SharedFilePage component
 * Google Drive inspired public shared preview page.
 * Loads shared file metadata, displays rich media previews (image, video, PDF)
 * and enables direct downloading.
 */
const SharedFilePage = () => {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sharedData, setSharedData] = useState(null);

  useEffect(() => {
    // If logged in, redirect to dashboard shared link view
    const token = localStorage.getItem('token') || JSON.parse(localStorage.getItem('user') || '{}')?.token;
    if (token && shareId) {
      navigate(`/drive/shared/${shareId}`);
    }
  }, [shareId, navigate]);

  useEffect(() => {
    const fetchSharedFile = async () => {
      setLoading(true);
      setError(null);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        // Make standard public GET request without authentication headers
        const response = await axios.get(`${baseUrl}/shared/${shareId}`);
        if (response.data.success) {
          setSharedData(response.data);
        } else {
          setError(response.data.message || 'Unable to load shared file.');
        }
      } catch (err) {
        console.error('Fetch shared file failed:', err);
        const status = err.response?.status;
        const msg = err.response?.data?.message;
        
        if (status === 404) {
          setError('This file is not shared or the link is invalid.');
        } else if (status === 400) {
          setError('Invalid shared link format.');
        } else {
          setError(msg || 'An error occurred while loading the shared file.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      fetchSharedFile();
    }
  }, [shareId]);

  const handleDownload = () => {
    if (!sharedData?.downloadUrl || !sharedData?.file) return;
    try {
      const link = document.createElement('a');
      link.href = `${sharedData.downloadUrl}?download=true`;
      link.setAttribute('download', sharedData.file.fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  // Render Spinner Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-150 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">Loading Shared File...</p>
        </div>
      </div>
    );
  }

  // Render 404 / Error State
  if (error || !sharedData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200/80 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-5 animate-pulse">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Item Unavailable</h2>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed mb-6">
            {error || 'This file is not shared or the link is invalid. Please contact the owner for a correct link.'}
          </p>
          <div className="flex flex-col w-full gap-3">
            <Link 
              to="/login"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider text-center transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-blue-500/10"
            >
              Sign In to ShnoorDrive
            </Link>
            <Link 
              to="/"
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider py-1.5"
            >
              Go to Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const { file, owner, downloadUrl } = sharedData;
  const IconComponent = getFileIcon(file.type);
  const iconColor = getIconColorClass(file.type);
  const backendUrl = `${import.meta.env.VITE_BACKEND_URL}${file.fileUrl}`;

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const isPDF = file.type.includes('pdf');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Sleek Minimal Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center space-x-3 select-none">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold text-base">
            S
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-800">ShnoorDrive</span>
        </div>
        <Link 
          to="/login"
          className="flex items-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/60 px-3.5 py-2 rounded-xl transition-all active:scale-95 border border-blue-100/60"
        >
          <ArrowLeft size={13} />
          <span>Access My Drive</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-6">
        
        {/* Left Section: File Previewer */}
        <section className="flex-1 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex flex-col min-w-0">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3.5 flex items-center space-x-1.5">
            <Eye size={13} />
            <span>Document Preview</span>
          </h2>
          
          <div className="flex-1 min-h-[350px] md:min-h-[450px] bg-slate-50 border border-slate-150 rounded-2xl overflow-hidden flex items-center justify-center relative">
            {isImage ? (
              <img 
                src={backendUrl} 
                alt={file.fileName}
                className="max-w-full max-h-[420px] md:max-h-[520px] object-contain select-none"
              />
            ) : isVideo ? (
              <video 
                src={backendUrl} 
                controls 
                className="w-full h-full max-h-[450px] md:max-h-[550px] bg-black focus:outline-none"
              />
            ) : isPDF ? (
              <iframe 
                src={`${backendUrl}#toolbar=0`} 
                title={file.fileName}
                className="w-full h-full min-h-[420px] md:min-h-[520px] border-none"
              />
            ) : (
              // General Document Fallback Card
              <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm">
                <div className={`p-5 rounded-2xl border mb-4 shadow-sm ${iconColor}`}>
                  <IconComponent size={40} strokeWidth={2} />
                </div>
                <h3 className="text-sm font-bold text-slate-800 truncate w-full max-w-[250px] mb-1" title={file.fileName}>
                  {file.fileName}
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-5">
                  {getFileTypeLabel(file.type)} • {formatBytes(file.size)}
                </p>
                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider py-3 px-5 rounded-xl transition-all shadow-md shadow-blue-500/10 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Download size={14} strokeWidth={2.5} />
                  <span>Download File</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Right Section: Owner & Metadata info */}
        <section className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
          
          {/* Owner details card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3.5 flex items-center space-x-1.5">
              <Share2 size={13} />
              <span>Shared By</span>
            </h2>
            <div className="flex items-center space-x-3.5 select-none">
              {owner.avatar ? (
                <img 
                  src={owner.avatar} 
                  alt={owner.name} 
                  className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-md shadow-blue-500/15">
                  {owner.name ? owner.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {owner.name || 'Unknown User'}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase mt-0.5">
                  Cloud Storage Owner
                </p>
              </div>
            </div>
          </div>

          {/* File specifications card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex-1 flex flex-col justify-between gap-6">
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                File Details
              </h2>
              
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <div className="p-1.5 text-slate-400 shrink-0">
                    <File size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">File Name</p>
                    <p className="text-xs font-semibold text-slate-700 break-words mt-0.5">
                      {file.fileName}
                    </p>
                  </div>
                </li>

                <li className="flex items-start space-x-3">
                  <div className="p-1.5 text-slate-400 shrink-0">
                    <HardDrive size={15} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">File Size</p>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                </li>

                <li className="flex items-start space-x-3">
                  <div className="p-1.5 text-slate-400 shrink-0">
                    <Calendar size={15} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Upload Date</p>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">
                      {new Date(file.createdAt).toLocaleDateString(undefined, {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Quick Actions (only downloads needed) */}
            <div className="pt-5 border-t border-slate-100 flex flex-col gap-3">
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition-all shadow-md shadow-blue-500/10 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Download size={14} strokeWidth={2.5} />
                <span>Download Now</span>
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* Footer Info */}
      <footer className="bg-white border-t border-slate-100 py-4 px-6 text-center text-[10px] font-semibold text-slate-400 uppercase tracking-widest shrink-0">
        © 2026 ShnoorDrive Inc. • Protected by end-to-end security
      </footer>
    </div>
  );
};

export default SharedFilePage;
