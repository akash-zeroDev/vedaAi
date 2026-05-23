import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessmentStore } from '@/store/useAssessmentStore';
import { useSocketStore } from '@/store/useSocketStore';
import type { AssessmentResult } from '@/store/useAssessmentStore';

interface WebSocketPayload {
  assignmentId: string;
  status: 'completed' | 'failed' | 'processing' | 'queued';
  data?: AssessmentResult;
  error?: string;
}

export const useAssignmentLifecycle = () => {
  const router = useRouter();
  const store = useAssessmentStore();
  const { socket, connect } = useSocketStore();

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (payload: WebSocketPayload) => {
      if (payload.assignmentId === store.assignmentId) {
        if (payload.status === 'completed' && payload.data) {
          store.setResultData(payload.data);
          store.setJobStatus('success');
          router.push('/dashboard/output/' + store.assignmentId);
        } else if (payload.status === 'failed') {
          store.setJobStatus('error');
        }
      }
    };

    socket.on('assignment:updated', handleUpdate);

    return () => {
      socket.off('assignment:updated', handleUpdate);
    };
  }, [socket, store.assignmentId, router, store]);

  const submitAssignment = async () => {
    try {
      store.setJobStatus('queued');
      
      const payload = {
        title: store.title || "Untitled Assignment",
        dueDate: store.dueDate || "Not specified",
        instructions: store.instructions || "None",
        totalQuestions: store.totalQuestions > 0 ? store.totalQuestions : 10,
        totalMarks: store.totalMarks > 0 ? store.totalMarks : 50,
        questionTypes: store.questionTypes.length > 0 ? store.questionTypes : [{ type: 'Multiple Choice', count: 10, marks: 50 }],
      };

      const response = await fetch('http://localhost:8000/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.status === 202 || response.ok) {
        const data = await response.json();
        const id = data.assignmentId || data.jobId || data.id;
        useAssessmentStore.setState({ assignmentId: id, status: 'processing' });
      } else {
        store.setJobStatus('error');
      }
    } catch (error) {
      console.error('Submission error:', error);
      store.setJobStatus('error');
    }
  };

  return { submitAssignment, status: store.status };
};
