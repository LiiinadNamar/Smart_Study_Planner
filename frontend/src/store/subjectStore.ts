/**
 * Subjects store.
 */
import { create } from "zustand";
import api from "../services/api";
import type { Subject, SubjectCreate, SubjectUpdate } from "../types";

interface SubjectState {
  subjects: Subject[];
  isLoading: boolean;
  fetch: () => Promise<void>;
  create: (data: SubjectCreate) => Promise<Subject>;
  update: (id: string, data: SubjectUpdate) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useSubjectStore = create<SubjectState>((set, get) => ({
  subjects: [],
  isLoading: false,

  fetch: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get<Subject[]>("/subjects");
      set({ subjects: res.data });
    } finally {
      set({ isLoading: false });
    }
  },

  create: async (data) => {
    const res = await api.post<Subject>("/subjects", data);
    set({ subjects: [res.data, ...get().subjects] });
    return res.data;
  },

  update: async (id, data) => {
    const res = await api.put<Subject>(`/subjects/${id}`, data);
    set({
      subjects: get().subjects.map((s) => (s.id === id ? res.data : s)),
    });
  },

  remove: async (id) => {
    await api.delete(`/subjects/${id}`);
    set({ subjects: get().subjects.filter((s) => s.id !== id) });
  },
}));
