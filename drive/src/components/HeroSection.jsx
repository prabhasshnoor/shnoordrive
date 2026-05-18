import React from 'react';
import { ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-100/50 rounded-full blur-3xl opacity-50 -z-10" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-purple-100/40 rounded-full blur-3xl opacity-50 -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-8 border border-blue-100 shadow-sm animate-fade-in-up">
          <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
          <span>Introducing the new Shnoor Drive UI</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 leading-tight max-w-4xl mx-auto">
          Easy and secure access to all your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">content</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Store, share, and collaborate on files and folders from any mobile device, tablet, or computer. Your gateway to seamless productivity.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-16">
          <button onClick={() => navigate('/login')} className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center">
            Try Drive for Work
          </button>
          <button onClick={() => navigate('/login')} className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center justify-center group">
            Go to Drive
            <ArrowRight size={18} className="ml-2 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm font-medium text-slate-500">
          <div className="flex items-center">
            <ShieldCheck size={18} className="mr-2 text-green-500" />
            Built-in protection against malware
          </div>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-300"></div>
          <div className="flex items-center">
            <Zap size={18} className="mr-2 text-yellow-500" />
            Lightning fast file syncing
          </div>
        </div>


      </div>
    </div>
  );
};

export default HeroSection;
