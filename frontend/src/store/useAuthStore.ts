import { create } from "zustand";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  authReady: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  loadAuth: () => void;
  setAuthReady: (ready: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  authReady: false,
  setAuth: (token, user) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    }
    set({ token, user });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    set({ token: null, user: null });
  },
  loadAuth: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      let user = null;
      if (userStr) {
        try {
          user = JSON.parse(userStr);
        } catch {
          localStorage.removeItem("user");
        }
      }
      set({ token, user });
    }
  },
  setAuthReady: (authReady) => set({ authReady }),
}));
