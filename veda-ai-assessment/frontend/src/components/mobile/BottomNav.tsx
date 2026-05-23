import React from 'react';
import { LayoutGrid, BookOpen, Library, Wrench } from 'lucide-react';

const BottomNav = () => {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#111827] rounded-[100px] shadow-[0_32px_48px_rgba(0,0,0,0.20)] border border-[#374151]">
      <div className="flex items-center justify-center px-[24px] py-[12px] gap-[32px]">
        <button className="flex flex-col items-center gap-[4px] text-[#9CA3AF] hover:text-white transition-colors">
          <LayoutGrid size={24} />
        </button>
        <button className="flex flex-col items-center gap-[4px] text-white">
          <BookOpen size={24} className="fill-[#374151]" />
        </button>
        <button className="flex flex-col items-center gap-[4px] text-[#9CA3AF] hover:text-white transition-colors">
          <Wrench size={24} />
        </button>
        <button className="flex flex-col items-center gap-[4px] text-[#9CA3AF] hover:text-white transition-colors">
          <Library size={24} />
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
