'use client';

import React, { useEffect, useRef } from 'react';
import { UploadCloud, CalendarPlus, ChevronDown, Minus, Plus, X, Mic } from 'lucide-react';
import { useAssessmentStore } from '@/store/useAssessmentStore';
import { useSocketStore } from '@/store/useSocketStore';

interface UploadMaterialFormProps {
  onSubmit: () => void;
}

const PREDEFINED_OPTIONS = [
  'Single Correct',
  'Multiple Correct',
  'Integer Type'
];

const UploadMaterialForm: React.FC<UploadMaterialFormProps> = ({ onSubmit }) => {
  const store = useAssessmentStore();
  const { isConnected } = useSocketStore();
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      store.setFormField('file', e.target.files[0]);
    }
  };

  const { questionTypes, setFormField, instructions, dueDate, title, totalQuestions, totalMarks, status } = store;

  useEffect(() => {
    const totalQ = questionTypes.reduce((acc, curr) => acc + curr.count, 0);
    const totalM = questionTypes.reduce((acc, curr) => acc + (curr.count * curr.marks), 0);
    
    if (totalQuestions !== totalQ) setFormField('totalQuestions', totalQ);
    if (totalMarks !== totalM) setFormField('totalMarks', totalM);
  }, [questionTypes, totalQuestions, totalMarks, setFormField]);

  return (
    <div className="flex flex-col w-full max-w-[850px] mx-auto gap-[24px] py-[24px] px-[16px]">
      
      <div className="flex flex-row items-start gap-[12px] w-full px-[8px] mb-[-8px]">
        <div className="relative group flex items-center justify-center mt-[4px] p-[4px] cursor-help">
          <div 
            className={`w-[10px] h-[10px] rounded-full flex-shrink-0 transition-colors ${isConnected ? 'bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-[#EF4444] shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}
          ></div>
          <div className="absolute left-[100%] ml-[8px] top-1/2 -translate-y-1/2 px-[8px] py-[4px] bg-[#1A1A1A] text-white text-[12px] font-medium rounded-[4px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-md pointer-events-none">
            {isConnected ? 'Socket is connected' : 'Socket is disconnected'}
            <div className="absolute top-1/2 -left-[4px] -translate-y-1/2 border-[4px] border-transparent border-r-[#1A1A1A]"></div>
          </div>
        </div>
        <div className="flex flex-col gap-[2px]">
          <h1 className="text-[#1A1A1A] text-[20px] font-bold tracking-tight leading-tight">
            Create Assignment
          </h1>
          <p className="text-[#A3A3A3] text-[13px] font-medium">
            Set up a new assignment for your students
          </p>
        </div>
      </div>

      <div className="flex flex-row items-center gap-[12px] w-full px-[8px]">
        <div className="h-[4px] flex-1 bg-[#1A1A1A] rounded-full"></div>
        <div className="h-[4px] flex-1 bg-[#DBDBDB] rounded-full"></div>
      </div>

      <div className="flex flex-col bg-white rounded-[24px] px-[24px] md:px-[40px] py-[32px] md:py-[40px] gap-[32px] border-[1.5px] border-[#E5E5E5] shadow-sm">
        
        <div className="flex flex-col gap-[4px]">
          <h2 className="text-[#1A1A1A] text-[20px] font-bold tracking-tight leading-tight">
            Assignment Details
          </h2>
          <p className="text-[#A3A3A3] text-[13px] font-medium">
            Basic information about your assignment
          </p>
        </div>

        <div className="flex flex-col gap-[16px] w-full">
          <div className="flex flex-col items-center justify-center bg-transparent rounded-[24px] border-[2px] border-dashed border-[#E5E5E5] px-[32px] py-[40px] gap-[16px] w-full">
            <div className="flex items-center justify-center text-[#1A1A1A]">
              <UploadCloud size={24} strokeWidth={2} />
            </div>
            <div className="flex flex-col items-center gap-[4px] text-center">
              <span className="text-[#1A1A1A] text-[15px] font-semibold">
                Choose a file or drag & drop it here
              </span>
              <span className="text-[#A3A3A3] text-[12px] font-medium uppercase tracking-wide">
                JPEG, PNG, TXT, RTF, PDF, upto 10MB
              </span>
            </div>
            <input type="file" className="hidden" id="file-upload" accept="image/jpeg, image/png, text/plain, application/rtf, text/rtf, .rtf, application/pdf, .pdf" onChange={handleFileChange} />
            <label htmlFor="file-upload" className="bg-[#F5F5F5] rounded-[100px] px-[24px] py-[8px] text-[#1A1A1A] text-[13px] font-semibold hover:bg-[#E5E5E5] transition-colors mt-[4px] cursor-pointer">
              Browse Files
            </label>
            {store.file && <span className="text-sm font-medium text-green-600 mt-2 text-center">{store.file.name}</span>}
          </div>
          <p className="text-center text-[#A3A3A3] text-[13px] font-medium">
            Upload images of your preferred document/image
          </p>
        </div>

        <div className="flex flex-col gap-[8px] w-full">
          <label className="text-[14px] font-bold text-[#1A1A1A]">Assignment Title</label>
          <div className="flex flex-row items-center w-full px-[20px] py-[12px] rounded-[12px] border-[1.5px] border-[#E5E5E5] bg-transparent focus-within:border-[#A3A3A3] transition-all">
            <input 
              type="text" 
              placeholder="Enter assignment title"
              value={title}
              onChange={(e) => setFormField('title', e.target.value)}
              className="w-full bg-transparent outline-none text-[#1A1A1A] text-[14px] font-medium placeholder:text-[#A3A3A3]" 
            />
          </div>
        </div>

        <div className="flex flex-col gap-[8px] w-full">
          <label className="text-[14px] font-bold text-[#1A1A1A]">Due Date</label>
          <div className="flex flex-row items-center justify-between px-[20px] py-[12px] rounded-[12px] border-[1.5px] border-[#E5E5E5] bg-transparent focus-within:border-[#A3A3A3] transition-all">
            <input 
              ref={dateInputRef}
              type="date" 
              value={dueDate}
              onChange={(e) => setFormField('dueDate', e.target.value)}
              className="w-full bg-transparent outline-none text-[#1A1A1A] text-[14px] font-medium placeholder:text-[#A3A3A3] [&::-webkit-calendar-picker-indicator]:hidden" 
            />
            <button type="button" onClick={() => dateInputRef.current?.showPicker()} className="outline-none flex items-center justify-center">
              <CalendarPlus size={20} className="text-[#1A1A1A]" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-[16px] w-full mt-[8px]">
          
          <div className="hidden md:flex flex-row items-center justify-between w-full px-[4px]">
            <div className="text-[13px] font-bold text-[#1A1A1A]">Question Type</div>
            <div className="flex flex-row items-center gap-[16px]">
              <div className="text-[13px] font-bold text-[#1A1A1A] w-[130px] text-center">No. of Questions</div>
              <div className="text-[13px] font-bold text-[#1A1A1A] w-[130px] text-center">Marks</div>
            </div>
          </div>

          <div className="flex flex-col gap-[12px] w-full">
            {questionTypes.map((qType, index) => (
              <div key={index} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-[12px] w-full">
                
                <div className="flex flex-row items-center gap-[12px] w-full md:flex-1">
                  <div className="flex-1 flex flex-row items-center justify-between px-[20px] py-[10px] rounded-[100px] border-[1.5px] border-[#E5E5E5] bg-transparent focus-within:border-[#A3A3A3] transition-colors relative">
                    {PREDEFINED_OPTIONS.includes(qType.type) ? (
                      <select 
                        value={qType.type}
                        onChange={(e) => {
                          if (e.target.value === 'Custom') {
                            store.updateQuestionType(index, { ...qType, type: 'Custom Type...' });
                          } else {
                            store.updateQuestionType(index, { ...qType, type: e.target.value });
                          }
                        }}
                        className="bg-transparent outline-none text-[#1A1A1A] text-[14px] font-semibold w-full appearance-none cursor-pointer z-10"
                      >
                        {PREDEFINED_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                        <option value="Custom">Custom...</option>
                      </select>
                    ) : (
                      <div className="flex w-full items-center justify-between">
                        <input 
                          type="text"
                          value={qType.type}
                          onChange={(e) => store.updateQuestionType(index, { ...qType, type: e.target.value })}
                          onFocus={(e) => {
                            if (e.target.value === 'Custom Type...') e.target.value = '';
                          }}
                          autoFocus
                          className="bg-transparent outline-none text-[#1A1A1A] text-[14px] font-semibold w-full"
                        />
                        <button 
                          onClick={() => store.updateQuestionType(index, { ...qType, type: PREDEFINED_OPTIONS[0] })}
                          className="text-[12px] text-[#A3A3A3] hover:text-[#1A1A1A] transition-colors font-bold whitespace-nowrap ml-2"
                        >
                          Reset
                        </button>
                      </div>
                    )}
                    {PREDEFINED_OPTIONS.includes(qType.type) && <ChevronDown size={18} className="text-[#1A1A1A] absolute right-[20px] pointer-events-none" />}
                  </div>
                  <button onClick={() => store.removeQuestionType(index)} className="w-[32px] h-[32px] shrink-0 flex items-center justify-center rounded-full text-[#1A1A1A] hover:bg-[#F5F5F5] transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="flex flex-row items-center gap-[16px] shrink-0 w-full md:w-auto">
                  <div className="flex-1 md:flex-none flex flex-row items-center justify-between px-[6px] py-[4px] rounded-[100px] border-[1.5px] border-[#E5E5E5] bg-transparent md:w-[130px]">
                    <button 
                      onClick={() => store.updateQuestionType(index, { ...qType, count: Math.max(1, qType.count - 1) })}
                      className="flex items-center justify-center w-[28px] h-[28px] rounded-full bg-transparent hover:bg-[#F5F5F5] transition-colors text-[#A3A3A3] hover:text-[#1A1A1A]">
                      <Minus size={14} />
                    </button>
                    <span className="text-[#1A1A1A] text-[15px] font-bold">{qType.count}</span>
                    <button 
                      onClick={() => store.updateQuestionType(index, { ...qType, count: qType.count + 1 })}
                      className="flex items-center justify-center w-[28px] h-[28px] rounded-full bg-transparent hover:bg-[#F5F5F5] transition-colors text-[#A3A3A3] hover:text-[#1A1A1A]">
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="flex-1 md:flex-none flex flex-row items-center justify-between px-[6px] py-[4px] rounded-[100px] border-[1.5px] border-[#E5E5E5] bg-transparent md:w-[130px]">
                    <button 
                      onClick={() => store.updateQuestionType(index, { ...qType, marks: Math.max(1, qType.marks - 1) })}
                      className="flex items-center justify-center w-[28px] h-[28px] rounded-full bg-transparent hover:bg-[#F5F5F5] transition-colors text-[#A3A3A3] hover:text-[#1A1A1A]">
                      <Minus size={14} />
                    </button>
                    <span className="text-[#1A1A1A] text-[15px] font-bold">{qType.marks}</span>
                    <button 
                      onClick={() => store.updateQuestionType(index, { ...qType, marks: qType.marks + 1 })}
                      className="flex items-center justify-center w-[28px] h-[28px] rounded-full bg-transparent hover:bg-[#F5F5F5] transition-colors text-[#A3A3A3] hover:text-[#1A1A1A]">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-end w-full mt-[16px] gap-[24px] md:gap-0">
            <button 
              onClick={() => store.addQuestionType({ type: 'Single Correct', count: 10, marks: 5 })}
              className="flex flex-row items-center gap-[10px] text-[#1A1A1A] font-bold text-[14px] hover:opacity-80 transition-opacity"
            >
              <div className="w-[32px] h-[32px] flex items-center justify-center rounded-full bg-[#1A1A1A] text-white">
                <Plus size={16} />
              </div>
              Add Question Type
            </button>

            <div className="flex flex-col items-end text-[#1A1A1A] text-[14px] gap-[4px] pr-[12px]">
              <div className="flex flex-row gap-[8px]">
                <span className="font-medium">Total Questions :</span>
                <span className="font-bold">{totalQuestions}</span>
              </div>
              <div className="flex flex-row gap-[8px]">
                <span className="font-medium">Total Marks :</span>
                <span className="font-bold">{totalMarks}</span>
              </div>
            </div>
          </div>

        </div>

        <div className="flex flex-col gap-[8px] w-full mt-[8px]">
          <label className="text-[14px] font-bold text-[#1A1A1A]">Description</label>
          <div className="relative w-full rounded-[16px] border-[1.5px] border-[#E5E5E5] bg-transparent focus-within:border-[#A3A3A3] transition-all p-[16px]">
            <textarea 
              rows={3} 
              placeholder="e.g Generate a question paper for 3 hour exam duration..." 
              value={instructions}
              onChange={(e) => setFormField('instructions', e.target.value)}
              className="w-full bg-transparent outline-none text-[#1A1A1A] text-[14px] font-medium placeholder:text-[#A3A3A3] resize-none" 
            />
            <button className="absolute bottom-[16px] right-[16px] flex items-center justify-center w-[32px] h-[32px] rounded-full hover:bg-[#F5F5F5] transition-colors">
              <Mic size={18} className="text-[#1A1A1A]" />
            </button>
          </div>
        </div>

      </div>

      <div className="flex flex-row items-center justify-between w-full pt-[8px] px-[8px]">
        <button className="flex flex-row items-center gap-[8px] px-[24px] py-[12px] rounded-[100px] text-[#1A1A1A] bg-white border-[1.5px] border-[#E5E5E5] text-[14px] font-bold hover:bg-[#F5F5F5] transition-colors shadow-sm">
          <span>&larr;</span> Previous
        </button>
        <div className="flex flex-col items-end gap-[4px]">
          <button 
            onClick={onSubmit}
            disabled={status === 'queued' || status === 'processing' || store.questionTypes.length === 0 || (!store.file && store.instructions.trim().length === 0)}
            className="flex flex-row items-center gap-[8px] px-[32px] py-[12px] rounded-[100px] bg-[#1A1A1A] text-white text-[14px] font-bold hover:bg-[#404040] shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'queued' || status === 'processing' ? 'Generating...' : 'Next'} <span>&rarr;</span>
          </button>
          {store.questionTypes.length === 0 ? (
            <span className="text-red-500 text-[12px] font-medium mr-[12px]">Please add at least one question type.</span>
          ) : (!store.file && store.instructions.trim().length === 0) ? (
            <span className="text-red-500 text-[12px] font-medium mr-[12px]">Please provide either a file or a description.</span>
          ) : null}
        </div>
      </div>

    </div>
  );
};

export default UploadMaterialForm;
