'use client';

import React from 'react';
import { useAssessmentStore } from '@/store/useAssessmentStore';
import StudentHeader from '@/components/output/StudentHeader';
import AssessmentRenderer from '@/components/output/AssessmentRenderer';
import AssignmentBuilding from '@/components/output/AssignmentBuilding';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAssignmentLifecycle } from '@/hooks/useAssignmentLifecycle';
import { useSession } from 'next-auth/react';

const OutputPage = () => {
  const params = useParams();
  const jobId = params?.jobId as string;
  const store = useAssessmentStore();
  const [isLoading, setIsLoading] = useState(!(store.resultData && store.assignmentId === jobId));
  const [error, setError] = useState<string | null>(null);
  const [totalMarks, setTotalMarks] = useState<number>(store.totalMarks || 20);
  const [assignmentTitle, setAssignmentTitle] = useState<string>(store.title || '');
  const { data: session } = useSession();

  useAssignmentLifecycle();

  const handleRegenerate = async () => {
    try {
      useAssessmentStore.setState({ status: 'processing' });
      
      const { apiFetch } = require('@/lib/api');
      const response = await apiFetch(`/api/assignments/${jobId}/regenerate`, {
        method: 'POST',
      });

      if (response.status === 202 || response.ok) {
        useAssessmentStore.setState({ assignmentId: jobId, status: 'processing', resultData: null, errorMessage: null });
      } else {
        const errorData = await response.json().catch(() => ({}));
        useAssessmentStore.setState({ status: 'error', errorMessage: errorData.error || errorData.message || 'Failed to regenerate assignment.' });
      }
    } catch (error: any) {
      console.error(error);
      useAssessmentStore.setState({ status: 'error', errorMessage: error.message || 'Network error while regenerating.' });
    }
  };

  const isProcessing = store.status === 'processing' || store.status === 'queued';

  useEffect(() => {
    if (store.resultData && store.assignmentId === jobId) {
      setIsLoading(false);
      return;
    }

    if (!jobId) return;
    if (store.status === 'processing' || store.status === 'queued') return;

    const fetchResult = async () => {
      try {
        const { apiFetch } = require('@/lib/api');
        const res = await apiFetch(`/api/assignments/${jobId}/result`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error || errData.message || 'Failed to load assignment data.';
          setError(errMsg);
          store.setJobStatus('error', errMsg);
          return;
        }
        const data = await res.json();
        
        if (data.assignment) {
          if (data.assignment.totalMarks) setTotalMarks(data.assignment.totalMarks);
          if (data.assignment.title) setAssignmentTitle(data.assignment.title);
        } else {
          if (store.totalMarks) setTotalMarks(store.totalMarks);
          if (store.title) setAssignmentTitle(store.title);
        }
        
        useAssessmentStore.setState({ assignmentId: jobId });
        store.setResultData(data.content || data);
      } catch (err) {
        console.warn('Network error while fetching assignment:', err);
        setError('Failed to load assignment data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResult();
  }, [jobId, store.resultData, store]);

  if (store.status === 'processing' || store.status === 'queued') {
    return <AssignmentBuilding />;
  }

  const resultData = store.assignmentId === jobId ? store.resultData : null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] w-full px-4 text-center">
        <div className="relative flex items-center justify-center w-24 h-24 mb-2">
          <div className="absolute inset-0 bg-[#F97316]/10 rounded-full animate-ping"></div>
          <div className="absolute inset-2 bg-[#F97316]/20 rounded-full animate-pulse"></div>
          <div className="relative flex items-center justify-center w-14 h-14 bg-white rounded-full shadow-sm border border-gray-100 z-10">
            <Loader2 className="w-6 h-6 text-[#F97316] animate-spin" />
          </div>
        </div>
        <p className="text-gray-500 font-medium mt-4">Fetching your assignment...</p>
      </div>
    );
  }

  const displayError = error || store.errorMessage;

  if (displayError || !resultData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] w-full px-4 text-center relative">
        <div className="bg-red-50 text-red-600 p-[16px] rounded-[16px] max-w-md w-full border border-red-200 shadow-sm mb-4">
          <p className="font-semibold text-base sm:text-lg mb-1">Failed to generate assignment</p>
          <p className="text-sm opacity-90">{displayError || 'No assessment data found.'}</p>
        </div>
        <button onClick={handleRegenerate} className="mt-2 text-[#F97316] font-medium hover:underline flex items-center gap-2">
          <RefreshCw size={18} /> Retry Generation
        </button>
      </div>
    );
  }

  const sections = Array.isArray(resultData) ? resultData : resultData.sections || [];

  return (
    <div className="relative z-10 flex flex-col w-full h-full items-center gap-[24px] print:p-0 print:bg-white">
      
      {/* Action Card */}
      <div className="w-full max-w-[1060px] bg-white rounded-3xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] px-[16px] lg:px-[32px] py-[16px] lg:py-[24px] print:hidden flex flex-col gap-[16px] lg:gap-[24px]">
        <p className="text-[13px] lg:text-[20px] font-semibold lg:font-bold leading-[20px] lg:leading-[28px] tracking-[-0.3px] lg:tracking-[-0.8px] text-slate-900 font-['Bricolage_Grotesque',sans-serif]">
          Certainly! Here is the customized Assessment Paper for your students:
        </p>
        <div className="flex flex-row flex-wrap lg:flex-nowrap gap-[10px] lg:gap-[16px]">
          <button 
            onClick={() => window.print()}
            className="flex-1 lg:flex-none bg-slate-50 text-slate-700 text-[13px] lg:text-[16px] font-medium leading-[20px] lg:leading-[22px] tracking-[-0.3px] lg:tracking-[-0.64px] rounded-full border border-slate-200 px-[16px] lg:px-[24px] py-[9px] lg:py-[11px] hover:bg-slate-100 transition-colors flex items-center justify-center gap-[6px] lg:gap-[8px] whitespace-nowrap"
          >
            <Download size={16} />
            <span>Download as PDF</span>
          </button>
          
          <button 
            onClick={handleRegenerate}
            disabled={isProcessing}
            className="flex-1 lg:flex-none bg-indigo-50 text-indigo-700 text-[13px] lg:text-[16px] font-medium leading-[20px] lg:leading-[22px] tracking-[-0.3px] lg:tracking-[-0.64px] rounded-full border border-indigo-200 px-[16px] lg:px-[24px] py-[9px] lg:py-[11px] hover:bg-indigo-100 transition-colors flex items-center justify-center gap-[6px] lg:gap-[8px] disabled:opacity-50 whitespace-nowrap"
          >
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {isProcessing ? 'Generating...' : 'Regenerate Assessment'}
          </button>
        </div>
      </div>

      {/* PDF Card */}
      <div className="w-full max-w-[1060px] bg-white rounded-[20px] md:rounded-[32px] px-[16px] md:px-[32px] py-[20px] md:py-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 print:shadow-none print:bg-transparent print:max-w-none print:m-0 print:p-0 print:rounded-none flex flex-col gap-[24px] md:gap-[32px]">
        <StudentHeader 
          totalMarks={totalMarks} 
          schoolName={session?.user?.schoolName || undefined}
          className={(session?.user as any)?.className || undefined}
          assignmentTitle={assignmentTitle}
        />
        <AssessmentRenderer data={sections} />
      </div>

    </div>
  );
};

export default OutputPage;
