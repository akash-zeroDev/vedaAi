'use client';

import React from 'react';
import { LayoutGrid, Users, BookOpen, Wrench, Library, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAssessmentStore } from '@/store/useAssessmentStore';

const Sidebar = () => {
  const pathname = usePathname();
  const [loadingPath, setLoadingPath] = React.useState<string | null>(null);
  const store = useAssessmentStore();

  React.useEffect(() => {
    setLoadingPath(null);
  }, [pathname]);

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    if (path !== '/dashboard' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className="w-[304px] h-screen bg-white flex flex-col justify-between border-r border-[#E5E7EB] shadow-[0_32px_48px_rgba(0,0,0,0.20),0_16px_48px_rgba(0,0,0,0.12)] z-10 relative">
      <div className="flex flex-col">
        <div className="px-[16px] py-[24px] flex items-center gap-[8px]">
          <div className="w-[40px] h-[40px] relative">
            <img src="/vedaAi.svg" alt="VedaAI Logo" className="absolute w-[80px] h-[71px] max-w-none" style={{ left: '-19.71px', top: '-1.85px' }} />
          </div>
          <span className="font-bold text-[22px] text-[#111827]">VedaAI</span>
        </div>

        <div className="px-[16px] mb-[24px]">
          <Link 
            href="/dashboard/create" 
            onClick={() => store.resetForm()}
            className="w-full flex items-center justify-center gap-[8px] bg-[#1F2937] text-white py-[12px] px-[16px] rounded-[100px] border-[2px] border-[#F97316] hover:bg-[#374151] transition-colors shadow-sm"
          >
            <img src="/aiStars.svg" alt="Create" className="w-[18px] h-[18px]" />
            <span className="font-semibold text-[14px]">Create Assignment</span>
          </Link>
        </div>

        <nav className="flex flex-col gap-[4px] px-[16px]">
          <Link href="/dashboard" onClick={() => setLoadingPath('/dashboard')} className={`flex items-center gap-[12px] px-[12px] py-[10px] rounded-[8px] transition-colors ${isActive('/dashboard') ? 'bg-[#F3F4F6] text-[#111827] font-semibold' : 'text-[#4B5563] hover:bg-[#F3F4F6]'}`}>
            {loadingPath === '/dashboard' ? <Loader2 size={20} className="animate-spin text-[#111827]" /> : <img src="/home.svg" alt="Home" className="w-[20px] h-[20px]" />}
            <span className="text-[14px]">Home</span>
          </Link>
          <Link href="/dashboard/groups" onClick={() => setLoadingPath('/dashboard/groups')} className={`flex items-center gap-[12px] px-[12px] py-[10px] rounded-[8px] transition-colors ${isActive('/dashboard/groups') ? 'bg-[#F3F4F6] text-[#111827] font-semibold' : 'text-[#4B5563] hover:bg-[#F3F4F6]'}`}>
            {loadingPath === '/dashboard/groups' ? <Loader2 size={20} className="animate-spin text-[#111827]" /> : <img src="/myGroup.svg" alt="My Groups" className="w-[20px] h-[20px]" />}
            <span className="text-[14px]">My Groups</span>
          </Link>
          <Link href="/dashboard/assignments" onClick={() => setLoadingPath('/dashboard/assignments')} className={`flex items-center gap-[12px] px-[12px] py-[10px] rounded-[8px] transition-colors ${isActive('/dashboard/assignments') ? 'bg-[#F3F4F6] text-[#111827] font-semibold' : 'text-[#4B5563] hover:bg-[#F3F4F6]'}`}>
            {loadingPath === '/dashboard/assignments' ? <Loader2 size={20} className="animate-spin text-[#111827]" /> : <img src="/assignment.svg" alt="Assignments" className="w-[20px] h-[20px]" />}
            <span className="text-[14px]">Assignments</span>
          </Link>
          <Link href="/dashboard/toolkit" onClick={() => setLoadingPath('/dashboard/toolkit')} className={`flex items-center gap-[12px] px-[12px] py-[10px] rounded-[8px] transition-colors ${isActive('/dashboard/toolkit') ? 'bg-[#F3F4F6] text-[#111827] font-semibold' : 'text-[#4B5563] hover:bg-[#F3F4F6]'}`}>
            {loadingPath === '/dashboard/toolkit' ? <Loader2 size={20} className="animate-spin text-[#111827]" /> : <img src="/aiToolkit.svg" alt="AI Teacher's Toolkit" className="w-[20px] h-[20px]" />}
            <span className="text-[14px]">AI Teacher&apos;s Toolkit</span>
          </Link>
          <Link href="/dashboard/library" onClick={() => setLoadingPath('/dashboard/library')} className={`flex items-center gap-[12px] px-[12px] py-[10px] rounded-[8px] transition-colors ${isActive('/dashboard/library') ? 'bg-[#F3F4F6] text-[#111827] font-semibold' : 'text-[#4B5563] hover:bg-[#F3F4F6]'}`}>
            {loadingPath === '/dashboard/library' ? <Loader2 size={20} className="animate-spin text-[#111827]" /> : <img src="/library.svg" alt="My Library" className="w-[20px] h-[20px]" />}
            <span className="text-[14px]">My Library</span>
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
            <div className="w-[32px] h-[32px] rounded-full bg-[#E5E7EB] flex items-center justify-center overflow-hidden">
              <img src="/avatar.jpg" alt="School Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-semibold text-[#111827]">Delhi Public School</span>
              <span className="text-[12px] text-[#6B7280]">Bokaro Steel City</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
