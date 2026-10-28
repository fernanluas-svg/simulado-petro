import type { ThemeName } from '../types';

export const THEME_STORAGE_KEY = 'transpetro_theme';

export interface ThemeOption {
  id: ThemeName;
  label: string;
  description: string;
  /** Cor usada na meta tag theme-color e no navegador mobile. */
  themeColor: string;
  /** Cores fixas do mini-preview exibido nas configurações. */
  preview: {
    background: string;
    surface: string;
    border: string;
    accent: string;
  };
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'atual',
    label: 'Atual',
    description: 'Azul-marinho original',
    themeColor: '#0b132b',
    preview: {
      background: '#0b132b',
      surface: '#1c2541',
      border: '#3a506b',
      accent: '#22d3ee',
    },
  },
  {
    id: 'branco',
    label: 'Branco',
    description: 'Claro, para ambientes iluminados',
    themeColor: '#eef2f7',
    preview: {
      background: '#eef2f7',
      surface: '#ffffff',
      border: '#cbd5e1',
      accent: '#0e7490',
    },
  },
  {
    id: 'preto',
    label: 'Preto',
    description: 'Fundo puro, ideal para OLED',
    themeColor: '#000000',
    preview: {
      background: '#000000',
      surface: '#0d0d0d',
      border: '#333333',
      accent: '#22d3ee',
    },
  },
];

export function isThemeName(value: unknown): value is ThemeName {
  return value === 'atual' || value === 'branco' || value === 'preto';
}

/**
 * Migra valores antigos (`dark`/`light`) para os três temas atuais.
 */
export function normalizeTheme(value: unknown): ThemeName {
  if (value === 'branco' || value === 'light') return 'branco';
  if (value === 'preto') return 'preto';
  return 'atual';
}

export function getThemeOption(theme: ThemeName): ThemeOption {
  return THEME_OPTIONS.find((option) => option.id === theme) ?? THEME_OPTIONS[0];
}

/**
 * Aplica o tema no documento e guarda uma cópia em localStorage para que o
 * script inline do index.html pinte a tela correta antes do React carregar.
 */
export function applyTheme(theme: ThemeName): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const option = getThemeOption(theme);

  root.dataset.theme = theme;
  root.style.colorScheme = theme === 'branco' ? 'light' : 'dark';

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', option.themeColor);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* armazenamento indisponível: o tema ainda vale para esta sessão */
  }
}

export function getStoredTheme(): ThemeName | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeName(stored) ? stored : null;
  } catch {
    return null;
  }
}
