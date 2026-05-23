import React from 'react';

const StudentHeader = () => {
  return (
    <div className="w-full bg-white text-black py-6 md:py-8 font-sans">
      <div className="flex flex-col md:flex-row gap-6 md:gap-10 w-full">
        <div className="flex flex-row items-end gap-2 flex-[2] w-full">
          <label className="font-bold text-[15px] whitespace-nowrap text-black">Student Name:</label>
          <input 
            type="text" 
            className="flex-1 border-b border-black/50 bg-transparent outline-none px-2 py-1 text-[15px] text-black focus:border-black rounded-none shadow-none"
          />
        </div>
        
        <div className="flex flex-row gap-6 w-full md:flex-[1.5]">
          <div className="flex flex-row items-end gap-2 flex-[1.5]">
            <label className="font-bold text-[15px] whitespace-nowrap text-black">Roll Number:</label>
            <input 
              type="text" 
              className="flex-1 border-b border-black/50 bg-transparent outline-none px-2 py-1 text-[15px] text-black focus:border-black rounded-none shadow-none"
            />
          </div>
          
          <div className="flex flex-row items-end gap-2 flex-1">
            <label className="font-bold text-[15px] whitespace-nowrap text-black">Section:</label>
            <input 
              type="text" 
              className="flex-1 border-b border-black/50 bg-transparent outline-none px-2 py-1 text-[15px] text-black focus:border-black rounded-none shadow-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHeader;
