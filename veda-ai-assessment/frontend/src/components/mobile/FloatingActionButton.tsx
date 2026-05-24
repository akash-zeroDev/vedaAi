import React from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';

const FloatingActionButton = () => {
  return (
    <div className="fixed bottom-[112px] left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[373px] flex justify-end z-50 pointer-events-none">
      <Link 
        href="/dashboard/create" 
        className="pointer-events-auto w-[48px] h-[48px] bg-white rounded-[100px] flex items-center justify-center shadow-[0_32px_48px_rgba(0,0,0,0.20),0_16px_48px_rgba(0,0,0,0.12)] hover:bg-[#F5F5F5] transition-colors"
      >
        <Plus size={24} className="text-[#F97316]" strokeWidth={2.5} />
      </Link>
    </div>
  );
};

export default FloatingActionButton;
