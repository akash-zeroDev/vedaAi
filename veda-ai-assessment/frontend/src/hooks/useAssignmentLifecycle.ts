import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAssessmentStore } from '@/store/useAssessmentStore';
import { useSocketStore } from '@/store/useSocketStore';
import type { AssessmentResult } from '@/store/useAssessmentStore';

interface WebSocketPayload {
  assignmentId: string;
  generationId?: string;
  status: 'completed' | 'failed' | 'processing' | 'queued';
  data?: AssessmentResult;
  error?: string;
}

export const useAssignmentLifecycle = () => {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const store = useAssessmentStore();
  const { socket, connect } = useSocketStore();

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (payload: WebSocketPayload) => {
      if (payload.assignmentId === store.assignmentId) {
        if ((payload.generationId ?? null) !== (store.generationId ?? null)) return;
        if (payload.status === 'completed' && payload.data) {
          store.setResultData(payload.data);
          store.setJobStatus('success');
          router.push('/dashboard/output/' + store.assignmentId);
        } else if (payload.status === 'failed') {
          store.setJobStatus('error', payload.error || 'An unexpected error occurred during generation.');
        }
      }
    };

    socket.on('assignment:updated', handleUpdate);

    return () => {
      socket.off('assignment:updated', handleUpdate);
    };
  }, [socket, store.assignmentId, store.generationId, router, store]);

  // Poll until a durable outcome. A provider retry can legitimately exceed a
  // minute; elapsed client time must not be presented as terminal job failure.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    const controller = new AbortController();

    if (store.status === 'processing' && store.assignmentId) {
      const poll = async () => {
        let terminal = false;
        try {
          const { apiFetch } = require('@/lib/api');
          const res = await apiFetch(`/api/assignments/${store.assignmentId}/result`, {
            signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
          });

          if (res.ok) {
            const data = await res.json();
            if (!cancelled && data && data.content) {
              terminal = true;
              store.setResultData(data.content);
              store.setJobStatus('success');
              router.push('/dashboard/output/' + store.assignmentId);
            }
          } else if (res.status === 400) {
            // Check for failed generation
            const err = await res.json().catch(() => ({}));
            if (!cancelled && err.error && err.error.includes('failed')) {
              terminal = true;
              store.setJobStatus('error', err.error);
            }
          }
        } catch (error) {
          // A failed poll is not evidence that the background job failed.
          if (!cancelled) console.warn('Assignment status temporarily unavailable');
        } finally {
          if (!cancelled && !terminal) timer = setTimeout(poll, 3000);
        }
      };
      timer = setTimeout(poll, 3000);
    }

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [store.status, store.assignmentId, router, store]);

  const submitAssignment = async () => {
    try {
      store.setJobStatus('queued');
      useAssessmentStore.setState({ generationId: null });

      const formData = new FormData();
      formData.append('title', store.title || "Untitled Assignment");
      formData.append('dueDate', store.dueDate || "Not specified");
      formData.append('instructions', store.instructions || "None");
      formData.append('totalQuestions', (store.totalQuestions > 0 ? store.totalQuestions : 10).toString());
      formData.append('totalMarks', (store.totalMarks > 0 ? store.totalMarks : 50).toString());
      formData.append('questionTypes', JSON.stringify(store.questionTypes.length > 0 ? store.questionTypes : [{ type: 'Multiple Choice', count: 10, marks: 50 }]));

      if (store.file) {
        formData.append('file', store.file);
      }

      const { apiFetch } = require('@/lib/api');
      const response = await apiFetch('/api/assignments', {
        method: 'POST',
        headers: {
          'x-user-id': session?.user?.id || ''
        },
        body: formData,
      });

      if (response.status === 202 || response.ok) {
        const data = await response.json();
        const id = data.assignmentId || data.jobId || data.id;
        useAssessmentStore.setState({ assignmentId: id, generationId: data.generationId ?? null, status: 'processing', errorMessage: null });
      } else {
        const errorData = await response.json().catch(() => ({}));
        store.setJobStatus('error', errorData.error || errorData.message || 'Failed to submit assignment.');
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      store.setJobStatus('error', error.message || 'Network error occurred while submitting.');
    }
  };

  return { submitAssignment, status: store.status };
};
