/**
 * Grades store with forecast support.
 */
import { create } from "zustand";
import api from "../services/api";
import type {
  Grade,
  GradeCreate,
  GradeForecast,
  GradeMethod,
  GradeMethodCreate,
} from "../types";

interface GradeState {
  grades: Grade[];
  forecast: GradeForecast | null;
  methods: GradeMethod[];
  isLoading: boolean;
  fetch: (subjectId: string) => Promise<void>;
  create: (data: GradeCreate) => Promise<void>;
  remove: (id: string, subjectId: string) => Promise<void>;
  fetchForecast: (subjectId: string) => Promise<void>;
  fetchMethods: (subjectId: string) => Promise<void>;
  createMethod: (data: GradeMethodCreate) => Promise<GradeMethod>;
}

export const useGradeStore = create<GradeState>((set, get) => ({
  grades: [],
  forecast: null,
  methods: [],
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

  fetchMethods: async (subjectId) => {
    try {
      const res = await api.get<GradeMethod[]>(
        `/grade-methods?subject_id=${subjectId}`
      );
      set({ methods: res.data });
    } catch {
      set({ methods: [] });
    }
  },

  createMethod: async (data) => {
    const res = await api.post<GradeMethod>("/grade-methods", data);
    set({ methods: [res.data, ...get().methods] });
    return res.data;
  },
}));
