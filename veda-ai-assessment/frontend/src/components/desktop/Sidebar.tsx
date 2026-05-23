'use client';

import React from 'react';
import { LayoutGrid, Users, BookOpen, Wrench, Library, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    if (path !== '/dashboard' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className="w-[304px] h-screen bg-white flex flex-col justify-between border-r border-[#E5E7EB] shadow-[0_32px_48px_rgba(0,0,0,0.20),0_16px_48px_rgba(0,0,0,0.12)] z-10 relative">
      {/* Top Section */}
      <div className="flex flex-col">
        {/* Logo */}
        <div className="px-[24px] py-[24px] flex items-center gap-[8px]">
          <div className="w-[24px] h-[24px] bg-[#F97316] rounded flex items-center justify-center text-white font-bold text-xs">V</div>
          <span className="font-bold text-[20px] text-[#111827]">VedaAI</span>
        </div>

        {/* Create Assignment Button */}
        <div className="px-[16px] mb-[24px]">
          <Link href="/dashboard/create" className="w-full flex items-center justify-center gap-[8px] bg-[#1F2937] text-white py-[12px] px-[16px] rounded-[100px] border-[2px] border-[#F97316] hover:bg-[#374151] transition-colors shadow-sm">
            <Plus size={18} />
            <span className="font-semibold text-[14px]">Create Assignment</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-[4px] px-[16px]">
          <Link href="/dashboard" className={`flex items-center gap-[12px] px-[12px] py-[10px] rounded-[8px] transition-colors ${isActive('/dashboard') ? 'bg-[#F3F4F6] text-[#111827] font-semibold' : 'text-[#4B5563] hover:bg-[#F3F4F6]'}`}>
            <LayoutGrid size={20} />
            <span className="text-[14px] font-medium">Home</span>
          </Link>
          <Link href="/dashboard/groups" className={`flex items-center gap-[12px] px-[12px] py-[10px] rounded-[8px] transition-colors ${isActive('/dashboard/groups') ? 'bg-[#F3F4F6] text-[#111827] font-semibold' : 'text-[#4B5563] hover:bg-[#F3F4F6]'}`}>
            <Users size={20} />
            <span className="text-[14px] font-medium">My Groups</span>
          </Link>
          <Link href="/dashboard/assignments" className={`flex items-center gap-[12px] px-[12px] py-[10px] rounded-[8px] transition-colors ${isActive('/dashboard/assignments') ? 'bg-[#F3F4F6] text-[#111827] font-semibold' : 'text-[#4B5563] hover:bg-[#F3F4F6]'}`}>
            <BookOpen size={20} />
            <span className="text-[14px]">Assignments</span>
          </Link>
          <Link href="/dashboard/toolkit" className={`flex items-center gap-[12px] px-[12px] py-[10px] rounded-[8px] transition-colors ${isActive('/dashboard/toolkit') ? 'bg-[#F3F4F6] text-[#111827] font-semibold' : 'text-[#4B5563] hover:bg-[#F3F4F6]'}`}>
            <Wrench size={20} />
            <span className="text-[14px] font-medium">AI Teacher&apos;s Toolkit</span>
          </Link>
          <Link href="/dashboard/library" className={`flex items-center gap-[12px] px-[12px] py-[10px] rounded-[8px] transition-colors ${isActive('/dashboard/library') ? 'bg-[#F3F4F6] text-[#111827] font-semibold' : 'text-[#4B5563] hover:bg-[#F3F4F6]'}`}>
            <Library size={20} />
            <span className="text-[14px] font-medium">My Library</span>
          </Link>
        </nav>
      </div>

      {/* Bottom Settings Card */}
      <div className="p-[16px]">
        <div className="flex items-center justify-between p-[12px] rounded-[12px] border border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer transition-colors shadow-sm">
          <div className="flex items-center gap-[12px]">
            <div className="w-[32px] h-[32px] rounded-full bg-[#E5E7EB] flex items-center justify-center overflow-hidden">
              <span className="text-[12px] font-bold">DP</span>
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
