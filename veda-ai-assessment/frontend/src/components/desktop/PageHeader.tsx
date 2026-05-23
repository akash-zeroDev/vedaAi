import React from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';

const PageHeader = () => {
  return (
    <div className="flex flex-row items-center justify-between px-[16px] md:px-[8px] gap-[16px] w-full">
      <div className="flex flex-row items-center gap-[16px]">
        <button className="flex md:hidden items-center justify-center w-[48px] h-[48px] rounded-[100px] bg-white/25 backdrop-blur-[24px] shrink-0">
          <ArrowLeft size={24} className="text-[#2F2F2F]" />
        </button>

        <div className="flex flex-row items-center gap-[12px]">
          <div className="hidden md:block w-[12px] h-[12px] rounded-full bg-[#4BCE6D] ring-[4px] ring-[#4BCE6D]/40 shadow-[0_32px_48px_rgba(0,0,0,0.20),0_16px_48px_rgba(0,0,0,0.12)]"></div>
          <div className="flex flex-col gap-[2px]">
            <h1 className="text-[#2F2F2F] text-[16px] md:text-[20px] font-bold tracking-[-0.64px] md:tracking-[-0.8px] leading-[22.4px] md:leading-[28px] text-center md:text-left">
              Assignments
            </h1>
            <p className="hidden md:block text-[#5E5E5E]/55 text-[14px] font-normal tracking-[-0.56px] leading-[19.6px]">
              Manage and create assignments for your classes.
            </p>
          </div>
        </div>
      </div>

      <div className="flex md:hidden w-[48px] shrink-0"></div>

      <div className="hidden md:flex">
        <Link href="/dashboard/create" className="flex items-center gap-[8px] px-[20px] py-[10px] bg-[#111827] text-white rounded-[100px] hover:bg-[#374151] transition-colors shadow-sm">
          <Plus size={18} />
          <span className="text-[14px] font-semibold">Create Assignment</span>
        </Link>
      </div>
    </div>
  );
};

export default PageHeader;
