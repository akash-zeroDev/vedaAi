'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useNavigationStore } from '@/store/useNavigationStore';
import { Loader2 } from 'lucide-react';

export default function NavigationLoader() {
  const pathname = usePathname();
  const { isNavigating, setIsNavigating } = useNavigationStore();

  useEffect(() => {
    // Whenever the pathname changes, the navigation is complete
    setIsNavigating(false);
  }, [pathname, setIsNavigating]);

  if (!isNavigating) return null;

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#CECECE] md:bg-[#F9FAFB] min-h-[50vh]">
      <div className="relative flex items-center justify-center w-24 h-24 mb-2">
        <div className="absolute inset-0 bg-[#F97316]/10 rounded-full animate-ping"></div>
        <div className="absolute inset-2 bg-[#F97316]/20 rounded-full animate-pulse"></div>
        <div className="relative flex items-center justify-center w-14 h-14 bg-white rounded-full shadow-sm border border-gray-100 z-10">
          <Loader2 className="w-6 h-6 text-[#F97316] animate-spin" />
        </div>
      </div>
      <p className="text-gray-500 font-medium animate-pulse mt-4">Loading...</p>
    </div>
  );
}
