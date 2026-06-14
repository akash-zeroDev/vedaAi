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
        const { apiFetch } = require('@/lib/api');
        const res = await apiFetch('/api/assignments');
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
    <div className="relative z-10 flex flex-col w-full h-full gap-8">
      <PageHeader>
        <button
          onClick={() => {
            store.resetForm();
            setIsNavigatingToCreate(true);
            router.push('/dashboard/create');
          }}
          disabled={isNavigatingToCreate}
          className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-full transition-colors shadow-sm disabled:opacity-50"
        >
          {isNavigatingToCreate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={18} strokeWidth={2.5} />}
          <span>Create Assignment</span>
        </button>
      </PageHeader>
      {assignments.length > 0 && (
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      )}
      <div className="flex-1 flex flex-col">
        {isLoading ? (
          <div className="w-full flex-1 flex flex-col items-center justify-center pb-[10vh] gap-4">
            <div className="relative flex items-center justify-center w-24 h-24 mb-2">
              <div className="absolute inset-0 bg-[#F97316]/10 rounded-full animate-ping"></div>
              <div className="absolute inset-2 bg-[#F97316]/20 rounded-full animate-pulse"></div>
              <div className="relative flex items-center justify-center w-14 h-14 bg-white rounded-full shadow-sm border border-gray-100 z-10">
                <Loader2 className="w-6 h-6 text-[#F97316] animate-spin" />
              </div>
            </div>
            <p className="text-gray-500 font-medium text-[15px]">Loading assignments...</p>
          </div>
        ) : filteredAssignments.length > 0 ? (
            <AssignmentGrid assignments={filteredAssignments} onDelete={handleDelete} />
        ) : (
          <div className="w-full flex-1 flex flex-col items-center justify-center pb-[12vh] gap-0">
            <div className="flex flex-col items-center max-w-[400px] text-center">
              <svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-[24px]">
                {/* Background Circle */}
                <circle cx="120" cy="120" r="95" fill="#F4F4F5" />

                {/* Top Right Pill */}
                <g filter="url(#empty-shadow)">
                  <rect x="150" y="45" width="48" height="24" rx="12" fill="white" />
                  <circle cx="162" cy="57" r="4" fill="#A78BFA" />
                  <rect x="172" y="53" width="16" height="8" rx="4" fill="#DDD6FE" />
                </g>

                {/* Left Squiggle */}
                <path d="M55 85 C 35 75, 45 45, 65 65 C 80 80, 50 105, 40 85" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />

                {/* Bottom Left Sparkle */}
                <path d="M65 155 Q 70 155 70 150 Q 70 155 75 155 Q 70 155 70 160 Q 70 155 65 155 Z" fill="#3B82F6" stroke="#3B82F6" strokeWidth="2" strokeLinejoin="round" />

                {/* Right Dot */}
                <circle cx="185" cy="100" r="3.5" fill="#3B82F6" />

                {/* Document */}
                <g filter="url(#empty-shadow-lg)">
                  <rect x="80" y="60" width="80" height="100" rx="8" fill="white" />
                  <rect x="92" y="76" width="32" height="8" rx="4" fill="#111827" />
                  <rect x="92" y="96" width="56" height="6" rx="3" fill="#E5E7EB" />
                  <rect x="92" y="112" width="56" height="6" rx="3" fill="#E5E7EB" />
                  <rect x="92" y="128" width="40" height="6" rx="3" fill="#E5E7EB" />
                  <rect x="92" y="144" width="24" height="6" rx="3" fill="#E5E7EB" />
                </g>

                {/* Magnifying Glass */}
                <g>
                  {/* Handle */}
                  <line x1="145" y1="145" x2="168" y2="168" stroke="#E5E0F1" strokeWidth="14" strokeLinecap="round" />
                  {/* Lens Rim & Background */}
                  <circle cx="120" cy="120" r="40" fill="rgba(238, 235, 245, 0.85)" stroke="white" strokeWidth="6" />

                  {/* Red X */}
                  <line x1="106" y1="106" x2="134" y2="134" stroke="#EF4444" strokeWidth="8" strokeLinecap="round" />
                  <line x1="134" y1="106" x2="106" y2="134" stroke="#EF4444" strokeWidth="8" strokeLinecap="round" />
                </g>

                <defs>
                  <filter id="empty-shadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.05" />
                  </filter>
                  <filter id="empty-shadow-lg" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000000" floodOpacity="0.08" />
                  </filter>
                </defs>
              </svg>
              <h3 className="text-[20px] md:text-[24px] font-bold text-[#111827] tracking-[-0.64px] mb-[12px]">No assignments yet</h3>
              <p className="text-[#5E5E5E] text-[14px] leading-[20px] text-center max-w-[340px] mb-[24px] font-medium tracking-[-0.28px]">
                Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
              </p>
              <button
                onClick={() => {
                  store.resetForm();
                  setIsNavigatingToCreate(true);
                  router.push('/dashboard/create');
                }}
                disabled={isNavigatingToCreate}
                className="pointer-events-auto flex flex-row items-center justify-center gap-[8px] px-[24px] py-[14px] bg-[#181818] rounded-[100px] text-white shadow-lg transition-transform hover:scale-105 disabled:opacity-50"
              >
                {isNavigatingToCreate ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus size={20} className="text-white" strokeWidth={2.5} />}
                <span className="font-['Bricolage_Grotesque',sans-serif] text-[15px] font-[600] tracking-[-0.3px]">
                  Create Your First Assignment
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
