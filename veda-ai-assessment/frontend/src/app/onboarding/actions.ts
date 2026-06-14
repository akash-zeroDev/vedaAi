"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongoose";
import { User } from "@/lib/models/User";

export async function completeOnboarding(formData: FormData) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const schoolName = formData.get("schoolName") as string;

  if (!schoolName || schoolName.trim() === "") {
    throw new Error("School name is required");
  }

  await connectToDatabase();
  
  await User.findOneAndUpdate(
    { email: session.user.email },
    { 
      $set: { 
        schoolName: schoolName.trim(), 
        isOnboarded: true 
      } 
    },
    { new: true, upsert: true }
  );

  return { success: true };
}
