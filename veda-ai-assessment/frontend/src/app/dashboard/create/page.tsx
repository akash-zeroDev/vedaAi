'use client';

import React from 'react';
import UploadMaterialForm from '@/components/forms/UploadMaterialForm';
import AssignmentBuilding from '@/components/output/AssignmentBuilding';
import { useAssessmentStore } from '@/store/useAssessmentStore';
import { useAssignmentLifecycle } from '@/hooks/useAssignmentLifecycle';

export default function CreateAssignmentPage() {
  const store = useAssessmentStore();
  const { status } = store;
  
  const { submitAssignment } = useAssignmentLifecycle();

  React.useEffect(() => {
    if (store.status === 'success' || store.status === 'error') {
      useAssessmentStore.setState({ status: 'idle' });
    }
  }, []);

  if (status === 'queued' || status === 'processing' || status === 'success') {
    return <AssignmentBuilding />;
  }

  return (
    <div className="flex flex-col w-full h-full min-h-full bg-[#CECECE] md:bg-[#F9FAFB] pt-[96px] md:pt-[24px] px-[16px] md:px-[24px] pb-[120px] md:pb-[24px]">
      <UploadMaterialForm onSubmit={submitAssignment} />
    </div>
  );
}
