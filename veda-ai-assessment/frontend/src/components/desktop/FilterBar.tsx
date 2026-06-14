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
    <div className="w-full flex items-center mb-6 relative z-10">
      <div className="flex items-center bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-full px-4 py-2 transition-colors duration-200 w-full max-w-xl">
        <Search size={18} className="text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search assignments..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 bg-transparent focus:outline-none text-slate-900 placeholder-slate-400 text-sm ml-3"
        />
        <div className="w-px h-6 bg-slate-200 mx-3 shrink-0" />
        <div className="relative shrink-0" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 text-slate-600 font-medium text-sm hover:text-slate-900 focus:outline-none transition-colors"
          >
            <Filter size={16} />
            <span>{activeFilter === 'All' ? 'Filter' : activeFilter}</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-[0_12px_32px_-12px_rgba(0,0,0,0.1)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onFilterChange(option);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 flex items-center justify-between transition-colors"
              >
                <span className={activeFilter === option ? 'font-semibold text-indigo-600' : 'font-medium text-slate-600'}>
                  {option}
                </span>
                {activeFilter === option && <Check size={16} className="text-indigo-600" />}
              </button>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
