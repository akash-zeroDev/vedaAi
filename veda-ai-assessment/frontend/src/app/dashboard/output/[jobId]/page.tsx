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

const OutputPage = () => {
  const params = useParams();
  const jobId = params?.jobId as string;
  const store = useAssessmentStore();
  const [isLoading, setIsLoading] = useState(!(store.resultData && store.assignmentId === jobId));
  const [error, setError] = useState<string | null>(null);
  const [totalMarks, setTotalMarks] = useState<number>(store.totalMarks || 20);

  useAssignmentLifecycle();

  const handleRegenerate = async () => {
    try {
      useAssessmentStore.setState({ status: 'processing' });
      
      const response = await fetch(`http://localhost:8000/api/assignments/${jobId}/regenerate`, {
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
        const res = await fetch(`http://localhost:8000/api/assignments/${jobId}/result`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error || errData.message || 'Failed to load assignment data.';
          setError(errMsg);
          store.setJobStatus('error', errMsg);
          return;
        }
        const data = await res.json();
        
        if (data.assignment && data.assignment.totalMarks) {
          setTotalMarks(data.assignment.totalMarks);
        } else if (store.totalMarks) {
          setTotalMarks(store.totalMarks);
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
        <Loader2 className="w-10 h-10 animate-spin text-[#F97316] mb-4" />
        <p className="text-gray-500 font-medium">Fetching your assignment...</p>
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
    <div className="w-full min-h-screen bg-[#5E5E5E] py-[20px] print:py-0 print:bg-white relative flex flex-col items-center px-[20px] gap-[12px]">
      
      <div className="w-full max-w-[1060px] bg-[#181818]/80 rounded-[32px] px-[32px] py-[24px] print:hidden border-t-[4px] border-[#181818]/80 flex flex-col gap-[24px]">
        <h2 className="text-[20px] font-bold leading-[28px] tracking-[-0.8px] text-white font-['Bricolage_Grotesque',sans-serif]">
          Certainly, Lakshya! Here are customized Question Paper for your CBSE Grade 8 Science classes on the NCERT chapters:
        </h2>
        <div className="flex flex-row gap-[16px]">
          <button 
            onClick={() => window.print()}
            className="bg-white text-[#303030] text-[16px] font-medium leading-[22px] tracking-[-0.64px] rounded-[100px] px-[24px] py-[11px] hover:bg-gray-200 transition-colors flex items-center gap-[8px]"
          >
            <Download size={18} />
            Download as PDF
          </button>
          
          <button 
            onClick={handleRegenerate}
            disabled={isProcessing}
            className="bg-white text-[#303030] text-[16px] font-medium leading-[22px] tracking-[-0.64px] rounded-[100px] px-[24px] py-[11px] hover:bg-gray-200 transition-colors flex items-center gap-[8px] disabled:opacity-50"
          >
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
            {isProcessing ? 'Generating...' : 'Regenerate Assessment'}
          </button>
        </div>
      </div>

      <div className="w-full max-w-[1060px] bg-white rounded-[32px] px-[32px] py-[32px] shadow-[0_4px_40px_rgba(0,0,0,0.08)] print:shadow-none print:bg-transparent print:max-w-none print:m-0 print:p-0 print:rounded-none flex flex-col gap-[32px]">
        <StudentHeader totalMarks={totalMarks} />
        <AssessmentRenderer data={sections} />
      </div>

    </div>
  );
};

export default OutputPage;
