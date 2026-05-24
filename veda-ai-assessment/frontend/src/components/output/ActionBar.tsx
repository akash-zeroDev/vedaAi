'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAssessmentStore } from '@/store/useAssessmentStore';
import { RefreshCw, Loader2 } from 'lucide-react';

const ActionBar = () => {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId as string;
  const store = useAssessmentStore();

  const handleRegenerate = async () => {
    try {
      useAssessmentStore.setState({ status: 'processing' });
      
      const { apiFetch } = require('@/lib/api');
      const response = await apiFetch(`/api/assignments/${jobId}/regenerate`, {
        method: 'POST',
      });

      if (response.status === 202 || response.ok) {
        useAssessmentStore.setState({ assignmentId: jobId, status: 'processing', resultData: null });
      } else {
        useAssessmentStore.setState({ status: 'error' });
      }
    } catch (error) {
      console.error(error);
      useAssessmentStore.setState({ status: 'error' });
    }
  };

  const isProcessing = store.status === 'processing' || store.status === 'queued';

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white shadow-xl rounded-full px-6 py-3 border border-gray-200 print:hidden flex items-center justify-center">
      <button 
        onClick={handleRegenerate}
        disabled={isProcessing}
        className="flex flex-row items-center gap-2 font-bold text-sm md:text-base text-[#F97316] hover:text-[#EA580C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <RefreshCw size={20} />
        )}
        <span>{isProcessing ? 'Generating...' : 'Regenerate Assessment'}</span>
      </button>
    </div>
  );
};

export default ActionBar;
