'use client';

import React, { useEffect, useRef } from 'react';
import { UploadCloud, CalendarPlus, ChevronDown, Minus, Plus, X } from 'lucide-react';
import { useAssessmentStore } from '@/store/useAssessmentStore';

interface UploadMaterialFormProps {
  onSubmit: () => void;
}

const UploadMaterialForm: React.FC<UploadMaterialFormProps> = ({ onSubmit }) => {
  const store = useAssessmentStore();
  const dateInputRef = useRef<HTMLInputElement>(null);

  const { questionTypes, setFormField, instructions, dueDate, totalQuestions, totalMarks, status } = store;

  useEffect(() => {
    const totalQ = questionTypes.reduce((acc, curr) => acc + curr.count, 0);
    const totalM = questionTypes.reduce((acc, curr) => acc + curr.marks, 0);
    
    if (totalQuestions !== totalQ) setFormField('totalQuestions', totalQ);
    if (totalMarks !== totalM) setFormField('totalMarks', totalM);
  }, [questionTypes, totalQuestions, totalMarks, setFormField]);

  return (
    <div className="flex flex-col w-full max-w-[815px] mx-auto px-[16px] md:px-0 gap-[24px] md:gap-[32px] pb-[48px] pt-[24px]">
      
      <div className="flex flex-row items-center gap-[12px] w-full">
        <div className="h-[4px] md:h-[5px] flex-1 bg-[#5E5E5E] rounded-[100px]"></div>
        <div className="h-[4px] md:h-[5px] flex-1 bg-[#DBDBDB] rounded-[100px]"></div>
      </div>

      <div className="flex flex-col items-start md:items-center gap-[2px] md:gap-[4px]">
        <h1 className="text-[#2F2F2F] text-[18px] md:text-[20px] font-bold tracking-[-0.72px] md:tracking-[-0.8px] leading-[25.2px] md:leading-[28px]">
          Create Assignment
        </h1>
        <p className="text-[#5E5E5E]/55 text-[14px] font-normal tracking-[-0.56px] leading-[19.6px]">
          Set up a new assignment for your students
        </p>
      </div>

      <div className="flex flex-col gap-[24px] md:gap-[32px] w-full">
        <div className="flex flex-col items-center justify-center bg-white rounded-[16px] md:rounded-[24px] border-[1.5px] md:border-[1.75px] border-dashed border-black/20 px-[24px] md:px-[32px] py-[24px] gap-[16px] w-full">
          <div className="flex items-center justify-center w-[40px] h-[40px] bg-[#F6F6F6] rounded-[8px]">
            <UploadCloud size={20} className="text-[#1E1E1E]" />
          </div>
          <div className="flex flex-col items-center gap-[4px] text-center">
            <span className="text-[#2F2F2F] text-[14px] md:text-[16px] font-medium tracking-[-0.56px] md:tracking-[-0.64px] leading-[19.6px] md:leading-[22.4px]">
              Choose a file or drag & drop it here
            </span>
            <span className="text-[#A9A9A9] text-[12px] md:text-[14px] font-normal tracking-[-0.48px] md:tracking-[-0.56px] leading-[16.8px] md:leading-[19.6px]">
              JPEG, PNG, upto 10MB
            </span>
          </div>
          <button className="bg-[#F6F6F6] rounded-[100px] md:rounded-[48px] px-[24px] py-[10px] md:py-[8px] text-[#2F2F2F] text-[14px] font-medium tracking-[-0.56px] hover:bg-[#E5E7EB] transition-colors w-full md:w-auto">
            Browse Files
          </button>
        </div>

        <div className="flex flex-col gap-[8px] w-full">
          <label className="text-[14px] md:text-[16px] font-bold text-[#2F2F2F] tracking-[-0.56px] md:tracking-[-0.64px]">Assignment Title</label>
          <div className="flex flex-row items-center w-full px-[16px] py-[11px] rounded-[100px] border-[1.25px] border-[#DBDBDB] bg-transparent focus-within:ring-2 focus-within:ring-[#F97316]/20 focus-within:border-[#F97316] transition-all">
            <input 
              type="text" 
              placeholder="Enter assignment title"
              value={store.title}
              onChange={(e) => store.setFormField('title', e.target.value)}
              className="w-full bg-transparent outline-none text-[#111827] text-[14px] md:text-[16px] font-medium placeholder:text-[#A9A9A9]" 
            />
          </div>
        </div>

        <div className="flex flex-col gap-[8px] w-full">
          <label className="text-[14px] md:text-[16px] font-bold text-[#2F2F2F] tracking-[-0.56px] md:tracking-[-0.64px]">Description</label>
          <div className="flex flex-row items-start w-full px-[16px] py-[16px] rounded-[16px] md:rounded-[24px] border-[1.25px] border-[#DBDBDB] bg-transparent focus-within:ring-2 focus-within:ring-[#F97316]/20 focus-within:border-[#F97316] transition-all">
            <textarea 
              rows={4} 
              placeholder="Enter assignment description" 
              value={store.instructions}
              onChange={(e) => store.setFormField('instructions', e.target.value)}
              className="w-full bg-transparent outline-none text-[#111827] text-[14px] md:text-[16px] font-medium placeholder:text-[#A9A9A9] resize-none" 
            />
          </div>
        </div>

        <div className="flex flex-col gap-[8px] w-full">
          <label className="text-[14px] md:text-[16px] font-bold text-[#2F2F2F] tracking-[-0.56px] md:tracking-[-0.64px]">Due Date</label>
          <div className="flex flex-row items-center justify-between px-[16px] py-[11px] rounded-[100px] border-[1.25px] border-[#DBDBDB] bg-transparent focus-within:ring-2 focus-within:ring-[#F97316]/20 focus-within:border-[#F97316] transition-all">
            <input 
              ref={dateInputRef}
              type="date" 
              value={store.dueDate}
              onChange={(e) => store.setFormField('dueDate', e.target.value)}
              className="w-full bg-transparent outline-none text-[#111827] text-[14px] md:text-[16px] font-medium placeholder:text-[#A9A9A9] [&::-webkit-calendar-picker-indicator]:hidden" 
            />
            <button type="button" onClick={() => dateInputRef.current?.showPicker()} className="outline-none flex items-center justify-center">
              <CalendarPlus size={20} className="text-[#2B2B2B]" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-[8px] w-full">
          <label className="text-[14px] md:text-[16px] font-bold text-[#2F2F2F] tracking-[-0.56px] md:tracking-[-0.64px]">Question Details</label>
          <div className="flex flex-col gap-[16px] w-full">
            
            {store.questionTypes.map((qType, index) => (
              <div key={index} className="flex flex-col md:flex-row items-end md:items-center gap-[12px] md:gap-[16px] w-full">
                
                <div className="w-full md:flex-[2] flex flex-row items-center justify-between px-[16px] py-[11px] rounded-[100px] border-[1.25px] border-[#DBDBDB] bg-transparent focus-within:border-[#A9A9A9] transition-colors">
                  <input 
                    type="text"
                    value={qType.type}
                    onChange={(e) => store.updateQuestionType(index, { ...qType, type: e.target.value })}
                    className="bg-transparent outline-none text-[#2F2F2F] text-[14px] md:text-[16px] font-medium tracking-[-0.56px] md:tracking-[-0.64px] w-full"
                  />
                  <div className="flex items-center gap-2">
                    <ChevronDown size={20} className="text-[#2F2F2F]" />
                    <button onClick={() => store.removeQuestionType(index)} className="text-[#A9A9A9] hover:text-red-500 transition-colors flex items-center justify-center">
                      <X size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="w-full md:w-auto md:flex-[1.5] flex flex-row items-end gap-[12px] md:gap-[16px]">
                  
                  <div className="flex-1 flex flex-col gap-[4px]">
                    <span className="text-[10px] text-[#A9A9A9] font-medium leading-none px-[4px]">No. of Questions</span>
                    <div className="flex flex-row items-center justify-between px-[12px] py-[8px] md:py-[8px] rounded-[100px] border-[1.25px] border-[#DBDBDB] bg-transparent">
                      <button 
                        onClick={() => store.updateQuestionType(index, { ...qType, count: Math.max(1, qType.count - 1) })}
                        className="flex items-center justify-center w-[24px] h-[24px] md:w-[28px] md:h-[28px] rounded-full bg-[#F6F6F6] text-[#2F2F2F] hover:bg-[#E5E7EB] transition-colors">
                        <Minus size={14} />
                      </button>
                      <div className="flex flex-col items-center">
                        <span className="text-[#111827] text-[14px] md:text-[16px] font-medium">{qType.count}</span>
                      </div>
                      <button 
                        onClick={() => store.updateQuestionType(index, { ...qType, count: qType.count + 1 })}
                        className="flex items-center justify-center w-[24px] h-[24px] md:w-[28px] md:h-[28px] rounded-full bg-[#F6F6F6] text-[#2F2F2F] hover:bg-[#E5E7EB] transition-colors">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col gap-[4px]">
                    <span className="text-[10px] text-[#A9A9A9] font-medium leading-none px-[4px]">Marks</span>
                    <div className="flex flex-row items-center justify-between px-[12px] py-[8px] md:py-[8px] rounded-[100px] border-[1.25px] border-[#DBDBDB] bg-transparent">
                      <button 
                        onClick={() => store.updateQuestionType(index, { ...qType, marks: Math.max(1, qType.marks - 1) })}
                        className="flex items-center justify-center w-[24px] h-[24px] md:w-[28px] md:h-[28px] rounded-full bg-[#F6F6F6] text-[#2F2F2F] hover:bg-[#E5E7EB] transition-colors">
                        <Minus size={14} />
                      </button>
                      <div className="flex flex-col items-center">
                        <span className="text-[#111827] text-[14px] md:text-[16px] font-medium">{qType.marks}</span>
                      </div>
                      <button 
                        onClick={() => store.updateQuestionType(index, { ...qType, marks: qType.marks + 1 })}
                        className="flex items-center justify-center w-[24px] h-[24px] md:w-[28px] md:h-[28px] rounded-full bg-[#F6F6F6] text-[#2F2F2F] hover:bg-[#E5E7EB] transition-colors">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            ))}

            <div className="flex flex-row justify-between items-center w-full mt-[8px]">
              <button 
                onClick={() => store.addQuestionType({ type: 'Multiple Choice Questions', count: 10, marks: 50 })}
                className="text-[#F97316] text-[14px] font-bold tracking-[-0.56px] hover:text-[#EA580C] transition-colors"
              >
                + Add Question Type
              </button>
              <div className="flex flex-row gap-[16px] text-[14px] font-bold text-[#2F2F2F] tracking-[-0.56px]">
                <span>Total Questions: {store.totalQuestions}</span>
                <span>Total Marks: {store.totalMarks}</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="flex flex-row items-center justify-between w-full pt-[16px] md:pt-[24px] gap-[12px] md:gap-0">
        <button className="flex-1 md:flex-none md:w-[140px] px-[24px] md:px-[32px] py-[12px] rounded-[100px] border-[1.25px] border-[#DBDBDB] text-[#2F2F2F] text-[14px] md:text-[16px] font-bold hover:bg-[#F9FAFB] transition-colors tracking-[-0.56px] md:tracking-[-0.64px]">
          Previous
        </button>
        <button 
          onClick={onSubmit}
          disabled={status === 'queued' || status === 'processing' || store.questionTypes.length === 0}
          className="flex-1 md:flex-none md:w-[140px] px-[24px] md:px-[32px] py-[12px] rounded-[100px] bg-[#F97316] text-white text-[14px] md:text-[16px] font-bold hover:bg-[#EA580C] shadow-lg shadow-[#F97316]/20 transition-all tracking-[-0.56px] md:tracking-[-0.64px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'queued' || status === 'processing' ? 'Generating...' : 'Next'}
        </button>
      </div>

    </div>
  );
};

export default UploadMaterialForm;
