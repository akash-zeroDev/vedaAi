import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/auth");
  }

  if (session.user.isOnboarded && session.user.schoolName) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 bg-white border border-slate-200 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome to Graphite, {session.user.name}!</h2>
          <p className="text-sm text-slate-500 mt-2">
            To get started, we just need to know which school or institution you belong to.
          </p>
        </div>

        <OnboardingForm />
      </div>
    </div>
  );
}
