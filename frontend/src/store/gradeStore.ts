/**
 * Grades store with forecast support.
 */
import { create } from "zustand";
import api from "../services/api";
import type { Grade, GradeCreate, GradeForecast } from "../types";

interface GradeState {
  grades: Grade[];
  forecast: GradeForecast | null;
  isLoading: boolean;
  fetch: (subjectId: string) => Promise<void>;
  create: (data: GradeCreate) => Promise<void>;
  remove: (id: string, subjectId: string) => Promise<void>;
  fetchForecast: (subjectId: string) => Promise<void>;
}

export const useGradeStore = create<GradeState>((set, get) => ({
  grades: [],
  forecast: null,
  isLoading: false,

  fetch: async (subjectId) => {
    set({ isLoading: true });
    try {
      const res = await api.get<Grade[]>(`/grades?subject_id=${subjectId}`);
      set({ grades: res.data });
    } finally {
      set({ isLoading: false });
    }
  },

  create: async (data) => {
    const res = await api.post<Grade>("/grades", data);
    set({ grades: [res.data, ...get().grades] });
  },

  remove: async (id, subjectId) => {
    await api.delete(`/grades/${id}`);
    set({ grades: get().grades.filter((g) => g.id !== id) });
    // Refresh forecast after deletion
    await get().fetchForecast(subjectId);
  },

  fetchForecast: async (subjectId) => {
    try {
      const res = await api.get<GradeForecast>(`/grades/forecast/${subjectId}`);
      set({ forecast: res.data });
    } catch {
      set({ forecast: null });
    }
  },
}));
