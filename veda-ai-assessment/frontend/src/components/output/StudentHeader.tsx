import React from 'react';

interface StudentHeaderProps {
  totalMarks?: number;
}

const StudentHeader: React.FC<StudentHeaderProps> = ({ totalMarks = 20 }) => {
  return (
    <div className="w-full flex flex-col gap-[16px] font-sans">
      
      <div className="flex flex-col items-center justify-center text-center">
        <h1 className="text-[32px] font-bold text-[#303030] leading-[42px]">
          Delhi Public School, Sector-4, Bokaro
        </h1>
        <p className="text-[24px] font-semibold tracking-[-0.96px] text-[#303030] leading-[38px]">
          Subject: English
        </p>
        <p className="text-[24px] font-semibold tracking-[-0.96px] text-[#303030] leading-[38px]">
          Class: 5th
        </p>
      </div>

      <div className="flex flex-row justify-between items-center w-full mt-[24px]">
        <span className="text-[18px] font-semibold tracking-[-0.72px] text-[#303030]">
          Time Allowed: 45 minutes
        </span>
        <span className="text-[18px] font-semibold tracking-[-0.72px] text-[#303030]">
          Maximum Marks: {totalMarks}
        </span>
      </div>

      <div className="w-full mt-[8px]">
        <p className="text-[18px] font-semibold tracking-[-0.72px] text-[#303030]">
          All questions are compulsory unless stated otherwise.
        </p>
      </div>

      <div className="flex flex-col gap-[12px] w-full mt-[16px]">
        <div className="text-[18px] font-semibold tracking-[-0.72px] text-[#303030]">
          Name: <span className="inline-block border-b-[1.5px] border-[#303030] w-[300px] ml-2"></span>
        </div>
        <div className="text-[18px] font-semibold tracking-[-0.72px] text-[#303030]">
          Roll Number: <span className="inline-block border-b-[1.5px] border-[#303030] w-[250px] ml-2"></span>
        </div>
        <div className="text-[18px] font-semibold tracking-[-0.72px] text-[#303030]">
          Class: 5th &nbsp;&nbsp;&nbsp; Section: <span className="inline-block border-b-[1.5px] border-[#303030] w-[200px] ml-2"></span>
        </div>
      </div>
      
    </div>
  );
};

export default StudentHeader;
