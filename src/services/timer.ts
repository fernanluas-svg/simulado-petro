import type { ExamAttempt } from '../types';

export const DEFAULT_DURATION_MINUTES = 240;
export const MIN_DURATION_MINUTES = 1;
export const MAX_DURATION_MINUTES = 600;

export function clampDurationMinutes(minutes: number | undefined | null): number {
  if (minutes === null || minutes === undefined) return DEFAULT_DURATION_MINUTES;
  const parsed = Number(minutes);
  if (!Number.isFinite(parsed)) return DEFAULT_DURATION_MINUTES;
  return Math.min(MAX_DURATION_MINUTES, Math.max(MIN_DURATION_MINUTES, Math.round(parsed)));
}

export function getTotalSeconds(
  attempt: Pick<ExamAttempt, 'durationMinutes'> | null | undefined,
  fallbackMinutes = DEFAULT_DURATION_MINUTES,
): number {
  const minutes = attempt?.durationMinutes ?? fallbackMinutes;
  return clampDurationMinutes(minutes) * 60;
}

/**
 * Calcula o tempo restante sem depender de quantos ticks o navegador executou.
 * - Pausado: devolve o saldo congelado.
 * - Em andamento: saldo congelado menos o tempo de parede desde a última retomada.
 * - Tentativas antigas: usa startTime como base.
 */
export function getRemainingSeconds(
  attempt: ExamAttempt | null | undefined,
  fallbackMinutes = DEFAULT_DURATION_MINUTES,
): number {
  if (!attempt) return 0;

  const total = getTotalSeconds(attempt, fallbackMinutes);
  const frozen = Number.isFinite(attempt.timeRemainingSeconds)
    ? Math.min(total, Math.max(0, attempt.timeRemainingSeconds as number))
    : total;

  if (attempt.isPaused) return frozen;

  const resumedAt = Number.isFinite(attempt.lastResumedAt)
    ? (attempt.lastResumedAt as number)
    : attempt.startTime;

  const elapsed = Math.max(0, Math.floor((Date.now() - resumedAt) / 1000));
  return Math.min(total, Math.max(0, frozen - elapsed));
}

export function formatSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${hours > 0 ? `${hours}:` : ''}${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
}
