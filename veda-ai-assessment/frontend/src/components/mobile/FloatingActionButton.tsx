import React from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';

const FloatingActionButton = () => {
  return (
    <Link href="/dashboard/create" className="fixed bottom-[96px] right-[24px] z-50 w-[56px] h-[56px] bg-[#F97316] rounded-full flex items-center justify-center shadow-[0_8px_16px_rgba(249,115,22,0.4)] hover:bg-[#EA580C] transition-colors">
      <Plus size={28} className="text-white" />
    </Link>
  );
};

export default FloatingActionButton;
