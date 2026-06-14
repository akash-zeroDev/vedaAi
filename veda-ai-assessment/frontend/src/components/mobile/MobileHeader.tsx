import React from 'react';
import { Bell, Menu } from 'lucide-react';

const MobileHeader = () => {
  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] max-w-[373px] flex items-center justify-between px-[16px] py-[12px] bg-white rounded-[100px] shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      
      {/* Left side: Logo */}
      <div className="flex items-center gap-[8px]">
        <div className="w-[36px] h-[36px] relative overflow-hidden rounded-[8px]">
          <img 
            src="/graphite.svg" 
            alt="Graphite Logo" 
            className="absolute w-[72px] h-[64px] max-w-none" 
            style={{ left: '-17.74px', top: '-1.66px' }} 
          />
        </div>
        <span className="font-bold text-[18px] text-[#111827] tracking-tight">Graphite</span>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-[12px]">
        <button className="relative flex items-center justify-center w-[36px] h-[36px] rounded-full hover:bg-gray-50 transition-colors">
          <Bell size={20} className="text-[#111827]" strokeWidth={2} />
          <span className="absolute top-[8px] right-[8px] w-[8px] h-[8px] bg-[#EF4444] rounded-full border-[1.5px] border-white"></span>
        </button>
        
        <div className="w-[32px] h-[32px] rounded-full overflow-hidden border-[1.5px] border-white shadow-sm shrink-0 bg-gray-100">
          <img src="/avatar.jpg" alt="Profile" className="w-full h-full object-cover" />
        </div>

        <button className="flex items-center justify-center w-[36px] h-[36px] rounded-full hover:bg-gray-50 transition-colors ml-[-4px]">
          <Menu size={24} className="text-[#111827]" strokeWidth={2} />
        </button>
      </div>

    </header>
  );
};

export default MobileHeader;
