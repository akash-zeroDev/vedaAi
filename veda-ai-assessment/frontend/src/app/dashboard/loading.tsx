import React from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center min-h-[50vh]">
      <Loader2 className="w-10 h-10 animate-spin text-[#F97316] mb-4" />
      <p className="text-gray-500 font-medium animate-pulse">Loading...</p>
    </div>
  );
}
