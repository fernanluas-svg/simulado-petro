import type {
  ExamAttempt,
  ExamConfig,
  ExamResult,
  ExamStatus,
  Question,
  SubjectBreakdown,
} from '../types';

/** Versão atual do formato de resultado salvo nas tentativas. */
export const CURRENT_SCHEMA_VERSION = 2;

/**
 * Pesos usados quando a matéria (ou a questão) não traz um peso explícito.
 * Espelham a regra da Cesgranrio: conhecimentos específicos valem o dobro.
 */
export const DEFAULT_SUBJECT_WEIGHTS: Record<string, number> = {
  portugues: 1,
  matematica: 1,
  conhecimentos_especificos: 2,
};

/** Aproveitamento mínimo por matéria para não ser eliminado. */
export const DEFAULT_MIN_SUBJECT_SCORE_PERCENT = 50;

export interface RegradeChange {
  attempt: ExamAttempt;
  previous: ExamResult | null;
  updated: ExamResult;
  /** true quando o registro veio de um schema antigo (migração). */
  migrated: boolean;
}

export interface RegradeSummary {
  count: number;
  migratedCount: number;
  changes: Array<{
    attemptId: string;
    previousPercentage?: number;
    newPercentage: number;
    previousPassed?: boolean;
    newPassed: boolean;
    migrated: boolean;
  }>;
}

