"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signupCall } from "@/api/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2, KeyRound, Mail, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupFields = z.infer<typeof signupSchema>;

export default function SignupForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

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
      const data = await signupCall(
        values.email.trim(),
        values.password,
        values.name.trim()
      );
      if (data.success && data.token && data.user) {
        setAuth(data.token, data.user);
        router.push("/");
      } else {
        setServerError(data.message || "Failed to register");
      }
    } catch (err: any) {
      setServerError(
        err?.response?.data?.message || "Registration failed or server connection issue."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md relative z-10 border-white/10 bg-zinc-950/60 backdrop-blur-md shadow-2xl transition-all duration-300 hover:border-white/15 ring-0 [--card-spacing:--spacing(8)] gap-0">
      <CardHeader className="text-center space-y-4 pb-8">
        <Badge
          variant="outline"
          className="mx-auto border-white/10 text-[10px] font-mono tracking-widest text-zinc-500 bg-zinc-950/50"
        >
          LOBABLE AUTH
        </Badge>
        <div className="space-y-2">
          <CardTitle className="text-2xl font-light text-zinc-100 tracking-tight font-sans">
            Create Account
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500 font-light font-sans">
            Sign up to build and deploy custom sandboxed applications.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {serverError && (
          <Alert
            variant="destructive"
            className="border-red-500/20 bg-red-950/10 text-red-400"
          >
            <AlertDescription className="text-xs font-mono text-center text-red-400">
              {serverError}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
              Full Name
            </Label>
            <div className="relative flex items-center group">
              <User className="absolute left-3.5 size-4 text-zinc-600 transition-colors group-focus-within:text-zinc-400 z-10" />
              <Input
                type="text"
                {...register("name")}
                placeholder="John Doe"
                className={`h-10 rounded-xl bg-zinc-900/40 pl-11 pr-4 text-sm text-zinc-200 placeholder-zinc-700 transition-all focus:bg-zinc-900/60 ${errors.name
                    ? "border-red-500/40 focus:border-red-500/60"
                    : "border-white/10 focus:border-white/30"
                  }`}
              />
            </div>
            {errors.name && (
              <span className="text-[10px] text-red-400 font-mono mt-1 block">
                {errors.name.message}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
              Email Address
            </Label>
            <div className="relative flex items-center group">
              <Mail className="absolute left-3.5 size-4 text-zinc-600 transition-colors group-focus-within:text-zinc-400 z-10" />
              <Input
                type="email"
                {...register("email")}
                placeholder="you@example.com"
                className={`h-10 rounded-xl bg-zinc-900/40 pl-11 pr-4 text-sm text-zinc-200 placeholder-zinc-700 transition-all focus:bg-zinc-900/60 ${errors.email
                    ? "border-red-500/40 focus:border-red-500/60"
                    : "border-white/10 focus:border-white/30"
                  }`}
              />
            </div>
            {errors.email && (
              <span className="text-[10px] text-red-400 font-mono mt-1 block">
                {errors.email.message}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
              Password
            </Label>
            <div className="relative flex items-center group">
              <KeyRound className="absolute left-3.5 size-4 text-zinc-600 transition-colors group-focus-within:text-zinc-400 z-10" />
              <Input
                type="password"
                {...register("password")}
                placeholder="••••••••"
                className={`h-10 rounded-xl bg-zinc-900/40 pl-11 pr-4 text-sm text-zinc-200 placeholder-zinc-700 transition-all focus:bg-zinc-900/60 ${errors.password
                    ? "border-red-500/40 focus:border-red-500/60"
                    : "border-white/10 focus:border-white/30"
                  }`}
              />
            </div>
            {errors.password && (
              <span className="text-[10px] text-red-400 font-mono mt-1 block">
                {errors.password.message}
              </span>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || !isValid}
            className="w-full h-11 rounded-xl bg-white text-black hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:bg-zinc-900 disabled:text-zinc-600 cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-white/5 font-medium mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Sign Up"
            )}
          </Button>
        </form>

        <Separator className="bg-white/5" />
        <p className="text-center text-xs text-zinc-500 font-sans">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="text-zinc-300 hover:text-white transition-colors underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
