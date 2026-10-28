import { describe, it, expect } from 'vitest';
import { useExamStore } from '../store/useExamStore';

describe('Exam Store & Scoring Logic', () => {
  it('should initialize with default state', () => {
    const state = useExamStore.getState();
    expect(state.view).toBe('home');
    expect(state.currentAttempt).toBeNull();
  });

  it('should have correct default settings', () => {
    const store = useExamStore.getState();
    expect(store.settings.defaultDurationMinutes).toBe(240);
    expect(store.settings.theme).toBe('atual');
  });

  it('should handle view transitions correctly', () => {
    const store = useExamStore.getState();
    store.setView('history');
    expect(useExamStore.getState().view).toBe('history');
    store.setView('home');
    expect(useExamStore.getState().view).toBe('home');
  });
});
