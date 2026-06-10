import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api, { STORAGE_KEYS } from '@/services/apiClient';

export interface Usuario {
  rut: string;
  nombre: string;
  apellido: string;
  cargo: string;
  must_change_password: boolean;
}

interface AuthState {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (rut: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  usuario: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (rut, password) => {
    const { data } = await api.post('/api/auth/login/', { rut, password });
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS, data.access);
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH, data.refresh);
    set({ usuario: data.usuario, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH);
    set({ usuario: null, isAuthenticated: false });
  },

  loadFromStorage: async () => {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS);
      if (token) {
        const { data } = await api.get('/api/auth/me/');
        set({ usuario: data, isAuthenticated: true });
      }
    } catch {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH);
    } finally {
      set({ isLoading: false });
    }
  },
}));
