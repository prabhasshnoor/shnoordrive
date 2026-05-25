// src/pages/RequestAccessPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Lock, Send, CheckCircle2, ShieldAlert, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const RequestAccessPage = ({ shareId, ownerInfo, fileInfo, requestStatus, setRequestStatus }) => {
  const [requestedRole, setRequestedRole] = useState('viewer');
  const [requestMessage, setRequestMessage] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const handleRequestAccessSubmit = async (e) => {
    e.preventDefault();
    setSubmittingRequest(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const token = localStorage.getItem('token') || JSON.parse(localStorage.getItem('user') || '{}')?.token;

      const response = await axios.post(
        `${baseUrl}/share/request-access`,
        { shareId, requestedRole, message: requestMessage },
        { 
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );

      if (response.data.success) {
        toast.success('Access request submitted!');
        if (setRequestStatus) {
          setRequestStatus('pending');
        }
      }
    } catch (err) {
      console.error('Request access failed:', err);
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
      <div className="bg-white border border-slate-200/80 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center flex flex-col items-center">
        {requestStatus === 'pending' ? (
          <>
            <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 mb-5">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Access requested</h2>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed mb-6">
              Your request is pending review by the owner. You will gain access once they approve it.
            </p>
          </>
        ) : requestStatus === 'rejected' ? (
          <>
            <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-5">
              <ShieldAlert size={32} />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Request denied</h2>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed mb-6">
              The owner has rejected your access request. Contact the owner directly for assistance.
            </p>
          </>
        ) : (
          <form onSubmit={handleRequestAccessSubmit} className="w-full flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 mb-4">
              <Lock size={30} />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">You need access</h2>
            <p className="text-xs text-slate-400 font-semibold mb-5">
              Request access from the owner to view <span className="font-bold text-slate-600">"{fileInfo?.fileName || 'this file'}"</span>.
            </p>

            {/* Owner card */}
            {ownerInfo && (
              <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100 w-full mb-4 text-left">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  {ownerInfo.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-700 truncate">{ownerInfo.name}</p>
                  <p className="text-[9px] text-slate-400 font-semibold truncate flex items-center">
                    <Mail size={10} className="mr-1 inline text-slate-350 shrink-0" />
                    <span>{ownerInfo.email}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Input for Role selection */}
            <div className="w-full text-left mb-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Choose Permission</label>
              <select
                value={requestedRole}
                onChange={(e) => setRequestedRole(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-150 rounded-xl px-3.5 py-3 outline-none focus:border-blue-500 transition-all text-slate-700"
              >
                <option value="viewer">Viewer (Can view and download)</option>
                <option value="commenter">Commenter (Can comment and view)</option>
                <option value="editor">Editor (Can edit, share, and view)</option>
              </select>
            </div>

            {/* Message text area */}
            <div className="w-full text-left mb-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Message (Optional)</label>
              <textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Explain why you need access..."
                rows={3}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-150 rounded-xl p-3 outline-none focus:border-blue-500 transition-all text-slate-700 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submittingRequest}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-blue-500/10 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {submittingRequest ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={13} />
                  <span>Request Access</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-4 flex flex-col w-full gap-2 text-center">
          <Link 
            to="/drive"
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider py-1.5"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RequestAccessPage;
