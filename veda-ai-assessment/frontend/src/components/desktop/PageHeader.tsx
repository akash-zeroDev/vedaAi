import React, { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  children?: ReactNode;
}

const PageHeader = ({ children }: PageHeaderProps) => {
  return (
    <div className="flex flex-row items-center justify-between relative w-full pt-4 md:pt-6 mb-8">
      <div className="flex items-center">
        <button className="flex md:hidden items-center justify-center w-[40px] h-[40px] rounded-full hover:bg-slate-100 shrink-0 absolute left-0 z-10 transition-colors">
          <ArrowLeft size={20} className="text-slate-700" strokeWidth={2.5} />
        </button>

        <div className="flex flex-col w-full items-center md:items-start justify-center md:justify-start relative z-0 pl-12 md:pl-0">
          <h1 className="text-slate-900 text-3xl font-bold tracking-tight text-center md:text-left">
            Assignments
          </h1>
          <p className="hidden md:block text-slate-500 text-sm mt-1 text-center md:text-left">
            Manage and create assignments for your classes.
          </p>
        </div>
      </div>
      
      {children && (
        <div className="flex items-center shrink-0">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
