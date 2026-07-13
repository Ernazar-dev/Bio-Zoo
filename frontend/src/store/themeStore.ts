import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

const stored = (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) as ThemeMode | null;
const initial: ThemeMode = stored === 'dark' ? 'dark' : 'light';
if (typeof document !== 'undefined') document.documentElement.dataset.theme = initial;

interface ThemeState {
  mode: ThemeMode;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: initial,
  toggle: () =>
    set((s) => {
      const mode: ThemeMode = s.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', mode);
      document.documentElement.dataset.theme = mode;
      return { mode };
    }),
}));
