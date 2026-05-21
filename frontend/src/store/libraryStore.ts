/**
 * Library store — central storage for learning items.
 */

import { create } from "zustand";
import api from "../services/api";
import type { LibraryFilter, LibraryItem, LibraryItemUpdate } from "../types";

interface LibraryState {
  items: LibraryItem[];
  filters: LibraryFilter;
  isLoading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  update: (id: string, data: LibraryItemUpdate) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setFilter: (partial: Partial<LibraryFilter>) => void;
}

const defaultFilters: LibraryFilter = {
  type: undefined,
  subject: "",
  tags: [],
  sort: "newest",
};

export const useLibraryStore = create<LibraryState>((set, get) => ({
  items: [],
  filters: defaultFilters,
  isLoading: false,
  error: null,

  setFilter: (partial) => {
    set({ filters: { ...get().filters, ...partial } });
  },

  fetch: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filters } = get();
      const params = new URLSearchParams();

      if (filters.type) params.set("type", filters.type);
      if (filters.subject?.trim()) params.set("subject", filters.subject.trim());

      const tags = (filters.tags || []).filter(Boolean);
      tags.forEach((t) => params.append("tags", t));

      // Map UI sort to API query params.
      if (filters.sort === "oldest") {
        params.set("sort_by", "created_at");
        params.set("order", "asc");
      } else if (filters.sort === "az") {
        params.set("sort_by", "title");
        params.set("order", "asc");
      } else {
        params.set("sort_by", "created_at");
        params.set("order", "desc");
      }

      const qs = params.toString();
      const res = await api.get<LibraryItem[]>(`/library${qs ? `?${qs}` : ""}`);
      set({ items: res.data });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || "Failed to load library" });
    } finally {
      set({ isLoading: false });
    }
  },

  update: async (id, data) => {
    const res = await api.patch<LibraryItem>(`/library/${id}`, data);
    set({ items: get().items.map((it) => (it.id === id ? res.data : it)) });
  },

  remove: async (id) => {
    await api.delete(`/library/${id}`);
    set({ items: get().items.filter((it) => it.id !== id) });
  },
}));
