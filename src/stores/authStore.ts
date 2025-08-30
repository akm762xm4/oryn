import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState, User } from "../types";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (token: string, user: User) => {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        set({ token, user, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
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
