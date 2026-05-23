'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import { useAssessmentStore } from '@/store/useAssessmentStore';
import { useSocketStore } from '@/store/useSocketStore';

const AssignmentBuilding = () => {
  const router = useRouter();
  const store = useAssessmentStore();
  const { disconnect } = useSocketStore();

  const handleCancel = () => {
    disconnect();
    store.setJobStatus('idle');
    router.push('/dashboard/create');
  };

  return (
    <div className="w-full flex-1 h-full min-h-[500px] flex flex-col justify-center items-center bg-[#F9FAFB]">
      <div className="flex flex-col items-center max-w-md w-full px-6 py-12 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 text-center gap-6">
        
        <div className="relative flex items-center justify-center w-24 h-24 mb-2">
          <div className="absolute inset-0 bg-[#F97316]/10 rounded-full animate-ping"></div>
          <div className="absolute inset-2 bg-[#F97316]/20 rounded-full animate-pulse"></div>
          <div className="relative flex items-center justify-center w-14 h-14 bg-white rounded-full shadow-sm border border-gray-100 z-10">
            <Loader2 className="w-6 h-6 text-[#F97316] animate-spin" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            AI is crafting your assignment...
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-[280px] mx-auto">
            This usually takes 10-15 seconds. Please do not refresh the page.
          </p>
        </div>

        <button 
          onClick={handleCancel}
          className="mt-4 flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 hover:text-red-600 hover:border-red-100 transition-all group"
        >
          <X size={16} className="group-hover:scale-110 transition-transform" />
          Cancel Generation
        </button>

      </div>
    </div>
  );
};

export default AssignmentBuilding;
