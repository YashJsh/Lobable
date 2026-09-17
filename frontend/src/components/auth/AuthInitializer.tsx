"use client";

import React, { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { validateSession } from "@/api/auth";

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const loadAuth = useAuthStore((state) => state.loadAuth);
  const setAuth = useAuthStore((state) => state.setAuth);
  const logout = useAuthStore((state) => state.logout);
  const setAuthReady = useAuthStore((state) => state.setAuthReady);

  useEffect(() => {
    loadAuth();

    const validate = async () => {
      const token = useAuthStore.getState().token;
      if (!token) {
        setAuthReady(true);
        return;
      }

      try {
        const data = await validateSession();
        if (data.success && data.user) {
          setAuth(token, data.user);
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        setAuthReady(true);
      }
    };

    validate();
  }, [loadAuth, setAuth, logout, setAuthReady]);

  return <>{children}</>;
}
