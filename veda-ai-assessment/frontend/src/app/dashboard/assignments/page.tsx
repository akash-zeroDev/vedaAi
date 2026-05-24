'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/desktop/PageHeader';
import FilterBar, { FilterOption } from '@/components/desktop/FilterBar';
import AssignmentGrid from '@/components/desktop/AssignmentGrid';
import { Assignment } from '@/components/desktop/AssignmentCard';
import { Loader2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAssessmentStore } from '@/store/useAssessmentStore';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigatingToCreate, setIsNavigatingToCreate] = useState(false);
  const router = useRouter();
  const store = useAssessmentStore();

  useEffect(() => {
    store.resetForm();
    const fetchAssignments = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/assignments');
        if (!res.ok) throw new Error('Failed to fetch assignments');
        const data = await res.json();
        
        const mappedData: Assignment[] = data.map((item: any) => {
          const date = item.createdAt ? new Date(item.createdAt) : null;
          const formattedDate = date && !isNaN(date.getTime()) 
            ? `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear().toString().slice(-2)}`
            : 'Unknown';
          
          return {
            id: item._id,
            title: item.title || 'Untitled Assignment',
            assignedOn: formattedDate,
            dueDate: item.dueDate || 'Not specified',
          };
        });
        
        setAssignments(mappedData);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  const handleDelete = (id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesDate = true;
    if (activeFilter !== 'All') {
      const parts = assignment.assignedOn.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = 2000 + parseInt(parts[2], 10);
        const assignDate = new Date(year, month, day);
        
        const now = new Date();
        const diffTime = now.getTime() - assignDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        if (activeFilter === 'Last 7 Days') {
          matchesDate = diffDays <= 7;
        } else if (activeFilter === 'Last 30 Days') {
          matchesDate = diffDays <= 30;
        }
      }
    }

    return matchesSearch && matchesDate;
  });

  return (
    <div className="flex flex-col  w-full min-h-full pt-[96px] pb-[120px] px-[16px] md:pt-[48px] md:pb-[48px] md:px-[48px] gap-[24px] bg-[#FFFFFF] md:rounded-tl-[40px]">
      <PageHeader />
      <FilterBar 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery} 
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />
      <div className="mt-4 ">
        {isLoading ? (
          <div className="w-full flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#F97316]" />
          </div>
        ) : filteredAssignments.length > 0 ? (
          <AssignmentGrid assignments={filteredAssignments} onDelete={handleDelete} />
        ) : (
          <div className="w-full flex flex-col items-center justify-center py-16 gap-4">
             <div className="flex flex-col items-center max-w-[400px] text-center gap-4">
                <svg width="180" height="180" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4">
                  <circle cx="60" cy="60" r="50" fill="#F3F4F6"/>
                  <rect x="35" y="25" width="50" height="70" rx="8" fill="white" stroke="#E5E7EB" strokeWidth="4"/>
                  <line x1="45" y1="40" x2="75" y2="40" stroke="#E5E7EB" strokeWidth="4" strokeLinecap="round"/>
                  <line x1="45" y1="55" x2="75" y2="55" stroke="#E5E7EB" strokeWidth="4" strokeLinecap="round"/>
                  <line x1="45" y1="70" x2="65" y2="70" stroke="#E5E7EB" strokeWidth="4" strokeLinecap="round"/>
                  <circle cx="70" cy="70" r="20" fill="white" stroke="#D1D5DB" strokeWidth="6"/>
                  <line x1="84" y1="84" x2="100" y2="100" stroke="#D1D5DB" strokeWidth="8" strokeLinecap="round"/>
                  <line x1="62" y1="62" x2="78" y2="78" stroke="#EF4444" strokeWidth="6" strokeLinecap="round"/>
                  <line x1="78" y1="62" x2="62" y2="78" stroke="#EF4444" strokeWidth="6" strokeLinecap="round"/>
                </svg>
                <h3 className="text-xl font-bold text-[#111827]">No assignments yet</h3>
                <p className="text-[#4B5563] text-sm leading-relaxed mb-4">
                  Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
                </p>
                <button 
                  onClick={() => {
                    store.resetForm();
                    setIsNavigatingToCreate(true);
                    router.push('/dashboard/create');
                  }}
                  disabled={isNavigatingToCreate}
                  className="pointer-events-auto flex flex-row items-center justify-center gap-[10px] px-[24px] py-[12px] bg-[#181818] rounded-[100px] text-white shadow-lg transition-transform hover:scale-105 disabled:opacity-50"
                >
                  {isNavigatingToCreate ? <Loader2 className="w-5 h-5 animate-spin" /> : <img src="/aiStars.svg" alt="Create" className="w-[20px] h-[20px]" />}
                  <span className="font-['Bricolage_Grotesque',sans-serif] text-[15px] font-[500]">
                    Create Your First Assignment
                  </span>
                </button>
             </div>
          </div>
        )}
      </div>

      {filteredAssignments.length > 0 && (
        <div className="sticky bottom-[32px] w-full flex justify-center z-50 pointer-events-none">
          <button 
            onClick={() => {
              store.resetForm();
              setIsNavigatingToCreate(true);
              router.push('/dashboard/create');
            }}
            disabled={isNavigatingToCreate}
            className="pointer-events-auto flex flex-row items-center justify-center gap-[10px] px-[32px] py-[16px] bg-[#181818] rounded-[100px] text-white shadow-[0_32px_48px_rgba(0,0,0,0.2),0_16px_48px_rgba(0,0,0,0.12)] transition-transform hover:scale-105 disabled:opacity-50"
          >
            {isNavigatingToCreate ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <img src="/aiStars.svg" alt="Create" className="w-[20px] h-[20px]" />
            )}
            <span className="font-['Bricolage_Grotesque',sans-serif] text-[16px] font-[500] tracking-[-0.64px]">
              Create Assignment
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
