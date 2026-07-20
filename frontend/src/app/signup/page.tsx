"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SignupForm from "@/components/auth/SignupForm";
import { useAuthStore } from "@/store/useAuthStore";

export default function SignupPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (token) {
      router.replace("/");
    }
  }, [token, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white px-4 selection:bg-white selection:text-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f0f0f_1px,transparent_1px),linear-gradient(to_bottom,#0f0f0f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      <SignupForm />
    </div>
  );
}  
