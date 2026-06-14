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
    <div className="relative z-10 flex flex-col w-full h-full max-w-5xl mx-auto">
      <UploadMaterialForm onSubmit={submitAssignment} />
    </div>
  );
}
