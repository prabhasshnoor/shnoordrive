// src/components/dashboard/AccessRequestsPage.jsx
import React, { useEffect, useState } from 'react';
import { useDrive } from '../../context/DriveContext';
import { 
  UserCheck, Check, X, Shield, File, Mail, MessageSquare, 
  Calendar, CheckCircle, ShieldAlert, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AccessRequestsPage = () => {
  const { 
    accessRequests, loadingAccessRequests, fetchAccessRequests, 
    approveRequest, rejectRequest 
  } = useDrive();

  const [processingId, setProcessingId] = useState(null);

  // Fetch pending requests on mount
  useEffect(() => {
    fetchAccessRequests();
  }, []);

  const handleApprove = async (id) => {
    setProcessingId(id);
    const res = await approveRequest(id);
    if (res.success) {
      toast.success('Request approved successfully!');
    }
    setProcessingId(null);
  };

  const handleReject = async (id) => {
    setProcessingId(id);
    const res = await rejectRequest(id);
    if (res.success) {
      toast.success('Request rejected.');
    }
    setProcessingId(null);
  };

  if (loadingAccessRequests && accessRequests.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-3 font-sans">
        <div className="w-8 h-8 border-3 border-blue-150 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Retrieving access requests...</p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 font-sans">
      <AnimatePresence mode="wait">
        {accessRequests.length === 0 ? (
          <motion.div 
            key="empty-requests"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="h-[calc(100vh-240px)] flex flex-col items-center justify-center text-center px-4"
          >
            <div className="p-5 rounded-full bg-blue-50 text-blue-500 mb-4 border border-blue-100/60 shadow-inner">
              <UserCheck size={44} strokeWidth={1.8} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">No pending requests</h3>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-semibold">
              When users request access to your private files, their requests will appear here for your review.
            </p>
          </motion.div>
        ) : (
          <motion.div 
            key="requests-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4 max-w-4xl pb-48"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accessRequests.map((req) => {
                const requester = req.requesterId || { name: 'Unknown User', email: '', avatar: null };
                const file = req.fileId || { fileName: 'Deleted File', size: 0, type: '' };
                const requesterInitial = requester.name ? requester.name.charAt(0).toUpperCase() : 'U';
                const formattedDate = new Date(req.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <motion.div
                    key={req._id}
                    layout
                    whileHover={{ y: -2, boxShadow: '0 8px 30px rgb(0,0,0,0.03)' }}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative transition-all"
                  >
                    {/* Top Section: Requester Info & Role Tag */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {requester.avatar ? (
                          <img src={requester.avatar} alt={requester.name} className="w-10 h-10 rounded-full border object-cover" />
                        ) : (
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                            style={{
                              backgroundColor: requester.name 
                                ? `hsl(${(requester.name.charCodeAt(0) * 12) % 360}, 65%, 45%)` 
                                : '#3b82f6'
                            }}
                          >
                            {requesterInitial}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 truncate max-w-[180px]">{requester.name}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold truncate max-w-[180px] mt-0.5 flex items-center">
                            <Mail size={10} className="mr-1 inline shrink-0" />
                            <span>{requester.email}</span>
                          </p>
                        </div>
                      </div>

                      {/* Requested Role Badge */}
                      <span className="text-[9px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100/60 px-2 py-0.5 rounded-md">
                        {req.requestedRole}
                      </span>
                    </div>

                    {/* Middle Section: File Requested & Optional Message */}
                    <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 space-y-2 mb-4 text-left font-sans">
                      <div className="flex items-center space-x-2">
                        <File size={13} className="text-slate-400 shrink-0" />
                        <span className="text-[11px] font-bold text-slate-700 truncate" title={file.fileName}>
                          {file.fileName}
                        </span>
                      </div>
                      
                      {req.message && (
                        <div className="flex items-start space-x-2 text-slate-500 bg-white border border-slate-100 p-2.5 rounded-lg">
                          <MessageSquare size={12} className="text-slate-400 mt-0.5 shrink-0" />
                          <p className="text-[10px] font-semibold leading-relaxed break-words italic">
                            "{req.message}"
                          </p>
                        </div>
                      )}

                      <div className="flex items-center space-x-1 text-[9px] text-slate-400 font-semibold pt-1 border-t border-slate-100">
                        <Calendar size={10} />
                        <span>Requested on {formattedDate}</span>
                      </div>
                    </div>

                    {/* Bottom Section: Approve / Reject Actions */}
                    <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100/80">
                      <button
                        onClick={() => handleReject(req._id)}
                        disabled={processingId === req._id}
                        className="flex items-center space-x-1 py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-100 text-slate-500 hover:text-rose-500 text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                      >
                        <X size={12} />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleApprove(req._id)}
                        disabled={processingId === req._id}
                        className="flex items-center space-x-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all disabled:opacity-50 cursor-pointer shadow-sm active:scale-95"
                      >
                        {processingId === req._id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <>
                            <Check size={12} />
                            <span>Approve</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccessRequestsPage;
