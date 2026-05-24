import React from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';

const PageHeader = () => {
  return (
    <div className="flex flex-row items-center relative w-full min-h-[48px]">
      <button className="flex md:hidden items-center justify-center w-[48px] h-[48px] rounded-full bg-[#E5E7EB] shrink-0 absolute left-0 z-10">
        <ArrowLeft size={24} className="text-[#111827]" strokeWidth={2.5} />
      </button>

      <div className="flex flex-col w-full items-center md:items-start justify-center md:justify-start gap-[2px] relative z-0">
        <div className="flex flex-row items-center justify-center md:justify-start gap-[12px]">
          <div className="hidden md:block w-[12px] h-[12px] rounded-full bg-[#4BCE6D] ring-[4px] ring-[#4BCE6D]/40 shadow-sm"></div>
          <h1 className="text-[#111827] text-[18px] md:text-[20px] font-bold tracking-[-0.64px] md:tracking-[-0.8px] leading-[22.4px] md:leading-[28px] text-center md:text-left">
            Assignments
          </h1>
        </div>
        <p className="hidden md:block text-[#5E5E5E] text-[14px] font-medium tracking-[-0.56px] leading-[19.6px] text-center md:text-left mt-[4px]">
          Manage and create assignments for your classes.
        </p>
      </div>
    </div>
  );
};

export default PageHeader;
