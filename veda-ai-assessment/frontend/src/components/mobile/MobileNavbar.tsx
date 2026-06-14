import React from 'react';
import { Bell, Menu } from 'lucide-react';

const MobileNavbar = () => {
  return (
    <header className="fixed top-0 left-0 w-full z-50 px-[20px] py-[18px] bg-white/1 backdrop-blur-[96px]">
      <div className="flex flex-row items-center justify-between w-full h-[56px] bg-white rounded-[16px] pl-[12px] pr-[16px]">
        <div className="flex flex-row items-center gap-[8px]">
          <div className="w-[28px] h-[28px] bg-[#2F2F2F] rounded-[7px] flex items-center justify-center">
            <span className="text-white font-bold text-[14px]">G</span>
          </div>
          <span className="text-[#2F2F2F] text-[20px] font-bold tracking-[-1.2px] leading-[28px]">
            Graphite
          </span>
        </div>
        <div className="flex flex-row items-center gap-[12px]">
          <button className="relative flex items-center justify-center w-[36px] h-[36px] bg-[#F6F6F6] rounded-[100px]">
            <Bell size={20} className="text-[#2F2F2F]" />
            <span className="absolute top-[2px] right-[2px] w-[8px] h-[8px] bg-[#FF5623] rounded-[100px]"></span>
          </button>
          <div className="w-[32px] h-[32px] bg-[#F6F6F6] rounded-[100px] overflow-hidden flex items-center justify-center">
            <span className="text-[#2F2F2F] text-[12px] font-bold">JD</span>
          </div>
          <button className="flex items-center justify-center w-[24px] h-[24px]">
            <Menu size={24} className="text-[#1D1B20]" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default MobileNavbar;
