"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "./actions";
import { Loader2 } from "lucide-react";

export default function OnboardingForm() {
  const { update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const schoolName = formData.get("schoolName") as string;
    
    try {
      await completeOnboarding(formData);
      // Update NextAuth session cookie
      await update({ isOnboarded: true, schoolName });
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">School / Institution Name</label>
        <input 
          type="text" 
          name="schoolName"
          required
          placeholder="e.g. Lincoln High School"
          className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-black"
        />
      </div>
      <button 
        type="submit" 
        disabled={isLoading}
        className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue to Dashboard"}
      </button>
    </form>
  );
}
