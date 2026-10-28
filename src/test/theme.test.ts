import { describe, it, expect, beforeEach } from 'vitest';
import {
  THEME_OPTIONS,
  THEME_STORAGE_KEY,
  applyTheme,
  getStoredTheme,
  normalizeTheme,
} from '../services/theme';
import { getPaletteStatus } from '../services/palette';

describe('Temas do aplicativo', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    document.documentElement.removeAttribute('style');
    document.head.innerHTML = '<meta name="theme-color" content="#0b132b" />';
  });

  it('oferece exatamente os três temas pedidos', () => {
    expect(THEME_OPTIONS.map((option) => option.id)).toEqual(['atual', 'branco', 'preto']);
  });

  it('migra os valores antigos dark/light para os temas atuais', () => {
    expect(normalizeTheme('dark')).toBe('atual');
    expect(normalizeTheme('light')).toBe('branco');
    expect(normalizeTheme('preto')).toBe('preto');
    expect(normalizeTheme('atual')).toBe('atual');
    expect(normalizeTheme(undefined)).toBe('atual');
    expect(normalizeTheme('desconhecido')).toBe('atual');
  });

  it('aplica data-theme, color-scheme e theme-color', () => {
    applyTheme('branco');

    expect(document.documentElement.dataset.theme).toBe('branco');
    expect(document.documentElement.style.colorScheme).toBe('light');
    expect(
      document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
    ).toBe('#eef2f7');

    applyTheme('preto');

    expect(document.documentElement.dataset.theme).toBe('preto');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(
      document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
    ).toBe('#000000');
  });

  it('persiste e recupera o tema escolhido', () => {
    expect(getStoredTheme()).toBeNull();

    applyTheme('preto');

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('preto');
    expect(getStoredTheme()).toBe('preto');
  });

  it('ignora valores inválidos salvos', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'neon');
    expect(getStoredTheme()).toBeNull();
  });
});

describe('Cores da grade de questões', () => {
  it('mantém em branco quando a questão não foi respondida', () => {
    expect(getPaletteStatus(undefined, 'B', true)).toBe('blank');
  });

  it('usa apenas "respondida" quando a correção imediata está desativada', () => {
    expect(getPaletteStatus('A', 'B', false)).toBe('answered');
    expect(getPaletteStatus('B', 'B', false)).toBe('answered');
  });

  it('marca verde quando a resposta está correta e a correção está ativa', () => {
    expect(getPaletteStatus('B', 'B', true)).toBe('correct');
  });

  it('marca vermelho quando a resposta está incorreta e a correção está ativa', () => {
    expect(getPaletteStatus('A', 'B', true)).toBe('incorrect');
  });
});
