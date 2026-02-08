import { create } from 'zustand';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

interface AuthStore {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  setToken: (token: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Load initial state from localStorage
const loadInitialState = () => {
  try {
    const stored = localStorage.getItem('auth-store');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { token: parsed.token, user: parsed.user };
    }
  } catch (error) {
    console.error('Failed to load auth state:', error);
  }
  return { token: null, user: null };
};

const initialState = loadInitialState();

export const useAuthStore = create<AuthStore>((set) => ({
  token: initialState.token,
  user: initialState.user,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });
      const state = {
        token: response.data.token,
        user: response.data.user,
        isLoading: false,
      };
      set(state);
      localStorage.setItem('auth-store', JSON.stringify({
        token: state.token,
        user: state.user,
      }));
    } catch (error) {
      // Fallback to demo mode if backend is not available
      console.warn('Backend not available, using demo mode');
      const demoUsers: { [key: string]: any } = {
        'admin@example.com': {
          id: 'admin-user-123',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin'
        },
        'user@example.com': {
          id: 'user-user-456',
          email: 'user@example.com',
          name: 'User Demo',
          role: 'user'
        }
      };

      if (demoUsers[email] && password === '123456') {
        const user = demoUsers[email];
        const demoToken = `demo-token-${user.id}`;
        const state = {
          token: demoToken,
          user,
          isLoading: false,
        };
        set(state);
        localStorage.setItem('auth-store', JSON.stringify({
          token: state.token,
          user: state.user,
        }));
      } else {
        set({ isLoading: false });
        throw new Error('Invalid credentials');
      }
    }
  },

  signup: async (email: string, password: string, name: string) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(`${API_URL}/api/auth/signup`, {
        email,
        password,
        name,
      });
      const state = {
        token: response.data.token,
        user: response.data.user,
        isLoading: false,
      };
      set(state);
      localStorage.setItem('auth-store', JSON.stringify({
        token: state.token,
        user: state.user,
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    set({
      token: null,
      user: null,
    });
    localStorage.removeItem('auth-store');
  },

  setToken: (token: string) => {
    set({ token });
  },
}));
