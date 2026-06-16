'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Bell, ChevronDown, User as UserIcon, LogOut } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, update } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    schoolName: '',
    className: ''
  });

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        schoolName: session.user.schoolName || '',
        className: (session.user as any).className || ''
      });
    }
  }, [session]);

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
  const userEmail = session?.user?.email || '';

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        await update({ 
          name: formData.name, 
          schoolName: formData.schoolName, 
          className: formData.className 
        });
        setIsDropdownOpen(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

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
            <div className="w-[32px] h-[32px] rounded-[100px] bg-indigo-100 flex items-center justify-center overflow-hidden text-indigo-700 font-bold text-[16px]">
              {session?.user?.name ? (
                session.user.name[0].toUpperCase()
              ) : (
                <UserIcon size={16} />
              )}
            </div>
            <span className="text-[14px] font-semibold text-[#111827]">{userName}</span>
            <ChevronDown size={16} className="text-[#111827]" />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-[300px] bg-white border border-[#E5E7EB] rounded-2xl shadow-xl z-50 overflow-hidden py-3 px-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1 border-b border-gray-100 pb-3 mb-1">
                <span className="text-[16px] font-bold text-slate-900">Profile Settings</span>
                <span className="text-[12px] text-slate-500">Update your account details.</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-slate-700 ml-1">Email</label>
                <input 
                  type="email" 
                  value={userEmail} 
                  disabled 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-500 text-[13px] rounded-lg px-3 py-2 cursor-not-allowed outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-slate-700 ml-1">Full Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-[13px] rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="Enter your name"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-slate-700 ml-1">School Name</label>
                <input 
                  type="text" 
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-[13px] rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="e.g. DPS Bokaro"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-semibold text-slate-700 ml-1">Class / Grade</label>
                <input 
                  type="text" 
                  value={formData.className}
                  onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-[13px] rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="e.g. 5th, 8th"
                />
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <button 
                  onClick={handleSaveProfile}
                  disabled={isSaving || !formData.name}
                  className="w-full bg-indigo-600 text-white text-[13px] font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
                <button 
                  onClick={() => {
                    setIsDropdownOpen(false);
                    signOut({ callbackUrl: '/auth' });
                  }}
                  className="w-full bg-red-50 text-red-600 text-[13px] font-semibold py-2.5 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut size={16} />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
