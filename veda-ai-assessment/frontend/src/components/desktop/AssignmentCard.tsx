'use client';
import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface Assignment {
  id: string;
  title: string;
  assignedOn: string;
  dueDate: string;
}

interface AssignmentCardProps {
  assignment: Assignment;
  onDelete?: (id: string) => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({ assignment, onDelete }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col bg-white rounded-[24px] p-[20px] md:p-[24px] border border-[#E5E7EB] shadow-[0_4px_12px_rgba(0,0,0,0.05)] w-full">
      <div className="flex flex-col gap-[24px] md:gap-[48px] h-full justify-between">
        <div className="flex flex-row items-start justify-between w-full">
          <h2 className="text-[#2F2F2F] text-[18px] md:text-[24px] font-extrabold tracking-[-0.72px] md:tracking-[-0.96px] leading-[25.2px] md:leading-[28.8px]">
            {assignment.title}
          </h2>
          <div className="relative" ref={popoverRef}>
            <button
              onClick={() => setIsPopoverOpen(!isPopoverOpen)}
              className="p-[4px] hover:bg-[#F3F4F6] rounded-[100px] transition-colors text-[#A9A9A9]"
            >
              <MoreVertical size={24} />
            </button>
            
            {isPopoverOpen && (
              <div className="absolute right-0 top-[32px] w-[180px] bg-white rounded-[12px] shadow-[0_16px_32px_rgba(0,0,0,0.12)] border border-[#E5E7EB] py-[8px] z-10 flex flex-col">
                <button 
                  onClick={() => {
                    setIsViewing(true);
                    router.push(`/dashboard/output/${assignment.id}`);
                  }}
                  disabled={isViewing}
                  className="w-full flex items-center gap-2 text-left px-[16px] py-[10px] text-[14px] font-medium text-[#4B5563] hover:bg-[#F9FAFB] transition-colors disabled:opacity-50"
                >
                  {isViewing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isViewing ? 'Loading...' : 'View Assignment'}
                </button>
                <button 
                  onClick={() => {
                    setIsPopoverOpen(false);
                    setIsDeleteDialogOpen(true);
                  }}
                  className="w-full text-left px-[16px] py-[10px] text-[14px] font-medium text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-[10px] md:gap-0">
          <span className="text-black/50 text-[16px] font-normal tracking-[-0.64px] leading-[19.2px]">
            <span className="font-extrabold text-[#2F2F2F]">Assigned on : </span>{assignment.assignedOn}
          </span>
          <span className="text-black/50 text-[16px] font-normal tracking-[-0.64px] leading-[19.2px]">
            <span className="font-extrabold text-[#2F2F2F]">Due : </span>{assignment.dueDate}
          </span>
        </div>
      </div>

      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4">
            <h3 className="text-xl font-bold text-[#111827]">Delete Assignment?</h3>
            <p className="text-[#4B5563] text-sm">
              Are you sure you want to delete <span className="font-semibold">"{assignment.title}"</span>? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <button 
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-[#4B5563] bg-gray-100 hover:bg-gray-200 rounded-[100px] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    setIsDeleting(true);
                    const res = await fetch(`http://localhost:8000/api/assignments/${assignment.id}`, { method: 'DELETE' });
                    if (res.ok) {
                      setIsDeleteDialogOpen(false);
                      if (onDelete) onDelete(assignment.id);
                    }
                  } catch (error) {
                    console.error('Delete failed:', error);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
                className="flex-1 flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-[100px] transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentCard;
