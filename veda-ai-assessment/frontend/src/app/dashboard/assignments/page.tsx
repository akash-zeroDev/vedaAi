'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/desktop/PageHeader';
import FilterBar from '@/components/desktop/FilterBar';
import AssignmentGrid from '@/components/desktop/AssignmentGrid';
import { Assignment } from '@/components/desktop/AssignmentCard';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/assignments');
        if (!res.ok) throw new Error('Failed to fetch assignments');
        const data = await res.json();
        
        const mappedData: Assignment[] = data.map((item: any) => {
          // Format date from ISO string to DD-MM-YYYY
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

  const filteredAssignments = assignments.filter((assignment) =>
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full h-full pt-[96px] pb-[120px] px-[16px] md:pt-[48px] md:pb-[48px] md:px-[48px] gap-[24px]">
      <PageHeader />
      <FilterBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <div className="mt-4">
        {isLoading ? (
          <div className="w-full flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#F97316]" />
          </div>
        ) : (
          <AssignmentGrid assignments={filteredAssignments} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}
