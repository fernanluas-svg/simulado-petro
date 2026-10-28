import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExamAttempt } from '../types';
import {
  clampDurationMinutes,
  formatSeconds,
  getRemainingSeconds,
  getTotalSeconds,
  DEFAULT_DURATION_MINUTES,
} from '../services/timer';

function makeAttempt(overrides: Partial<ExamAttempt> = {}): ExamAttempt {
  return {
    id: 'attempt_1',
    configId: 'config_1',
    startTime: new Date('2026-01-01T10:00:00Z').getTime(),
    timeSpentSeconds: 0,
    answers: {},
    markedForReview: {},
    immediateCorrection: false,
    isCompleted: false,
    ...overrides,
  };
}

describe('clampDurationMinutes', () => {
  it('usa o padrão quando o valor é inválido', () => {
    expect(clampDurationMinutes(undefined)).toBe(DEFAULT_DURATION_MINUTES);
    expect(clampDurationMinutes(null)).toBe(DEFAULT_DURATION_MINUTES);
    expect(clampDurationMinutes(Number.NaN)).toBe(DEFAULT_DURATION_MINUTES);
  });

  it('respeita os limites mínimo e máximo e arredonda', () => {
    expect(clampDurationMinutes(0)).toBe(1);
    expect(clampDurationMinutes(-30)).toBe(1);
    expect(clampDurationMinutes(5000)).toBe(600);
    expect(clampDurationMinutes(90.6)).toBe(91);
  });
});

describe('formatSeconds', () => {
  it('formata minutos e segundos', () => {
    expect(formatSeconds(0)).toBe('00:00');
    expect(formatSeconds(59)).toBe('00:59');
    expect(formatSeconds(65)).toBe('01:05');
  });

  it('inclui horas quando necessário', () => {
    expect(formatSeconds(3600)).toBe('1:00:00');
    expect(formatSeconds(3725)).toBe('1:02:05');
  });

  it('nunca exibe valores negativos', () => {
    expect(formatSeconds(-10)).toBe('00:00');
  });
});

describe('getRemainingSeconds', () => {
  const baseTime = new Date('2026-01-01T10:00:00Z').getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(baseTime);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('desconta o tempo de parede desde a última retomada', () => {
    const attempt = makeAttempt({
      durationMinutes: 10,
      timeRemainingSeconds: 600,
      lastResumedAt: baseTime,
    });

    vi.advanceTimersByTime(65_000);
    expect(getRemainingSeconds(attempt)).toBe(535);
  });

  it('congela o saldo enquanto está pausado', () => {
    const attempt = makeAttempt({
      durationMinutes: 10,
      timeRemainingSeconds: 420,
      isPaused: true,
      lastResumedAt: baseTime,
    });

    vi.advanceTimersByTime(120_000);
    expect(getRemainingSeconds(attempt)).toBe(420);
  });

  it('não ultrapassa zero nem o total configurado', () => {
    const expired = makeAttempt({
      durationMinutes: 1,
      timeRemainingSeconds: 10,
      lastResumedAt: baseTime,
    });
    vi.advanceTimersByTime(20_000);
    expect(getRemainingSeconds(expired)).toBe(0);

    vi.setSystemTime(baseTime);
    const inflated = makeAttempt({
      durationMinutes: 10,
      timeRemainingSeconds: 9999,
      lastResumedAt: baseTime,
    });
    expect(getRemainingSeconds(inflated)).toBe(600);
  });

  it('usa startTime para tentativas antigas sem saldo salvo', () => {
    const legacy = makeAttempt({ startTime: baseTime - 30_000 });

    vi.setSystemTime(baseTime);
    expect(getRemainingSeconds(legacy, 1)).toBe(30);
    expect(getTotalSeconds(legacy, 1)).toBe(60);
  });
});
