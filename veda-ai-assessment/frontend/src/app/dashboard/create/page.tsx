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
    <div className="flex flex-col w-full h-full overflow-y-auto bg-[#F9FAFB] md:p-[24px]">
      <UploadMaterialForm onSubmit={submitAssignment} />
    </div>
  );
}
