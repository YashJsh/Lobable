"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signupCall } from "@/api/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2, KeyRound, Mail, User } from "lucide-react";
import Link from "next/link";

// 1. Define Signup Validation Schema
const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupFields = z.infer<typeof signupSchema>;

export default function SignupForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  // 2. Setup React Hook Form with Zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<SignupFields>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
  });

  const onSubmit = async (values: SignupFields) => {
    setLoading(true);
    setServerError(null);
    try {
      const data = await signupCall(values.email.trim(), values.password, values.name.trim());
      if (data.success && data.token && data.user) {
        setAuth(data.token, data.user);
        router.push("/");
      } else {
        setServerError(data.message || "Failed to register");
      }
    } catch (err: any) {
      setServerError(err?.response?.data?.message || "Registration failed or server connection issue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md relative z-10">
      {/* Auth Card wrapper */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/60 backdrop-blur-md p-8 shadow-2xl transition-all duration-300 hover:border-white/15">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-1.5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest text-zinc-500 bg-zinc-950/50">
            LOBABLE AUTH
          </div>
          <h2 className="text-2xl font-light text-zinc-100 tracking-tight font-sans">
            Create Account
          </h2>
          <p className="text-xs text-zinc-500 font-light font-sans">
            Sign up to build and deploy custom sandboxed applications.
          </p>
        </div>

        {/* Server Error message */}
        {serverError && (
          <div className="mb-6 p-3 rounded-lg border border-red-500/20 bg-red-950/10 text-red-400 text-xs font-mono text-center">
            {serverError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
              Full Name
            </label>
            <div className="relative flex items-center group">
              <User className="absolute left-3.5 size-4 text-zinc-600 transition-colors group-focus-within:text-zinc-400" />
              <input
                type="text"
                {...register("name")}
                placeholder="John Doe"
                className={`w-full bg-zinc-900/40 border rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-200 placeholder-zinc-700 outline-none transition-all focus:bg-zinc-900/60 ${
                  errors.name ? "border-red-500/40 focus:border-red-500/60" : "border-white/10 focus:border-white/30"
                }`}
              />
            </div>
            {errors.name && (
              <span className="text-[10px] text-red-400 font-mono mt-1 block">
                {errors.name.message}
              </span>
            )}
          </div>

          {/* Email field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative flex items-center group">
              <Mail className="absolute left-3.5 size-4 text-zinc-600 transition-colors group-focus-within:text-zinc-400" />
              <input
                type="email"
                {...register("email")}
                placeholder="you@example.com"
                className={`w-full bg-zinc-900/40 border rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-200 placeholder-zinc-700 outline-none transition-all focus:bg-zinc-900/60 ${
                  errors.email ? "border-red-500/40 focus:border-red-500/60" : "border-white/10 focus:border-white/30"
                }`}
              />
            </div>
            {errors.email && (
              <span className="text-[10px] text-red-400 font-mono mt-1 block">
                {errors.email.message}
              </span>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
              Password
            </label>
            <div className="relative flex items-center group">
              <KeyRound className="absolute left-3.5 size-4 text-zinc-600 transition-colors group-focus-within:text-zinc-400" />
              <input
                type="password"
                {...register("password")}
                placeholder="••••••••"
                className={`w-full bg-zinc-900/40 border rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-200 placeholder-zinc-700 outline-none transition-all focus:bg-zinc-900/60 ${
                  errors.password ? "border-red-500/40 focus:border-red-500/60" : "border-white/10 focus:border-white/30"
                }`}
              />
            </div>
            {errors.password && (
              <span className="text-[10px] text-red-400 font-mono mt-1 block">
                {errors.password.message}
              </span>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || !isValid}
            className="w-full flex items-center justify-center gap-2 bg-white text-black py-3 rounded-xl text-sm font-medium hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:bg-zinc-900 disabled:text-zinc-600 cursor-pointer disabled:cursor-not-allowed mt-4 shadow-lg shadow-white/5"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        {/* Footer link */}
        <div className="text-center mt-8 pt-6 border-t border-white/5 text-xs text-zinc-500 font-sans">
          Already have an account?{" "}
          <Link href="/signin" className="text-zinc-300 hover:text-white transition-colors underline font-medium">
            Sign in
          </Link>
        </div>

      </div>
    </div>
  );
}
