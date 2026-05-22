'use client';

import { useEffect } from 'react';
import { useSocketStore } from '@/store/useSocketStore';

export default function Dashboard() {
  const { isConnected, connect, disconnect } = useSocketStore();

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-6">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            VedaAI Workspace
          </h1>
          
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full">
            <div className="relative flex h-3 w-3">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </div>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              {isConnected ? 'Gateway Connected' : 'Gateway Disconnected'}
            </span>
          </div>
        </div>

        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
          <p className="text-slate-500 dark:text-slate-400">
            System initialization complete. Awaiting assessment modules.
          </p>
        </div>
      </div>
    </main>
  );
}
