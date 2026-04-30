/**
 * Tasks store with filtering support.
 */
import { create } from "zustand";
import api from "../services/api";
import type { Task, TaskCreate, TaskUpdate } from "../types";

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  fetch: (filters?: { status?: string; priority?: number; subject_id?: string }) => Promise<void>;
  create: (data: TaskCreate) => Promise<Task>;
  update: (id: string, data: TaskUpdate) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,

  fetch: async (filters) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.priority) params.set("priority", String(filters.priority));
      if (filters?.subject_id) params.set("subject_id", filters.subject_id);

      const res = await api.get<Task[]>(`/tasks?${params.toString()}`);
      set({ tasks: res.data });
    } finally {
      set({ isLoading: false });
    }
  },

  create: async (data) => {
    const res = await api.post<Task>("/tasks", data);
    set({ tasks: [res.data, ...get().tasks] });
    return res.data;
  },

  update: async (id, data) => {
    const res = await api.put<Task>(`/tasks/${id}`, data);
    set({ tasks: get().tasks.map((t) => (t.id === id ? res.data : t)) });
  },

  remove: async (id) => {
    await api.delete(`/tasks/${id}`);
    set({ tasks: get().tasks.filter((t) => t.id !== id) });
  },
}));