export interface MigrationResult {
  attempt: ExamAttempt;
  changed: boolean;
  source: 'questions' | 'scoreData' | 'answers' | 'already-migrated' | 'none';
  previous: ExamResult | null;
  updated: ExamResult | null;
  migrated: boolean;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function percentageOf(correct: number, total: number): number {
  return total > 0 ? round2((correct / total) * 100) : 0;
}

/** Peso da matéria, com fallback para os pesos padrão da Cesgranrio. */
export function getSubjectWeight(subjectId: string, config?: ExamConfig | null): number {
  const configured = config?.subjects.find((subject) => subject.id === subjectId)?.weight;
  if (typeof configured === 'number' && Number.isFinite(configured)) return configured;
  return DEFAULT_SUBJECT_WEIGHTS[subjectId] ?? 1;
}

/** Peso individual da questão; se não houver, herda o peso da matéria. */
export function getQuestionWeight(
  question: Question,
  config?: ExamConfig | null,
): number {
  if (typeof question.weight === 'number' && Number.isFinite(question.weight)) {
    return question.weight;
  }
  return getSubjectWeight(question.subjectId, config);
}

export function getMinSubjectScorePercent(config: ExamConfig): number {
  const configured = config.passingCriteria?.minSubjectScorePercent;
  return typeof configured === 'number' ? configured : DEFAULT_MIN_SUBJECT_SCORE_PERCENT;
}

/**
 * Restaura as questões de uma tentativa a partir dos IDs salvos.
 * Tentativas antigas, criadas antes de `questionIds` existir, retornam [].
 */
export function restoreQuestions(attempt: ExamAttempt, bank: Question[]): Question[] {
  if (!attempt.questionIds?.length) return [];
  const byId = new Map(bank.map((question) => [question.id, question]));
  return attempt.questionIds
    .map((id) => byId.get(id))
    .filter((question): question is Question => Boolean(question));
}

/**
 * Fallback para tentativas antigas que não guardaram `questionIds`:
 * usa as respostas salvas para localizar as questões no banco atual.
 */
export function restoreQuestionsFromAnswers(
  attempt: ExamAttempt,
  bank: Question[],
): Question[] {
  const answeredIds = Object.keys(attempt.answers ?? {});
  if (answeredIds.length === 0) return [];
  const byId = new Map(bank.map((question) => [question.id, question]));
  return answeredIds
    .map((id) => byId.get(id))
    .filter((question): question is Question => Boolean(question));
}

function isGeneralSubject(subjectId: string): boolean {
  return subjectId === 'portugues' || subjectId === 'matematica';
}

interface SubjectAccumulator {
  correct: number;
  total: number;
  weight: number;
  scoreTotal: number;
  maxScore: number;
}

function buildSubjectBreakdown(
  accumulators: Map<string, SubjectAccumulator>,
  config: ExamConfig,
): Record<string, SubjectBreakdown> {
  const minPercent = getMinSubjectScorePercent(config);
  const breakdown: Record<string, SubjectBreakdown> = {};

  for (const [subjectId, accumulator] of accumulators) {
    if (accumulator.total === 0) continue;
    const percentage = percentageOf(accumulator.correct, accumulator.total);
    breakdown[subjectId] = {
      correct: accumulator.correct,
      total: accumulator.total,
      percentage,
      weight: accumulator.weight,
      scoreTotal: round2(accumulator.scoreTotal),
      maxScore: round2(accumulator.maxScore),
      eliminated: percentage < minPercent,
    };
  }

  return breakdown;
}

function buildFailureReasons(
  config: ExamConfig,
  breakdown: Record<string, SubjectBreakdown>,
  generalCorrect: number,
  generalTotal: number,
  specificCorrect: number,
  specificTotal: number,
): string[] {
  const criteria = config.passingCriteria;
  const minPercent = getMinSubjectScorePercent(config);
  const reasons: string[] = [];

  const generalPct = generalTotal > 0 ? (generalCorrect / generalTotal) * 100 : null;
  const specificPct = specificTotal > 0 ? (specificCorrect / specificTotal) * 100 : null;

  if (generalPct !== null) {
    if (
      criteria.minGeneralScorePercent !== undefined &&
      generalPct < criteria.minGeneralScorePercent
    ) {
      reasons.push(
        `Conhecimentos Gerais abaixo do mínimo (${generalPct.toFixed(1)}% < ${criteria.minGeneralScorePercent}%).`,
      );
    }
    if (
      criteria.minGeneralCorrect !== undefined &&
      generalCorrect < criteria.minGeneralCorrect
    ) {
      reasons.push(
        `Conhecimentos Gerais com menos de ${criteria.minGeneralCorrect} acertos (${generalCorrect}).`,
      );
    }
  }

  if (specificPct !== null) {
    if (
      criteria.minSpecificScorePercent !== undefined &&
      specificPct < criteria.minSpecificScorePercent
    ) {
      reasons.push(
        `Conhecimentos Específicos abaixo do mínimo (${specificPct.toFixed(1)}% < ${criteria.minSpecificScorePercent}%).`,
      );
    }
    if (
      criteria.minSpecificCorrect !== undefined &&
      specificCorrect < criteria.minSpecificCorrect
    ) {
      reasons.push(
        `Conhecimentos Específicos com menos de ${criteria.minSpecificCorrect} acertos (${specificCorrect}).`,
      );
    }
  }

  for (const [subjectId, data] of Object.entries(breakdown)) {
    const subjectConfig = config.subjects.find((subject) => subject.id === subjectId);
    const name = subjectConfig?.name ?? subjectId;

    if (data.eliminated) {
      reasons.push(
        `Eliminado em ${name}: aproveitamento de ${data.percentage.toFixed(1)}% abaixo do mínimo de ${minPercent}%.`,
      );
    }

    if (subjectConfig?.minCorrect !== undefined && data.correct < subjectConfig.minCorrect) {
      reasons.push(
        `${name}: mínimo de ${subjectConfig.minCorrect} acertos (obteve ${data.correct}).`,
      );
    }

    if (!criteria.allowZeroInAnySubject && data.total > 0 && data.correct === 0) {
      reasons.push(`Zerou ${name}.`);
    }
  }

  return reasons;
}

/**
 * Calcula a nota de uma tentativa com base no gabarito atual das questões.
 * É usada tanto ao finalizar um simulado quanto ao recalcular tentativas antigas.
 *
 * A pontuação é ponderada pelo peso da questão/matéria e cada matéria com
 * aproveitamento abaixo do mínimo (padrão 50%) elimina o candidato.
 */
export function calculateExamResult(
  attempt: ExamAttempt,
  questions: Question[],
  config: ExamConfig,
  timeSpentSeconds: number = attempt.timeSpentSeconds,
): ExamResult {
  const answers = attempt.answers ?? {};
  const accumulators = new Map<string, SubjectAccumulator>();

  let correctCount = 0;
  let incorrectCount = 0;
  let blankCount = 0;
  let generalCorrect = 0;
  let generalTotal = 0;
  let specificCorrect = 0;
  let specificTotal = 0;

  for (const question of questions) {
    const subjectId = question.subjectId;
    if (!accumulators.has(subjectId)) {
      accumulators.set(subjectId, {
        correct: 0,
        total: 0,
        weight: getSubjectWeight(subjectId, config),
        scoreTotal: 0,
        maxScore: 0,
      });
    }

    const accumulator = accumulators.get(subjectId)!;
    const weight = getQuestionWeight(question, config);
    const isGeneral = isGeneralSubject(subjectId);
    const userAnswer = answers[question.id];

    accumulator.total += 1;
    accumulator.maxScore += weight;

    if (isGeneral) generalTotal += 1;
    else specificTotal += 1;

    if (!userAnswer) {
      blankCount += 1;
    } else if (userAnswer === question.correctAnswer) {
      correctCount += 1;
      accumulator.correct += 1;
      accumulator.scoreTotal += weight;
      if (isGeneral) generalCorrect += 1;
      else specificCorrect += 1;
    } else {
      incorrectCount += 1;
    }
  }

  const subjectBreakdown = buildSubjectBreakdown(accumulators, config);
  const subjectPerformance: ExamResult['subjectPerformance'] = {};
  let scoreTotal = 0;
  let maxScore = 0;

  for (const [subjectId, data] of Object.entries(subjectBreakdown)) {
    subjectPerformance[subjectId] = {
      correct: data.correct,
      total: data.total,
      percentage: data.percentage,
    };
    scoreTotal += data.scoreTotal;
    maxScore += data.maxScore;
  }

  const percentage = percentageOf(scoreTotal, maxScore);
  const failureReasons = buildFailureReasons(
    config,
    subjectBreakdown,
    generalCorrect,
    generalTotal,
    specificCorrect,
    specificTotal,
  );
  const eliminatedSubjects = Object.entries(subjectBreakdown)
    .filter(([, data]) => data.eliminated)
    .map(([subjectId]) => subjectId);
  const passed = failureReasons.length === 0;
  const status: ExamStatus = passed ? 'APROVADO' : 'REPROVADO';

  return {
    totalQuestions: questions.length,
    correctCount,
    incorrectCount,
    blankCount,
    generalCorrect,
    generalTotal,
    specificCorrect,
    specificTotal,
    subjectPerformance,
    percentage,
    passed,
    failureReason: failureReasons.join(' '),
    timeSpentSeconds,
    scoreTotal: round2(scoreTotal),
    maxScore: round2(maxScore),
    subjectBreakdown,
    eliminatedSubjects,
    status,
  };
}

/**
 * Reconstrói o resultado de uma tentativa antiga usando apenas as contagens
 * salvas em `scoreData.subjectPerformance`. Retorna null quando não há dados
 * confiáveis (ex.: `subjectPerformance` vazio), para não marcar 0/0 como
 * aprovado nem inventar uma nota.
 */
export function buildLegacyResult(
  attempt: ExamAttempt,
  config: ExamConfig,
): ExamResult | null {
  const previous = attempt.scoreData;
  if (!previous) return null;

  const performances = Object.entries(previous.subjectPerformance ?? {}).filter(
    ([, performance]) => performance && performance.total > 0,
  );
  if (performances.length === 0) return null;

  const minPercent = getMinSubjectScorePercent(config);
  const subjectBreakdown: Record<string, SubjectBreakdown> = {};
  const subjectPerformance: ExamResult['subjectPerformance'] = {};
  let scoreTotal = 0;
  let maxScore = 0;

  for (const [subjectId, performance] of performances) {
    const weight = getSubjectWeight(subjectId, config);
    const percentage = percentageOf(performance.correct, performance.total);
    const subjectScore = round2(performance.correct * weight);
    const subjectMax = round2(performance.total * weight);

    subjectPerformance[subjectId] = {
      correct: performance.correct,
      total: performance.total,
      percentage,
    };
    subjectBreakdown[subjectId] = {
      correct: performance.correct,
      total: performance.total,
      percentage,
      weight,
      scoreTotal: subjectScore,
      maxScore: subjectMax,
      eliminated: percentage < minPercent,
    };

    scoreTotal += subjectScore;
    maxScore += subjectMax;
  }

  const failureReasons = buildFailureReasons(
    config,
    subjectBreakdown,
    previous.generalCorrect ?? 0,
    previous.generalTotal ?? 0,
    previous.specificCorrect ?? 0,
    previous.specificTotal ?? 0,
  );

  // O status é recalculado do zero com os critérios atuais (pesos +
  // aproveitamento mínimo por matéria). Assim, tentativas antigas passam a
  // refletir exatamente a regra nova, inclusive mudando de aprovado/reprovado.
  const passed = failureReasons.length === 0;
  const failureReason = failureReasons.join(' ');
  const eliminatedSubjects = Object.entries(subjectBreakdown)
    .filter(([, data]) => data.eliminated)
    .map(([subjectId]) => subjectId);

  return {
    ...previous,
    subjectPerformance,
    subjectBreakdown,
    scoreTotal: round2(scoreTotal),
    maxScore: round2(maxScore),
    percentage: percentageOf(scoreTotal, maxScore),
    passed,
    failureReason,
    eliminatedSubjects,
    status: passed ? 'APROVADO' : 'REPROVADO',
  };
}

/** Grava o resultado no topo da tentativa e em `scoreData` (schema 2). */
export function applyResultToAttempt(
  attempt: ExamAttempt,
  result: ExamResult,
): ExamAttempt {
  return {
    ...attempt,
    scoreData: result,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    scoreTotal: result.scoreTotal,
    maxScore: result.maxScore,
    percentage: result.percentage,
    status: result.status,
    subjectBreakdown: result.subjectBreakdown,
  };
}

/**
 * Migra uma tentativa concluída para o schema 2.
 *
 * Ordem de prioridade:
 * 1. `questionIds` completos → recalcula pelo gabarito atual;
 * 2. `scoreData` existente → usa as contagens salvas;
 * 3. apenas `answers` → recalcula as questões localizadas no banco;
 * 4. sem dados → não altera.
 */
export function migrateAttempt(
  attempt: ExamAttempt,
  bank: Question[],
  config: ExamConfig,
): MigrationResult {
  const unchanged = (source: MigrationResult['source']): MigrationResult => ({
    attempt,
    changed: false,
    source,
    previous: attempt.scoreData ?? null,
    updated: null,
    migrated: false,
  });

  if (!attempt.isCompleted) return unchanged('none');

  const alreadyMigrated =
    attempt.schemaVersion === CURRENT_SCHEMA_VERSION &&
    Boolean(attempt.scoreData) &&
    Boolean(attempt.status) &&
    Boolean(attempt.subjectBreakdown) &&
    attempt.scoreTotal !== undefined;
  if (alreadyMigrated) return unchanged('already-migrated');

  const previous = attempt.scoreData ?? null;
  const migrated = attempt.schemaVersion !== CURRENT_SCHEMA_VERSION;
  const timeSpentSeconds = previous?.timeSpentSeconds ?? attempt.timeSpentSeconds;

  const expectedQuestions = attempt.questionIds?.length ?? 0;
  if (expectedQuestions > 0) {
    const questions = restoreQuestions(attempt, bank);
    if (questions.length === expectedQuestions) {
      const updated = calculateExamResult(attempt, questions, config, timeSpentSeconds);
      return {
        attempt: applyResultToAttempt(attempt, updated),
        changed: true,
        source: 'questions',
        previous,
        updated,
        migrated,
      };
    }
  }

  const legacyResult = buildLegacyResult(attempt, config);
  if (legacyResult) {
    return {
      attempt: applyResultToAttempt(attempt, legacyResult),
      changed: true,
      source: 'scoreData',
      previous,
      updated: legacyResult,
      migrated: true,
    };
  }

  const answeredQuestions = restoreQuestionsFromAnswers(attempt, bank);
  if (answeredQuestions.length > 0) {
    const updated = calculateExamResult(
      attempt,
      answeredQuestions,
      config,
      timeSpentSeconds,
    );
    return {
      attempt: applyResultToAttempt(attempt, updated),
      changed: true,
      source: 'answers',
      previous,
      updated,
      migrated: true,
    };
  }

  return unchanged('none');
}

function sameSubjectPerformance(
  a: ExamResult['subjectPerformance'],
  b: ExamResult['subjectPerformance'],
): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every((key) => {
    const first = a[key];
    const second = b[key];
    return (
      Boolean(second) &&
      first.correct === second.correct &&
      first.total === second.total &&
      first.percentage === second.percentage
    );
  });
}

