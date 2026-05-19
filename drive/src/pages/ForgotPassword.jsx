import React, { useState } from 'react';
import { Cloud, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message || 'Reset link sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-blue-50 to-purple-50 -z-10 blur-3xl opacity-60" />

      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100 relative z-10 animate-fade-in-up">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-600/20 cursor-pointer" onClick={() => navigate('/')}>
              <Cloud size={32} strokeWidth={2.5} />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Forgot Password?</h2>
          <p className="mt-3 text-sm text-slate-500 font-medium">
            Enter your email to get a reset link.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium text-center border border-red-100">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm font-medium text-center border border-green-100">
            {message}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email address
              </label>
              <input
                id="email" name="email" type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm"
                placeholder="user@example.com"
              />
            </div>
          </div>

          <div>
            <button
              type="submit" disabled={loading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? 'Sending link...' : 'Send Reset Link'}
              {!loading && <ArrowRight size={18} className="ml-2 text-blue-100 group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>
        </form>

        <div className="text-center border-t border-slate-100 mt-6 pt-4">
          <Link to="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-500">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
