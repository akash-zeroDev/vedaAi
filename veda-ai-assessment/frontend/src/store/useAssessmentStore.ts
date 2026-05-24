import { create } from 'zustand';

export interface QuestionType {
  type: string;
  count: number;
  marks: number;
}

export interface Question {
  text: string;
  questionText?: string;
  difficulty: 'Easy' | 'Moderate' | 'Medium' | 'Hard';
  marks: number;
}

export interface Section {
  title?: string;
  sectionTitle?: string;
  instruction?: string;
  instructions?: string;
  questions: Question[];
}

export interface AssessmentResult {
  sections: Section[];
}

export interface FormData {
  file: File | null;
  title: string;
  dueDate: string;
  questionTypes: QuestionType[];
  totalQuestions: number;
  totalMarks: number;
  instructions: string;
}

export interface JobTracking {
  assignmentId: string | null;
  status: 'idle' | 'queued' | 'processing' | 'success' | 'error';
  resultData: AssessmentResult | null;
  errorMessage?: string | null;
}

export interface AssessmentStore extends FormData, JobTracking {
  setFormField: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  addQuestionType: (questionType: QuestionType) => void;
  updateQuestionType: (index: number, questionType: QuestionType) => void;
  removeQuestionType: (index: number) => void;
  setJobStatus: (status: JobTracking['status'], errorMessage?: string) => void;
  setResultData: (data: AssessmentResult) => void;
  resetForm: () => void;
}

export const useAssessmentStore = create<AssessmentStore>((set) => ({
  file: null,
  title: '',
  dueDate: '',
  questionTypes: [],
  totalQuestions: 0,
  totalMarks: 0,
  instructions: '',
  assignmentId: null,
  status: 'idle',
  resultData: null,
  errorMessage: null,
  setFormField: (field, value) => set((state) => ({ ...state, [field]: value })),
  addQuestionType: (questionType) => set((state) => ({
    questionTypes: [...state.questionTypes, questionType]
  })),
  updateQuestionType: (index, questionType) => set((state) => {
    const newQuestionTypes = [...state.questionTypes];
    newQuestionTypes[index] = questionType;
    return { questionTypes: newQuestionTypes };
  }),
  removeQuestionType: (index) => set((state) => ({
    questionTypes: state.questionTypes.filter((_, i) => i !== index)
  })),
  setJobStatus: (status, errorMessage) => set({ status, errorMessage: errorMessage || null }),
  setResultData: (resultData) => set({ resultData }),
  resetForm: () => set({
    file: null,
    title: '',
    dueDate: '',
    questionTypes: [],
    totalQuestions: 0,
    totalMarks: 0,
    instructions: '',
    assignmentId: null,
    status: 'idle',
    resultData: null,
    errorMessage: null,
  }),
}));
