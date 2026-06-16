import React from 'react';
import Link from 'next/link';
import { Lock, Crown } from 'lucide-react';

export default function TokenLimitOverlay() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred overlay background */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-md rounded-3xl pointer-events-auto" />
      
      {/* Centered card */}
      <div className="relative z-10 bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-slate-900/10 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-rose-50 border-4 border-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500">
          <Lock size={28} />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Token Limit Reached</h2>
        
        <p className="text-slate-500 mb-8 leading-relaxed">
          You have exhausted your free tier token allocation. Please upgrade to Premium to continue generating AI assignments and utilizing the AI Teacher's Toolkit.
        </p>
        
        <Link 
          href="/dashboard/upgrade"
          className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg group pointer-events-auto"
        >
          <Crown size={18} className="text-amber-400 group-hover:scale-110 transition-transform" />
          Upgrade to Premium
        </Link>
      </div>
    </div>
  );
}
