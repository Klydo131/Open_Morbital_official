// SPDX-License-Identifier: AGPL-3.0-or-later
import { create } from 'zustand';

export type ActiveTab = 'player' | 'library' | 'vault' | 'queue' | 'settings';
export type Theme = 'dark' | 'light';

type UIState = {
  mobileMenuOpen: boolean;
  mobileActiveTab: ActiveTab;
  brightness: number;
  showVisualizer: boolean;
  theme: Theme;

  setMobileMenuOpen: (v: boolean) => void;
  setMobileActiveTab: (tab: ActiveTab) => void;
  setBrightness: (v: number) => void;
  toggleVisualizer: () => void;
  setTheme: (t: Theme) => void;
};

export const useUIStore = create<UIState>((set) => ({
  mobileMenuOpen: false,
  mobileActiveTab: 'player',
  brightness: 100,
  showVisualizer: false,
  theme: (localStorage.getItem('sonata-theme') as Theme) ?? 'dark',

  setMobileMenuOpen: (v) => set({ mobileMenuOpen: v }),
  setMobileActiveTab: (tab) => set({ mobileActiveTab: tab }),
  setBrightness: (v) => set({ brightness: v }),
  toggleVisualizer: () => set((s) => ({ showVisualizer: !s.showVisualizer })),
  setTheme: (t) => {
    localStorage.setItem('sonata-theme', t);
    document.documentElement.setAttribute('data-theme', t);
    set({ theme: t });
  },
}));
