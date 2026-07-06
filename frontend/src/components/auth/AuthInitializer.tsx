"use client";

import React, { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const loadAuth = useAuthStore((state) => state.loadAuth);

  useEffect(() => {
    loadAuth();
  }, [loadAuth]);

  return <>{children}</>;
}
