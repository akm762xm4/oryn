import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PreferencesState {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  setSoundEnabled: (value: boolean) => void;
  setVibrationEnabled: (value: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      vibrationEnabled: true,
      setSoundEnabled: (value) => set({ soundEnabled: value }),
      setVibrationEnabled: (value) => set({ vibrationEnabled: value }),
    }),
    { name: "preferences-storage" }
  )
);
