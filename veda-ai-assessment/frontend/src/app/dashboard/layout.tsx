import React from 'react';
import Sidebar from '@/components/desktop/Sidebar';
import Header from '@/components/desktop/Header';
import MobileHeader from '@/components/mobile/MobileHeader';
import BottomNav from '@/components/mobile/BottomNav';
import FloatingActionButton from '@/components/mobile/FloatingActionButton';
import NavigationLoader from '@/components/desktop/NavigationLoader';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 md:bg-white">
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
        <main className="flex-1 overflow-auto relative z-0 flex flex-col pt-[96px] pb-[120px] px-[16px] md:pt-[56px] md:pb-[64px] md:px-[40px] bg-[#F8FAFC] md:rounded-tl-[32px] border-l border-t border-slate-200/60 shadow-[inset_0_2px_20px_rgba(0,0,0,0.02)]">
          <div className="hidden md:block absolute w-[800px] h-[300px] left-1/2 -translate-x-1/2 top-0 bg-indigo-500/5 blur-[120px] rounded-[100%] pointer-events-none z-0" />
          <NavigationLoader />
          {children}
        </main>
      </div>
    </div>
  );
}
