'use client';

import React from 'react';
import { ArrowLeft, Bell, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

const Header = () => {
  const router = useRouter();

  return (
    <header className="w-full h-[72px] bg-white flex flex-row items-center justify-between px-[24px] border-b border-[#E5E7EB]">
      <div className="flex items-center gap-[16px]">
        <button 
          onClick={() => router.back()}
          className="w-[40px] h-[40px] rounded-[100px] bg-white border border-[#E5E7EB] flex items-center justify-center shadow-sm hover:bg-[#F9FAFB] transition-colors"
        >
          <ArrowLeft size={20} className="text-[#111827]" />
        </button>
        <div className="flex items-center gap-[12px]">
          <div className="w-[32px] h-[32px] rounded-[8px] bg-[#F3F4F6] flex items-center justify-center">
            <div className="w-[16px] h-[16px] border-[2px] border-[#6B7280] rounded-[4px]"></div>
          </div>
          <h1 className="text-[16px] font-semibold text-[#111827] tracking-[-0.64px]">Assignment</h1>
        </div>
      </div>

      <div className="flex items-center gap-[24px]">
        <button className="relative p-[8px] hover:bg-[#F3F4F6] rounded-[100px] transition-colors">
          <Bell size={24} className="text-[#111827]" />
          <span className="absolute top-[8px] right-[10px] w-[8px] h-[8px] bg-[#F97316] rounded-[100px] border-2 border-white"></span>
        </button>
        <button className="flex items-center gap-[8px] py-[6px] px-[12px] rounded-[100px] hover:bg-[#F3F4F6] transition-colors shadow-[0_32px_48px_rgba(0,0,0,0.20),0_16px_48px_rgba(0,0,0,0.12)] bg-white border border-[#E5E7EB]">
          <div className="w-[32px] h-[32px] rounded-[100px] bg-[#E5E7EB] flex items-center justify-center overflow-hidden">
             <span className="text-[12px] font-bold">JD</span>
          </div>
          <span className="text-[14px] font-semibold text-[#111827]">John Doe</span>
          <ChevronDown size={16} className="text-[#111827]" />
        </button>
      </div>
    </header>
  );
};

export default Header;
