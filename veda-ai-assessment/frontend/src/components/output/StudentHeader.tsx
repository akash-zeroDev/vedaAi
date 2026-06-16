import React from 'react';

interface StudentHeaderProps {
  totalMarks?: number;
  schoolName?: string;
  className?: string;
  assignmentTitle?: string;
}

const formatClass = (cls: string | undefined) => {
  if (!cls) return '-';
  const match = cls.match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    if (num > 0 && num <= 12) {
      const roman = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
      return cls.replace(match[0], roman[num]).replace(/\b(st|nd|rd|th)\b/gi, '').trim();
    }
  }
  return cls;
};

const StudentHeader: React.FC<StudentHeaderProps> = ({ totalMarks = 20, schoolName, className, assignmentTitle }) => {
  return (
    <div className="w-full flex flex-col gap-[12px] md:gap-[16px] font-sans">
      
      <div className="flex flex-col items-center justify-center text-center">
        <h1 className="text-[18px] md:text-[32px] font-bold text-[#303030] leading-[26px] md:leading-[42px]">
          {schoolName || 'School Name'}
        </h1>
        <p className="text-[13px] md:text-[24px] font-semibold tracking-[-0.3px] md:tracking-[-0.96px] text-[#303030] leading-[20px] md:leading-[38px]">
          {assignmentTitle || 'Assessment'}
        </p>
        <p className="text-[13px] md:text-[24px] font-semibold tracking-[-0.3px] md:tracking-[-0.96px] text-[#303030] leading-[20px] md:leading-[38px]">
          Class: {formatClass(className)}
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:justify-end md:items-center w-full mt-[8px] md:mt-[24px] gap-[2px] md:gap-0">
        <span className="text-[12px] md:text-[18px] font-semibold tracking-[-0.3px] md:tracking-[-0.72px] text-[#303030]">
          Maximum Marks: {totalMarks}
        </span>
      </div>

      <div className="w-full">
        <p className="text-[12px] md:text-[18px] font-semibold tracking-[-0.3px] md:tracking-[-0.72px] text-[#303030]">
          All questions are compulsory unless stated otherwise.
        </p>
      </div>

      <div className="flex flex-col gap-[6px] md:gap-[12px] w-full mt-[4px] md:mt-[16px]">
        <div className="text-[12px] md:text-[18px] font-semibold tracking-[-0.3px] md:tracking-[-0.72px] text-[#303030]">
          Name: 
        </div>
        <div className="text-[12px] md:text-[18px] font-semibold tracking-[-0.3px] md:tracking-[-0.72px] text-[#303030]">
          Roll Number: 
        </div>
        <div className="text-[12px] md:text-[18px] font-semibold tracking-[-0.3px] md:tracking-[-0.72px] text-[#303030]">
          Section: 
        </div>
      </div>
      
    </div>
  );
};

export default StudentHeader;
