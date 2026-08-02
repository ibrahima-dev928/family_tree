import { create } from 'zustand';
import * as authApi from '../api/auth.api';
import * as usersApi from '../api/users.api';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  loading: false,
  error: null,

  async login(email, password) {
    set({ loading: true, error: null });
    try {
      const data = await authApi.login({ email, password });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, isAuthenticated: true, loading: false });

      // Charge le profil complet (avec la fiche person) juste après
      const fullProfile = await usersApi.getMe();
      localStorage.setItem('user', JSON.stringify(fullProfile));
      set({ user: fullProfile });

      return data;
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Erreur de connexion';
      set({ error: message, loading: false });
      throw err;
    }
  },

  async register(formData) {
    set({ loading: true, error: null });
    try {
      const data = await authApi.register(formData);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, isAuthenticated: true, loading: false });

      const fullProfile = await usersApi.getMe();
      localStorage.setItem('user', JSON.stringify(fullProfile));
      set({ user: fullProfile });

      return data;
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Erreur lors de l\'inscription';
      set({ error: message, loading: false });
      throw err;
    }
  },

  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;