import React from 'react';
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';

export interface Question {
  text?: string;
  questionText?: string;
  options?: string[];
  difficulty: 'Easy' | 'Moderate' | 'Medium' | 'Hard';
  marks: number;
}

export interface Section {
  sectionTitle: string;
  instructions: string;
  questions: Question[];
}

interface AssessmentRendererProps {
  data: Section[];
}

const AssessmentRenderer: React.FC<AssessmentRendererProps> = ({ data }) => {
  let globalQuestionIndex = 1;

  const getBadgeColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-700';
      case 'moderate':
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'hard':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (!Array.isArray(data)) return null;

  return (
    <div className="w-full flex flex-col gap-[32px] font-sans text-black">
      {data.map((section, sectionIndex) => (
        <div key={sectionIndex} className="flex flex-col gap-6">
          <div className="flex flex-col gap-[8px] items-center text-center">
            <h2 className="text-[24px] font-semibold tracking-[-0.96px] leading-[38.4px] text-[#303030]">
              {section.sectionTitle}
            </h2>
            {section.instructions && (
              <p className="text-[16px] italic text-[#303030] leading-[25.6px] whitespace-pre-wrap">
                {section.instructions.replace(/\\n/g, '\n')}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-[24px] w-full">
            {section.questions?.map((question, qIndex) => {
              const currentQuestionNumber = globalQuestionIndex++;
              return (
                <div key={qIndex} className="flex flex-col sm:flex-row justify-between items-start gap-[16px] w-full break-inside-avoid">
                  <div className="flex flex-row gap-[10px]">
                    <span className="text-[16px] font-normal tracking-[-0.64px] leading-[25.6px] text-[#303030]">{currentQuestionNumber}.</span>
                    <div className="flex flex-col gap-[8px] w-full">
                      <div className="text-[16px] font-normal tracking-[-0.64px] leading-[25.6px] text-[#303030] whitespace-pre-wrap">
                        <Latex>{(question.questionText || question.text || '').replace(/\\n/g, '\n').replace(/\*?\*?(Sub-questions?|Sub-parts?|Sub questions?):?\*?\*?/gi, '').replace(/\n{3,}/g, '\n\n').trim()}</Latex>
                      </div>
                      {question.options && question.options.length > 0 && (
                        <div className="flex flex-col gap-[8px] mt-[12px] pl-[12px]">
                          {question.options.map((opt, optIdx) => {
                            const cleanOpt = opt.trim().replace(/^(?:Option\s+)?[A-Z][\.\)]\s*/i, '').trim();
                            return (
                              <div key={optIdx} className="flex flex-row gap-[8px] items-start">
                                <span className="text-[16px] font-semibold text-[#303030] shrink-0">
                                  {String.fromCharCode(65 + optIdx)}.
                                </span>
                                <div className="text-[16px] font-normal tracking-[-0.64px] leading-[25.6px] text-[#303030] whitespace-pre-wrap">
                                  <Latex>{cleanOpt.replace(/\\n/g, '\n')}</Latex>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-row items-center justify-end w-full sm:w-auto gap-[12px] shrink-0 mt-[4px] sm:mt-0">
                    <span className={`rounded-full text-xs font-medium px-2.5 py-0.5 print:hidden ${getBadgeColor(question.difficulty)}`}>
                      {question.difficulty}
                    </span>
                    <span className="text-[16px] font-normal tracking-[-0.64px] leading-[25.6px] text-[#303030] whitespace-nowrap">[{question.marks} Marks]</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AssessmentRenderer;
