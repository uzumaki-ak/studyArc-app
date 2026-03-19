import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface GameState {
  xp: number;
  level: number;
  hearts: number;
  streak: number;
  userId: string | null;
  userName: string | null;
  userRole: string | null;
  setUser: (id: string, name: string, role: string) => void;
  setXP: (xp: number) => void;
  setLevel: (level: number) => void;
  setHearts: (hearts: number) => void;
  setStreak: (streak: number) => void;
  clearUser: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      xp: 0,
      level: 1,
      hearts: 5,
      streak: 0,
      userId: null,
      userName: null,
      userRole: null,
      setUser: (id, name, role) => set({ userId: id, userName: name, userRole: role }),
      setXP: (xp) => set({ xp }),
      setLevel: (level) => set({ level }),
      setHearts: (hearts) => set({ hearts }),
      setStreak: (streak) => set({ streak }),
      clearUser: () => set({ userId: null, userName: null, userRole: null, xp: 0, level: 1, hearts: 5, streak: 0 }),
    }),
    {
      name: "studyarc-game",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
