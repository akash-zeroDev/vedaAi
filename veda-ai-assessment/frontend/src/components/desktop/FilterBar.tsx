import React, { useState, useRef, useEffect } from 'react';
import { Filter, Search, ChevronDown, Check } from 'lucide-react';

export type FilterOption = 'All' | 'Last 7 Days' | 'Last 30 Days';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ searchQuery, onSearchChange, activeFilter, onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const options: FilterOption[] = ['All', 'Last 7 Days', 'Last 30 Days'];
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full flex flex-row items-center justify-between px-[16px] py-[12px] bg-white rounded-[16px] shadow-sm">
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`flex flex-row items-center gap-[8px] transition-colors ${activeFilter !== 'All' ? 'text-[#F97316]' : 'text-[#A9A9A9]'}`}
        >
          <Filter size={18} className={activeFilter !== 'All' ? 'text-[#F97316]' : 'text-[#A9A9A9]'} />
          <span className="font-['Bricolage_Grotesque',sans-serif] font-[500] text-[14px]">
            Filter {activeFilter !== 'All' ? `: ${activeFilter}` : ''}
          </span>
          <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onFilterChange(option);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center justify-between transition-colors"
              >
                <span className={activeFilter === option ? 'font-semibold text-[#111827]' : 'text-[#4B5563]'}>
                  {option}
                </span>
                {activeFilter === option && <Check size={16} className="text-[#F97316]" />}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-row items-center flex-1 justify-end ml-4">
        <div className="flex flex-row items-center flex-1 w-full max-w-[380px] px-[16px] py-[10px] gap-[8px] bg-white rounded-[100px] border border-[#E5E7EB]">
          <Search size={18} className="text-[#A9A9A9] shrink-0" />
          <input
            type="text"
            placeholder="Search Name"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 bg-transparent outline-none font-['Bricolage_Grotesque',sans-serif] font-[400] text-[14px] text-[#111827] placeholder:text-[#A9A9A9] w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
