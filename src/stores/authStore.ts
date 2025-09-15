import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState, User } from "../types";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (token: string, user: User, remember = true) => {
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem("token", token);
        storage.setItem("user", JSON.stringify(user));
        // Ensure opposite storage is cleared to avoid confusion
        (remember ? sessionStorage : localStorage).removeItem("token");
        (remember ? sessionStorage : localStorage).removeItem("user");
        set({ token, user, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        set({ token: null, user: null, isAuthenticated: false });
      },

      updateUser: (updatedUser: Partial<User>) => {
        set((state) => {
          if (!state.user) return state;

          const newUser = { ...state.user, ...updatedUser };
          localStorage.setItem("user", JSON.stringify(newUser));

          return {
            ...state,
            user: newUser,
          };
        });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Listen for auth logout events from API interceptor
if (typeof window !== "undefined") {
  window.addEventListener("auth:logout", () => {
    const { logout } = useAuthStore.getState();
    logout();
  });
}
