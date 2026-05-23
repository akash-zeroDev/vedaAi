import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
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
    <div className="w-full flex flex-col gap-10 font-sans text-black">
      {data.map((section, sectionIndex) => (
        <div key={sectionIndex} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wide border-b border-black/20 pb-2">
              {section.sectionTitle}
            </h2>
            {section.instructions && (
              <p className="text-sm sm:text-base italic text-gray-700">
                {section.instructions}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-6 sm:pl-2">
            {section.questions?.map((question, qIndex) => {
              const currentQuestionNumber = globalQuestionIndex++;
              return (
                <div key={qIndex} className="flex flex-col sm:flex-row justify-between items-start gap-4 w-full break-inside-avoid">
                  <div className="flex flex-row gap-3">
                    <span className="font-bold text-sm sm:text-base">{currentQuestionNumber}.</span>
                    <div className="flex flex-col gap-2 w-full">
                      <div className="text-sm sm:text-base leading-relaxed [&>p]:inline">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {question.questionText || question.text || ''}
                        </ReactMarkdown>
                      </div>
                      {question.options && question.options.length > 0 && (
                        <div className="flex flex-col gap-2 mt-3 pl-1 sm:pl-2">
                          {question.options.map((opt, optIdx) => {
                            const cleanOpt = opt.trim().replace(/^(?:Option\s+)?[A-Z][\.\)]\s*/i, '').trim();
                            return (
                              <div key={optIdx} className="flex flex-row gap-2 items-start">
                                <span className="font-semibold text-gray-600 text-sm sm:text-base w-5 shrink-0">
                                  {String.fromCharCode(65 + optIdx)}.
                                </span>
                                <div className="text-sm sm:text-base text-gray-800 [&>p]:inline">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                  >
                                    {cleanOpt}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-row items-center justify-end w-full sm:w-auto gap-3 shrink-0 mt-1 sm:mt-0">
                    <span className={`rounded-full text-xs font-medium px-2.5 py-0.5 print:hidden ${getBadgeColor(question.difficulty)}`}>
                      {question.difficulty}
                    </span>
                    <span className="font-bold text-sm sm:text-base whitespace-nowrap">[{question.marks} Marks]</span>
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
