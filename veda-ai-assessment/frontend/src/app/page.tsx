'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNavigationStore } from '@/store/useNavigationStore';
import NavigationLoader from '@/components/desktop/NavigationLoader';

export default function Home() {
  const router = useRouter();
  const { setIsNavigating } = useNavigationStore();

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsNavigating(true);
    router.push('/dashboard');
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black px-4 relative overflow-hidden z-0">
      
      {/* Base Space Background */}
      <div className="absolute inset-0 bg-black -z-10"></div>
      
      {/* Flawless SVG Mesh Grid with Radial Glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#050505] to-black">
        <svg aria-hidden="true" className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse" x="50%" y="100%">
              <path d="M0 40V.5H40" fill="none" stroke="rgba(255,255,255,0.05)"></path>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)"></rect>
        </svg>
      </div>

      {/* Fade out edges */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent -z-10"></div>

      {/* Subtle Orange Glow Behind Content */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F97316] opacity-[0.03] blur-[100px] rounded-full pointer-events-none -z-10"></div>

      <NavigationLoader />
      
      <div className="flex flex-col items-center text-center space-y-6 max-w-2xl relative z-10">
        
        <div className="w-[80px] h-[80px] relative mb-2">
          <img 
            src="/vedaAi.svg" 
            alt="VedaAI Logo" 
            className="absolute w-[160px] h-[142px] max-w-none" 
            style={{ left: '-39.42px', top: '-3.7px', filter: 'brightness(0) invert(1)' }} 
          />
        </div>

        <h1 className="text-[48px] md:text-[64px] font-[800] text-white tracking-tight leading-tight font-['Bricolage_Grotesque',sans-serif] drop-shadow-lg">
          VedaAI Assessment Creator
        </h1>
        
        <p className="text-[18px] md:text-[20px] text-gray-400 font-medium max-w-xl">
          AI-powered question paper generation for educators.
        </p>
        
        <div className="pt-6">
          <Link 
            href="/dashboard"
            onClick={handleNav}
            className="inline-flex items-center justify-center px-[32px] py-[16px] text-[16px] font-semibold text-white bg-[#F97316] hover:bg-[#EA580C] rounded-[100px] transition-transform hover:scale-105 shadow-[0_0_24px_rgba(249,115,22,0.4)] hover:shadow-[0_0_32px_rgba(249,115,22,0.6)]"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
