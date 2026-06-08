import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

interface User {
  id: number;
  nickname: string;
  avatarUrl: string;
  role: number;
  username?: string;
}

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: !!storage.getString('accessToken'),
  user: storage.getString('user') ? JSON.parse(storage.getString('user')!) : null,
  accessToken: storage.getString('accessToken') || null,
  refreshToken: storage.getString('refreshToken') || null,

  login: (accessToken, refreshToken, user) => {
    storage.set('accessToken', accessToken);
    storage.set('refreshToken', refreshToken);
    storage.set('user', JSON.stringify(user));
    set({ isLoggedIn: true, accessToken, refreshToken, user });
  },

  logout: () => {
    storage.delete('accessToken');
    storage.delete('refreshToken');
    storage.delete('user');
    set({ isLoggedIn: false, accessToken: null, refreshToken: null, user: null });
  },

  updateUser: (userData) => {
    set((state) => {
      const newUser = state.user ? { ...state.user, ...userData } : null;
      if (newUser) {
        storage.set('user', JSON.stringify(newUser));
      }
      return { user: newUser };
    });
  },
}));
