'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useNavigationStore } from '@/store/useNavigationStore';

const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { setIsNavigating } = useNavigationStore();

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (pathname !== path) {
      e.preventDefault();
      setIsNavigating(true);
      router.push(path);
    }
  };

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    if (path !== '/dashboard' && pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '/mobile_home.svg' },
    { path: '/dashboard/assignments', label: 'Assignments', icon: '/mobile_assign.svg' },
    { path: '/dashboard/toolkit', label: 'AI Toolkit', icon: '/mobile_aiToolkit.svg' },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] max-w-[373px] h-[72px] bg-[#181818] rounded-[24px] shadow-[0_32px_48px_rgba(0,0,0,0.20),0_16px_48px_rgba(0,0,0,0.12)]">
      <div className="flex h-full items-center justify-between px-[24px] py-[8px]">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={(e) => handleNav(e, item.path)}
              className={`flex flex-col items-center justify-center gap-[4px] transition-all duration-200 ${
                active ? 'opacity-100 text-white' : 'opacity-40 text-white'
              }`}
            >
              <img
                src={`${item.icon}?v=2`}
                alt={item.label}
                className="w-[20px] h-[20px]"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
              <span className={`font-['Bricolage_Grotesque',sans-serif] text-[12px] tracking-[-0.48px] leading-[16.8px] ${
                active ? 'font-[800]' : 'font-[500]'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
