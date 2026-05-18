import React from 'react';
import { Cloud, Globe, Mail, MessageSquare } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                <Cloud size={20} strokeWidth={2.5} />
              </div>
              <span className="text-lg font-bold text-slate-800 tracking-tight">Shnoor Drive</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Secure, reliable, and fast cloud storage for all your personal and professional needs.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors">
                <Globe size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors">
                <MessageSquare size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors">
                <Mail size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm transition-colors">Features</a></li>
              <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm transition-colors">Security</a></li>
              <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm transition-colors">For Work</a></li>
              <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Resources</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm transition-colors">Help Center</a></li>
              <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm transition-colors">Community</a></li>
              <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm transition-colors">Blog</a></li>
              <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm transition-colors">Developers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Company</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm transition-colors">About Us</a></li>
              <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm transition-colors">Careers</a></li>
              <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm transition-colors">Privacy</a></li>
              <li><a href="#" className="text-slate-500 hover:text-blue-600 text-sm transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Shnoor. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm text-slate-400">
            <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
