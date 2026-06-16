'use client';

import React from 'react';
import { LayoutGrid, Users, BookOpen, Wrench, Library, Plus, Sparkles, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAssessmentStore } from '@/store/useAssessmentStore';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useSession } from 'next-auth/react';

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const store = useAssessmentStore();
  const { setIsNavigating } = useNavigationStore();
  const { data: session } = useSession();

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (pathname !== path) {
      e.preventDefault();
      setIsNavigating(true);
      router.push(path);
    }
  };

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    if (path !== '/dashboard' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className="w-[304px] h-screen bg-white/80 backdrop-blur-2xl flex flex-col justify-between border-r border-slate-200/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 relative">
      <div className="flex flex-col">
        <div className="px-[24px] py-[28px] flex items-center gap-[14px]">
          <div className="w-[40px] h-[40px] relative rounded-xl overflow-hidden bg-gradient-to-br from-indigo-50 to-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
            <img src="/graphite_modern_logo.png" alt="Graphite Logo" className="w-[28px] h-[28px] object-contain drop-shadow-sm" />
          </div>
          <span className="font-extrabold text-[24px] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-900">Graphite</span>
        </div>

        <nav className="flex-1 px-[20px] py-[8px] flex flex-col gap-[6px] overflow-y-auto">
          <Link href="/dashboard" onClick={(e) => handleNav(e, '/dashboard')} className={`group flex items-center gap-[14px] px-[14px] py-[12px] rounded-xl transition-all duration-200 ${isActive('/dashboard') ? 'bg-indigo-50/80 text-indigo-700 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <img src="/home.svg" alt="Home" className={`w-[20px] h-[20px] transition-transform duration-300 group-hover:scale-110 ${isActive('/dashboard') ? 'opacity-100' : 'opacity-60'}`} />
            <span className="text-[14.5px]">Home</span>
          </Link>
          <Link href="/dashboard/groups" onClick={(e) => handleNav(e, '/dashboard/groups')} className={`group flex items-center gap-[14px] px-[14px] py-[12px] rounded-xl transition-all duration-200 ${isActive('/dashboard/groups') ? 'bg-indigo-50/80 text-indigo-700 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <img src="/myGroup.svg" alt="My Groups" className={`w-[20px] h-[20px] transition-transform duration-300 group-hover:scale-110 ${isActive('/dashboard/groups') ? 'opacity-100' : 'opacity-60'}`} />
            <span className="text-[14.5px]">My Groups</span>
          </Link>
          <Link href="/dashboard/assignments" onClick={(e) => handleNav(e, '/dashboard/assignments')} className={`group flex items-center gap-[14px] px-[14px] py-[12px] rounded-xl transition-all duration-200 ${isActive('/dashboard/assignments') ? 'bg-indigo-50/80 text-indigo-700 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <img src="/assignment.svg" alt="Assignments" className={`w-[20px] h-[20px] transition-transform duration-300 group-hover:scale-110 ${isActive('/dashboard/assignments') ? 'opacity-100' : 'opacity-60'}`} />
            <span className="text-[14.5px]">Assignments</span>
          </Link>
          <Link href="/dashboard/toolkit" onClick={(e) => handleNav(e, '/dashboard/toolkit')} className={`group flex items-center gap-[14px] px-[14px] py-[12px] rounded-xl transition-all duration-200 ${isActive('/dashboard/toolkit') ? 'bg-indigo-50/80 text-indigo-700 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <img src="/aiToolkit.svg" alt="AI Teacher's Toolkit" className={`w-[20px] h-[20px] transition-transform duration-300 group-hover:scale-110 ${isActive('/dashboard/toolkit') ? 'opacity-100' : 'opacity-60'}`} />
            <span className="text-[14.5px]">AI Teacher&apos;s Toolkit</span>
          </Link>
          <Link href="/dashboard/library" onClick={(e) => handleNav(e, '/dashboard/library')} className={`group flex items-center gap-[14px] px-[14px] py-[12px] rounded-xl transition-all duration-200 ${isActive('/dashboard/library') ? 'bg-indigo-50/80 text-indigo-700 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <img src="/library.svg" alt="My Library" className={`w-[20px] h-[20px] transition-transform duration-300 group-hover:scale-110 ${isActive('/dashboard/library') ? 'opacity-100' : 'opacity-60'}`} />
            <span className="text-[14.5px]">My Library</span>
          </Link>

          <div className="my-2 border-t border-slate-100 mx-3"></div>

          <Link href="/dashboard/upgrade" onClick={(e) => handleNav(e, '/dashboard/upgrade')} className={`group flex items-center gap-[14px] px-[14px] py-[12px] rounded-xl transition-all duration-200 ${isActive('/dashboard/upgrade') ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 font-bold shadow-sm' : 'text-slate-500 hover:bg-amber-50/50 hover:text-amber-600'}`}>
            <Sparkles size={18} className={`transition-transform duration-300 group-hover:scale-110 ${isActive('/dashboard/upgrade') ? 'text-amber-500' : 'text-slate-400 group-hover:text-amber-500'}`} />
            <span className="text-[14.5px]">Upgrade to Premium</span>
          </Link>
        </nav>
      </div>

      <div className="p-[20px] flex flex-col gap-[12px]">
        <Link href="/dashboard/settings" className="group flex items-center gap-[14px] px-[14px] py-[12px] rounded-xl transition-all duration-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900">
          <img src="/Setting.svg" alt="Settings" className="w-[20px] h-[20px] opacity-60 group-hover:opacity-100 transition-opacity" />
          <span className="font-semibold text-[14.5px]">Settings</span>
        </Link>
        <div className="flex items-center justify-between p-[14px] rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 hover:shadow-sm cursor-pointer transition-all duration-200 group">
          <div className="flex items-center gap-[12px]">
            <div className="w-[34px] h-[34px] rounded-[12px] bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center overflow-hidden text-indigo-700 font-extrabold text-[15px] shadow-inner group-hover:scale-105 transition-transform">
              {session?.user?.schoolName ? session.user.schoolName.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Workspace</span>
              <span className="text-[14px] font-bold text-slate-700 truncate max-w-[160px] tracking-tight group-hover:text-indigo-600 transition-colors" title={session?.user?.schoolName || 'School'}>
                {session?.user?.schoolName || 'Loading...'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
