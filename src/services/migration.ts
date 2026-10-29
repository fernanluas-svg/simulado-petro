import type { ExamAttempt, ExamConfig, Question } from '../types';
import { getAttempts, saveAttempt, syncAttemptsToLocalStorage } from './storage';
import {
  buildRegradeSummary,
  migrateAttempt,
  type RegradeChange,
  type RegradeSummary,
} from './scoring';

export interface HistoricalMigrationResult {
  history: ExamAttempt[];
  changes: RegradeChange[];
  summary: RegradeSummary | null;
}

/**
 * Migra todas as tentativas concluídas para o schema 2 (pontuação ponderada
 * e eliminação por matéria). É idempotente: tentativas já migradas são
 * ignoradas, graças ao `schemaVersion`.
 */
export async function recalculateHistoricalExams(
  config: ExamConfig,
  bank: Question[],
  storedAttempts?: ExamAttempt[],
): Promise<HistoricalMigrationResult> {
  const attempts = storedAttempts ?? (await getAttempts());
  const changes: RegradeChange[] = [];

  const history = attempts.map((attempt) => {
    const outcome = migrateAttempt(attempt, bank, config);
    if (!outcome.changed || !outcome.updated) return attempt;

    changes.push({
      attempt: outcome.attempt,
      previous: outcome.previous,
      updated: outcome.updated,
      migrated: outcome.migrated,
    });
    return outcome.attempt;
  });

  if (changes.length > 0) {
    await Promise.all(
      changes.map((change) =>
        saveAttempt(change.attempt).catch((error) => {
          console.error('Falha ao salvar a tentativa migrada.', error);
        }),
      ),
    );
    syncAttemptsToLocalStorage(changes.map((change) => change.attempt));
  }

  return {
    history,
    changes,
    summary: buildRegradeSummary(changes),
  };
}
