import React from 'react';
import { FileSearch, Plus } from 'lucide-react';
import Link from 'next/link';

const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-[24px] pt-[96px] pb-[120px] md:p-[24px] overflow-y-auto">
      <div className="flex flex-col items-center max-w-[480px] text-center my-auto">
        {/* Illustration Placeholder */}
        <div className="w-[240px] h-[240px] mb-[24px] bg-[#E5E7EB] rounded-[100px] flex items-center justify-center relative">
            <FileSearch size={120} className="text-[#9CA3AF]" />
            <div className="absolute flex items-center justify-center w-[48px] h-[48px] bg-white rounded-[100px] shadow-lg bottom-[40px] right-[40px]">
                <div className="w-[24px] h-[24px] bg-[#EF4444] rounded-[100px] flex items-center justify-center relative">
                    <div className="w-[12px] h-[2px] bg-white transform rotate-45 absolute"></div>
                    <div className="w-[12px] h-[2px] bg-white transform -rotate-45 absolute"></div>
                </div>
            </div>
        </div>

        {/* Text */}
        <h2 className="text-[20px] font-bold text-[#111827] mb-[12px]">No assignments yet</h2>
        <p className="text-[14px] text-[#6B7280] leading-[1.5] mb-[32px]">
          Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
        </p>

        {/* CTA Button */}
        <Link href="/dashboard/create" className="flex items-center justify-center gap-[8px] bg-[#111827] text-white py-[12px] px-[24px] rounded-[100px] hover:bg-[#374151] transition-colors shadow-md">
          <Plus size={18} />
          <span className="font-semibold text-[14px]">Create Your First Assignment</span>
        </Link>
      </div>
    </div>
  );
};

export default EmptyState;
