'use client';
import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Loader2, Calendar, Clock } from 'lucide-react';
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
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] transition-all duration-200 hover:shadow-md hover:border-slate-200 relative group cursor-pointer"
         onClick={() => router.push(`/dashboard/output/${assignment.id}`)}
    >
      <h2 className="text-lg font-semibold text-slate-900 mb-4 pr-8 line-clamp-1">
        {assignment.title}
      </h2>

      <div className="flex items-center gap-4 text-sm text-slate-500">
        <span>Assigned on <span className="font-medium text-slate-700">{assignment.assignedOn}</span></span>
        <span>Due <span className="font-medium text-slate-700">{assignment.dueDate}</span></span>
      </div>

      <div className="absolute right-4 top-4" ref={popoverRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsPopoverOpen(!isPopoverOpen);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 rounded-full p-2 focus:opacity-100 text-slate-400 hover:text-slate-600"
        >
          <MoreVertical size={18} />
        </button>

        {isPopoverOpen && (
          <div className="absolute right-0 top-10 w-44 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1)] p-1.5 z-20 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-200"
               onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                setIsViewing(true);
                router.push(`/dashboard/output/${assignment.id}`);
              }}
              disabled={isViewing}
              className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors disabled:opacity-50"
            >
              {isViewing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isViewing ? 'Opening...' : 'View Details'}
            </button>
            <div className="h-px bg-slate-100 my-0.5 mx-2" />
            <button
              onClick={() => {
                setIsPopoverOpen(false);
                setIsDeleteDialogOpen(true);
              }}
              className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 scale-100 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900">Delete Assignment?</h3>
            <p className="text-slate-500 text-sm">
              Are you sure you want to delete <span className="font-medium text-slate-900">"{assignment.title}"</span>? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    setIsDeleting(true);
                    const { apiFetch } = require('@/lib/api');
                    const res = await apiFetch(`/api/assignments/${assignment.id}`, { method: 'DELETE' });
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
                className="flex-1 flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentCard;
