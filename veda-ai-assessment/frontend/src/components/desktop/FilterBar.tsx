import React from 'react';
import { Filter, Search } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ searchQuery, onSearchChange }) => {
  return (
    <div className="w-full h-[64px] bg-white rounded-[16px] md:rounded-[20px] px-[16px] flex flex-row items-center justify-between">
      <div className="flex flex-row items-center gap-[16px]">
        <button className="flex flex-row items-center gap-[4px] text-[#A9A9A9]">
          <Filter size={20} />
          <span className="text-[14px] font-bold tracking-[-0.56px] hidden md:block">Filter By</span>
          <span className="text-[14px] font-bold tracking-[-0.56px] block md:hidden">Filter</span>
        </button>
      </div>
      <div className="flex flex-row items-center">
        <div className="flex flex-row items-center w-[228px] md:w-[380px] px-[16px] py-[11px] gap-[10px] rounded-[100px] border border-black/20">
          <Search size={20} className="text-[#A9A9A9]" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 bg-transparent outline-none text-[14px] font-normal tracking-[-0.56px] text-[#111827] placeholder:text-[#A9A9A9] w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
