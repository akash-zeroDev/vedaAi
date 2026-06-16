import React from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { getUserTokenCount } from '@/lib/actions/tokenActions';
import TokenLimitOverlay from '@/components/TokenLimitOverlay';

export default async function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  let totalTokensUsed = 0;
  
  if (session?.user?.id) {
    totalTokensUsed = await getUserTokenCount(session.user.id);
  }

  const AI_TOKEN_CAP = 1_000_000;
  const isExhausted = totalTokensUsed >= AI_TOKEN_CAP;

  return (
    <div className="relative w-full h-full">
      {/* If exhausted, blur the background content and disable pointer events on children */}
      <div className={isExhausted ? "pointer-events-none select-none blur-sm opacity-50" : ""}>
        {children}
      </div>
      
      {isExhausted && <TokenLimitOverlay />}
    </div>
  );
}
