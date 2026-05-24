import React from 'react';
import AssignmentCard, { Assignment } from './AssignmentCard';

interface AssignmentGridProps {
  assignments: Assignment[];
  onDelete?: (id: string) => void;
}

const AssignmentGrid: React.FC<AssignmentGridProps> = ({ assignments, onDelete }) => {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-[20px] md:gap-x-[16px] md:gap-y-[20px]">
      {assignments.length > 0 ? (
        assignments.map((assignment) => (
          <AssignmentCard key={assignment.id} assignment={assignment} onDelete={onDelete} />
        ))
      ) : (
        <div className="col-span-full py-12 text-center text-[#5E5E5E]">
          No assignments found matching your search.
        </div>
      )}
    </div>
  );
};

export default AssignmentGrid;
