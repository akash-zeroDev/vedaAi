'use client';

import React from 'react';
import { useAssessmentStore } from '@/store/useAssessmentStore';
import StudentHeader from '@/components/output/StudentHeader';
import AssessmentRenderer from '@/components/output/AssessmentRenderer';
import ActionBar from '@/components/output/ActionBar';
import AssignmentBuilding from '@/components/output/AssignmentBuilding';
import { Download, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAssignmentLifecycle } from '@/hooks/useAssignmentLifecycle';

const OutputPage = () => {
  const params = useParams();
  const jobId = params?.jobId as string;
  const store = useAssessmentStore();
  const [isLoading, setIsLoading] = useState(!store.resultData);
  const [error, setError] = useState<string | null>(null);

  // Attach WebSocket listener so regeneration updates are received
  useAssignmentLifecycle();

  useEffect(() => {
    if (store.resultData) {
      setIsLoading(false);
      return;
    }

    if (!jobId) return;
    if (store.status === 'processing' || store.status === 'queued') return;

    const fetchResult = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/assignments/${jobId}/result`);
        if (!res.ok) {
          setError('Failed to load assignment data.');
          return;
        }
        const data = await res.json();
        store.setResultData(data.content);
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

  const resultData = store.resultData;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] w-full px-4 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#F97316] mb-4" />
        <p className="text-gray-500 font-medium">Fetching your assignment...</p>
      </div>
    );
  }

  if (error || !resultData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] w-full px-4 text-center relative">
        <p className="text-gray-500 font-medium text-base sm:text-lg">No assessment data found.</p>
        <ActionBar />
      </div>
    );
  }

  const sections = Array.isArray(resultData) ? resultData : resultData.sections || [];

  return (
    <div className="w-full min-h-screen bg-gray-50 py-4 sm:py-12 print:py-0 print:bg-white relative">
      <button 
        onClick={() => window.print()}
        className="fixed bottom-8 right-8 sm:bottom-12 sm:right-12 bg-[#F97316] text-white p-4 rounded-full shadow-[0_8px_30px_rgb(249,115,22,0.3)] hover:bg-[#EA580C] hover:scale-105 hover:-translate-y-1 transition-all duration-300 print:hidden z-50 flex items-center justify-center group"
        title="Download / Print Assignment"
      >
        <Download size={24} className="group-hover:-translate-y-1 transition-transform duration-300" />
      </button>
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-12 bg-white shadow-sm print:shadow-none print:bg-transparent print:max-w-none print:m-0 print:p-0 border border-gray-200 print:border-none flex flex-col gap-6 sm:gap-8">
        <StudentHeader />
        <div className="w-full border-t-[1.5px] border-black/80" />
        <AssessmentRenderer data={sections} />
      </div>
      <ActionBar />
    </div>
  );
};

export default OutputPage;