export function areResultsEqual(a: ExamResult, b: ExamResult): boolean {
  return (
    a.totalQuestions === b.totalQuestions &&
    a.correctCount === b.correctCount &&
    a.incorrectCount === b.incorrectCount &&
    a.blankCount === b.blankCount &&
    a.generalCorrect === b.generalCorrect &&
    a.generalTotal === b.generalTotal &&
    a.specificCorrect === b.specificCorrect &&
    a.specificTotal === b.specificTotal &&
    a.percentage === b.percentage &&
    a.scoreTotal === b.scoreTotal &&
    a.maxScore === b.maxScore &&
    a.status === b.status &&
    a.passed === b.passed &&
    (a.failureReason ?? '') === (b.failureReason ?? '') &&
    a.timeSpentSeconds === b.timeSpentSeconds &&
    sameSubjectPerformance(a.subjectPerformance ?? {}, b.subjectPerformance ?? {})
  );
}

/**
 * Recalcula uma tentativa concluída com o gabarito atual.
 * Retorna null quando não há mudança, quando a tentativa é antiga demais
 * (sem `questionIds`) ou quando alguma questão não está mais no banco.
 */
export function regradeAttempt(
  attempt: ExamAttempt,
  bank: Question[],
  config: ExamConfig,
): RegradeChange | null {
  if (!attempt.isCompleted || !attempt.scoreData || !attempt.questionIds?.length) {
    return null;
  }

  const questions = restoreQuestions(attempt, bank);
  if (questions.length !== attempt.questionIds.length) return null;

  const updated = calculateExamResult(
    attempt,
    questions,
    config,
    attempt.scoreData.timeSpentSeconds,
  );

  if (areResultsEqual(attempt.scoreData, updated)) return null;

  return {
    attempt: applyResultToAttempt(attempt, updated),
    previous: attempt.scoreData,
    updated,
    migrated: false,
  };
}

export function buildRegradeSummary(
  changes: RegradeChange[],
): RegradeSummary | null {
  if (changes.length === 0) return null;

  return {
    count: changes.length,
    migratedCount: changes.filter((change) => change.migrated).length,
    changes: changes.map((change) => ({
      attemptId: change.attempt.id,
      previousPercentage: change.previous?.percentage,
      newPercentage: change.updated.percentage,
      previousPassed: change.previous?.passed,
      newPassed: change.updated.passed,
      migrated: change.migrated,
    })),
  };
}
