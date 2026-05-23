import React from 'react';
import Sidebar from '@/components/desktop/Sidebar';
import Header from '@/components/desktop/Header';
import MobileHeader from '@/components/mobile/MobileHeader';
import BottomNav from '@/components/mobile/BottomNav';
import FloatingActionButton from '@/components/mobile/FloatingActionButton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F3F4F6]">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      
      <div className="block md:hidden">
        <MobileHeader />
        <BottomNav />
        <FloatingActionButton />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="hidden md:block">
          <Header />
        </div>
        <main className="flex-1 overflow-auto relative">
          {children}
        </main>
      </div>
    </div>
  );
}
