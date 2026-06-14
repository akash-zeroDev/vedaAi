'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Bell, ChevronDown, User as UserIcon, LogOut } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isTopLevelTab = [
    '/dashboard',
    '/dashboard/groups',
    '/dashboard/assignments',
    '/dashboard/toolkit',
    '/dashboard/library',
    '/dashboard/settings'
  ].includes(pathname);

  const showBackButton = !isTopLevelTab;
  
  const userName = session?.user?.name || 'Loading...';
  const userImage = (session?.user as any)?.image;

  return (
    <header className="w-full h-[72px] bg-white flex flex-row items-center justify-between px-[24px] border-b border-[#E5E7EB]">
      <div className="flex items-center gap-[16px]">
        {showBackButton && (
          <button 
            onClick={() => router.back()}
            className="w-[40px] h-[40px] rounded-[100px] bg-white border border-[#E5E7EB] flex items-center justify-center shadow-sm hover:bg-[#F9FAFB] transition-colors"
          >
            <ArrowLeft size={20} className="text-[#111827]" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-[24px]">
        <button className="relative p-[8px] hover:bg-[#F3F4F6] rounded-[100px] transition-colors">
          <Bell size={24} className="text-[#111827]" />
          <span className="absolute top-[8px] right-[10px] w-[8px] h-[8px] bg-[#F97316] rounded-[100px] border-2 border-white"></span>
        </button>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-[8px] py-[6px] px-[12px] rounded-[100px] hover:bg-[#F3F4F6] transition-colors shadow-[0_32px_48px_rgba(0,0,0,0.20),0_16px_48px_rgba(0,0,0,0.12)] bg-white border border-[#E5E7EB]"
          >
            <div className="w-[32px] h-[32px] rounded-[100px] bg-[#E5E7EB] flex items-center justify-center overflow-hidden text-[#111827] font-semibold text-sm">
              {userImage ? (
                <img src={userImage} alt={userName} className="w-full h-full object-cover" />
              ) : session?.user?.name ? (
                session.user.name[0].toUpperCase()
              ) : (
                <UserIcon size={16} />
              )}
            </div>
            <span className="text-[14px] font-semibold text-[#111827]">{userName}</span>
            <ChevronDown size={16} className="text-[#111827]" />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-50 overflow-hidden py-1">
              <Link 
                href="/dashboard/settings" 
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[#374151] hover:bg-[#F9FAFB] transition-colors"
                onClick={() => setIsDropdownOpen(false)}
              >
                <UserIcon size={16} />
                Profile
              </Link>
              <button 
                onClick={() => {
                  setIsDropdownOpen(false);
                  signOut({ callbackUrl: '/auth' });
                }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <LogOut size={16} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
