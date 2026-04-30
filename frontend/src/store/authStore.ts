/**
 * Auth store — JWT token management + user state.
 */
import { create } from "zustand";
import api from "../services/api";
import type { User, LoginRequest, RegisterRequest, TokenResponse } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem("access_token"),
  isLoading: true,
  isAuthenticated: !!localStorage.getItem("access_token"),

  login: async (data) => {
    const res = await api.post<TokenResponse>("/auth/login", data);
    const { access_token } = res.data;
    localStorage.setItem("access_token", access_token);
    set({ token: access_token, isAuthenticated: true });
    await get().fetchMe();
  },

  register: async (data) => {
    const res = await api.post<TokenResponse>("/auth/register", data);
    const { access_token } = res.data;
    localStorage.setItem("access_token", access_token);
    set({ token: access_token, isAuthenticated: true });
    await get().fetchMe();
  },

  logout: () => {
    localStorage.removeItem("access_token");
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    try {
      const res = await api.get<User>("/auth/me");
      set({ user: res.data, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
      localStorage.removeItem("access_token");
    }
  },

  initialize: async () => {
    const token = localStorage.getItem("access_token");
    if (token) {
      await get().fetchMe();
    } else {
      set({ isLoading: false });
    }
  },
}));
