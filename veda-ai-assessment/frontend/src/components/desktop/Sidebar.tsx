'use client';

import React from 'react';
import { LayoutGrid, Users, BookOpen, Wrench, Library, Plus, Sparkles } from 'lucide-react';
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
    <aside className="w-[304px] h-screen bg-white flex flex-col justify-between border-r border-[#E5E7EB] shadow-[0_32px_48px_rgba(0,0,0,0.20),0_16px_48px_rgba(0,0,0,0.12)] z-10 relative">
      <div className="flex flex-col">
        <div className="px-[16px] py-[24px] flex items-center gap-[12px]">
          <div className="w-[36px] h-[36px] relative rounded-[10px] overflow-hidden bg-white flex items-center justify-center shrink-0">
            <img src="/graphite_modern_logo.png" alt="Graphite Logo" className="w-[32px] h-[32px] object-contain drop-shadow-sm" />
          </div>
          <span className="font-bold text-[22px] text-[#111827] tracking-tight">Graphite</span>
        </div>

        <div className="px-[16px] mb-[24px]">
          <Link
            href="/dashboard/create"
            onClick={(e) => {
              store.resetForm();
              handleNav(e, '/dashboard/create');
            }}
            className="w-full flex items-center justify-center gap-[8px] bg-[#181818] text-white py-[12px] px-[24px] rounded-[100px] hover:bg-[#333] transition-colors shadow-sm"
          >
            <Plus size={20} />
            <span className="font-semibold text-[16px]">Create Assignment</span>
          </Link>
        </div>

        <nav className="flex-1 px-[16px] py-[8px] flex flex-col gap-[4px] overflow-y-auto">
          <Link href="/dashboard" onClick={(e) => handleNav(e, '/dashboard')} className={`flex items-center gap-[12px] px-[12px] py-[10px] rounded-[8px] transition-colors ${isActive('/dashboard') ? 'bg-[#F3F4F6] text-[#111827] font-semibold' : 'text-[#4B5563] hover:bg-[#F3F4F6]'}`}>
            <img src="/home.svg" alt="Home" className="w-[20px] h-[20px]" />
            <span className="text-[14px]">Home</span>
          </Link>
          <Link href="/dashboard/groups" onClick={(e) => handleNav(e, '/dashboard/groups')} className={`flex items-center gap-[12px] px-[12px] py-[10px] rounded-[8px] transition-colors ${isActive('/dashboard/groups') ? 'bg-[#F3F4F6] text-[#111827] font-semibold' : 'text-[#4B5563] hover:bg-[#F3F4F6]'}`}>
            <img src="/myGroup.svg" alt="My Groups" className="w-[20px] h-[20px]" />
            <span className="text-[14px]">My Groups</span>
          </Link>
          <Link href="/dashboard/assignments" onClick={(e) => handleNav(e, '/dashboard/assignments')} className={`flex items-center gap-[12px] px-[12px] py-[10px] rounded-[8px] transition-colors ${isActive('/dashboard/assignments') ? 'bg-[#F3F4F6] text-[#111827] font-semibold' : 'text-[#4B5563] hover:bg-[#F3F4F6]'}`}>
            <img src="/assignment.svg" alt="Assignments" className="w-[20px] h-[20px]" />
            <span className="text-[14px]">Assignments</span>
          </Link>
          <Link href="/dashboard/toolkit" onClick={(e) => handleNav(e, '/dashboard/toolkit')} className={`flex items-center gap-[12px] px-[12px] py-[10px] rounded-[8px] transition-colors ${isActive('/dashboard/toolkit') ? 'bg-[#F3F4F6] text-[#111827] font-semibold' : 'text-[#4B5563] hover:bg-[#F3F4F6]'}`}>
            <img src="/aiToolkit.svg" alt="AI Teacher's Toolkit" className="w-[20px] h-[20px]" />
            <span className="text-[14px]">AI Teacher&apos;s Toolkit</span>
          </Link>
          <Link href="/dashboard/library" onClick={(e) => handleNav(e, '/dashboard/library')} className={`flex items-center gap-[12px] px-[12px] py-[10px] rounded-[8px] transition-colors ${isActive('/dashboard/library') ? 'bg-[#F3F4F6] text-[#111827] font-semibold' : 'text-[#4B5563] hover:bg-[#F3F4F6]'}`}>
            <img src="/library.svg" alt="My Library" className="w-[20px] h-[20px]" />
            <span className="text-[14px]">My Library</span>
          </Link>

          <div className="my-2 border-t border-slate-100 mx-3"></div>

          <Link href="/dashboard/upgrade" onClick={(e) => handleNav(e, '/dashboard/upgrade')} className={`flex items-center gap-[12px] px-[12px] py-[10px] rounded-[8px] transition-colors ${isActive('/dashboard/upgrade') ? 'bg-amber-50 text-amber-700 font-semibold' : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-amber-600'}`}>
            <Sparkles size={18} className={isActive('/dashboard/upgrade') ? 'text-amber-500' : ''} />
            <span className="text-[14px]">Upgrade to Premium</span>
          </Link>
        </nav>
      </div>

      <div className="p-[16px] flex flex-col gap-[8px]">
        <Link href="/dashboard/settings" className="flex items-center gap-[12px] px-[12px] py-[10px] rounded-[8px] transition-colors text-[#4B5563] hover:bg-[#F3F4F6]">
          <img src="/Setting.svg" alt="Settings" className="w-[20px] h-[20px]" />
          <span className="font-['Bricolage_Grotesque',sans-serif] font-[400] text-[16px] leading-[1.4] tracking-[-0.64px]">Settings</span>
        </Link>
        <div className="flex items-center justify-between p-[12px] rounded-[12px] border border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer transition-colors shadow-sm">
          <div className="flex items-center gap-[12px]">
            <div className="w-[32px] h-[32px] rounded-full bg-[#E5E7EB] flex items-center justify-center overflow-hidden text-[#111827] font-bold text-[14px]">
              {session?.user?.schoolName ? session.user.schoolName.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-semibold text-[#111827] truncate max-w-[180px] uppercase tracking-wide" title={session?.user?.schoolName || 'School'}>
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
