import React from 'react';
import { Heart, Zap, Infinity, ShieldCheck, ChevronRight, Crown, FileText } from 'lucide-react';

export default function UpgradePage() {
  const DONATION_LINK = 'https://buymeacoffee.com/akash'; // Swap this later

  return (
    <div className="relative z-10 flex flex-col w-full max-w-[1000px] mx-auto gap-12 pb-16 pt-8 px-4 lg:px-8">
      {/* ── Hero Section ── */}
      <div className="flex flex-col items-center text-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-widest">
          <Crown size={14} className="text-amber-500" /> Early Access
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
          Graphite Premium is coming soon.
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
          We are currently running on a free, rate-limited tier to keep the platform accessible.
          Support the developer to help us unlock the high-speed production servers and launch the
          Premium tier faster.
        </p>
      </div>

      {/* ── Pricing / Feature Comparison ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Free Tier Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Current Free Tier</h2>
            <p className="text-sm text-slate-500">The baseline experience for early adopters.</p>
          </div>
          <div className="text-4xl font-bold text-slate-900 mb-8">$0<span className="text-lg text-slate-400 font-normal">/mo</span></div>
          <ul className="flex flex-col gap-4 text-sm text-slate-600 flex-grow mb-8">
            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Standard AI Processing Speed</li>
            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> 15 Requests per minute (Rate Limited)</li>
            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Basic Data Caching</li>
            <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Community Support</li>
          </ul>
          <button disabled className="w-full py-3 px-4 bg-slate-100 text-slate-400 font-semibold rounded-xl cursor-not-allowed">
            Current Plan
          </button>
        </div>

        {/* Target Premium Tier Card */}
        <div className="bg-slate-50 border border-slate-800 rounded-3xl p-8 flex flex-col relative overflow-hidden shadow-xl shadow-slate-200/50">
          {/* Subtle glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-slate-200 rounded-full blur-3xl opacity-50 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Target Premium Tier</h2>
                <p className="text-sm text-slate-500">The high-performance production goal.</p>
              </div>
            </div>
            <div className="text-4xl font-bold text-slate-900 mb-8">TBA</div>
            <ul className="flex flex-col gap-4 text-sm text-slate-700 flex-grow mb-8 font-medium">
              <li className="flex items-center gap-3"><Zap size={16} className="text-slate-900" /> Zero API Rate Limits</li>
              <li className="flex items-center gap-3"><Infinity size={16} className="text-slate-900" /> Instant Redis Queues</li>
              <li className="flex items-center gap-3"><FileText size={16} className="text-slate-900" /> Advanced PDF Extraction & OCR</li>
              <li className="flex items-center gap-3"><ShieldCheck size={16} className="text-slate-900" /> Priority Developer Support</li>
            </ul>
            
            <a
              href={DONATION_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all duration-200"
            >
              <Heart size={16} className="text-rose-400 group-hover:scale-110 transition-transform" />
              Support the Project (Donate)
            </a>
            <p className="text-center text-[11px] text-slate-400 mt-3">
              Donations directly fund our AWS and LLM infrastructure.
            </p>
          </div>
        </div>
      </div>

      {/* ── FAQ Section ── */}
      <div className="mt-8 border-t border-slate-200 pt-12">
        <h3 className="text-xl font-bold text-slate-900 mb-8 tracking-tight">Frequently Asked Questions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Why donate?</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Graphite relies on heavy LLM processing and AWS cloud storage to provide instant, high-quality grading rubrics and difficulty matrices. Donations directly fund the server costs required to keep the site online and accessible for everyone.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">What happens when Premium launches?</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Early supporters who donate to the project will be granted complimentary lifetime access to the Premium tier once the Stripe integration goes live and the rate limits are officially lifted.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
