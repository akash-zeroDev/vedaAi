import React from 'react';
import { Bell, Menu } from 'lucide-react';

const MobileHeader = () => {
  return (
    <header className="fixed top-0 w-full z-50 flex items-center justify-between px-[16px] py-[16px] bg-white/90 backdrop-blur-[27px] border-b border-[#E5E7EB]">
      <div className="flex items-center gap-[8px]">
        <button className="p-[4px]">
          <Menu size={24} className="text-[#111827]" />
        </button>
        <div className="flex items-center gap-[8px] ml-[8px]">
          <div className="w-[24px] h-[24px] bg-[#F97316] rounded flex items-center justify-center text-white font-bold text-xs">V</div>
          <span className="font-bold text-[18px] text-[#111827]">VedaAI</span>
        </div>
      </div>
      <div className="flex items-center gap-[16px]">
        <button className="relative p-[4px]">
          <Bell size={24} className="text-[#111827]" />
          <span className="absolute top-[4px] right-[4px] w-[8px] h-[8px] bg-[#F97316] rounded-full border border-white"></span>
        </button>
        <div className="w-[32px] h-[32px] rounded-[100px] bg-[#E5E7EB] flex items-center justify-center overflow-hidden border border-[#D1D5DB]">
          <span className="text-[12px] font-bold">JD</span>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
