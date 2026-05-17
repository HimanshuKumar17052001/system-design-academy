"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { modules } from "@/data/curriculum";
import type { UserProgress } from "@/types/curriculum";
import { syncProgressToDB } from "./progress-db";

interface ProgressState extends UserProgress {
  markModuleComplete: (id: string) => void;
  recordQuizScore: (quizId: string, score: number) => void;
  markLabComplete: (labId: string) => void;
  addBookmark: (moduleId: string) => void;
  removeBookmark: (moduleId: string) => void;
  recordStudyTime: (minutes: number) => void;
  setLastVisited: (moduleId: string) => void;
  resetProgress: () => void;
  getModuleStatus: (moduleId: string) => "locked" | "available" | "in-progress" | "completed";
  setUserId: (userId: string | null) => void;
  _userId: string | null;
}

const initialState: UserProgress = {
  completedModules: [],
  moduleScores: {},
  quizScores: {},
  labCompletions: {},
  bookmarks: [],
  lastVisited: "",
  totalStudyTimeMinutes: 0,
};

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

function debouncedSync(userId: string | null, state: UserProgress) {
  if (!userId) return;
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    syncProgressToDB(userId, state).catch(() => {
      // Silently fail — localStorage is the source of truth as fallback
    });
  }, 2000);
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...initialState,
      _userId: null,

      setUserId: (userId: string | null) => set({ _userId: userId }),

      markModuleComplete: (id: string) =>
        set((state) => {
          const next = {
            completedModules: state.completedModules.includes(id)
              ? state.completedModules
              : [...state.completedModules, id],
          };
          debouncedSync(state._userId, { ...state, ...next });
          return next;
        }),

      recordQuizScore: (quizId: string, score: number) =>
        set((state) => {
          const next = { quizScores: { ...state.quizScores, [quizId]: score } };
          debouncedSync(state._userId, { ...state, ...next });
          return next;
        }),

      markLabComplete: (labId: string) =>
        set((state) => {
          const next = { labCompletions: { ...state.labCompletions, [labId]: true } };
          debouncedSync(state._userId, { ...state, ...next });
          return next;
        }),

      addBookmark: (moduleId: string) =>
        set((state) => ({
          bookmarks: state.bookmarks.includes(moduleId)
            ? state.bookmarks
            : [...state.bookmarks, moduleId],
        })),

      removeBookmark: (moduleId: string) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter((id) => id !== moduleId),
        })),

      recordStudyTime: (minutes: number) =>
        set((state) => {
          const next = { totalStudyTimeMinutes: state.totalStudyTimeMinutes + minutes };
          debouncedSync(state._userId, { ...state, ...next });
          return next;
        }),

      setLastVisited: (moduleId: string) =>
        set((state) => {
          const next = { lastVisited: moduleId };
          debouncedSync(state._userId, { ...state, ...next });
          return next;
        }),

      resetProgress: () => set(initialState),

      getModuleStatus: (moduleId: string) => {
        const state = get();
        const { completedModules } = state;
        const module = modules.find((m) => m.id === moduleId);
        if (!module) return "locked";

        if (completedModules.includes(moduleId)) return "completed";

        const prereqsMet = module.prerequisites.every((p: string) =>
          completedModules.includes(p)
        );
        if (!prereqsMet) return "locked";

        return "available";
      },
    }),
    {
      name: "sda-progress",
    }
  )
);
