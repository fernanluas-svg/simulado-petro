import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExamAttempt, ExamConfig, Question } from '../types';

vi.mock('../services/storage', () => ({
  loadExamConfig: vi.fn(async () => null),
  loadAllQuestions: vi.fn(async () => []),
  saveAttempt: vi.fn(async () => undefined),
  deleteAttempt: vi.fn(async () => undefined),
  getAttempts: vi.fn(async () => []),
  loadUserSettings: vi.fn(async () => null),
  saveUserSettings: vi.fn(async () => undefined),
  clearAllData: vi.fn(async () => undefined),
}));

import { DEFAULT_SETTINGS, useExamStore } from '../store/useExamStore';

const baseTime = new Date('2026-04-10T09:00:00Z').getTime();

const config: ExamConfig = {
  id: 'config_scoring',
  title: 'Simulado de pontuação',
  noticeNumber: 'Edital teste',
  cargo: 'Cargo teste',
  organizer: 'Banca teste',
  totalQuestions: 6,
  durationMinutes: 10,
  subjects: [
    { id: 'portugues', name: 'Língua Portuguesa', questionCount: 2, weight: 1, minCorrect: 0 },
    { id: 'matematica', name: 'Matemática', questionCount: 1, weight: 1, minCorrect: 0 },
    {
      id: 'conhecimentos_especificos',
      name: 'Conhecimentos Específicos',
      questionCount: 3,
      weight: 2,
      minCorrect: 2,
    },
  ],
  passingCriteria: {
    minGeneralScorePercent: 50,
    minSpecificScorePercent: 50,
    minSpecificCorrect: 2,
    allowZeroInAnySubject: false,
  },
};

function makeQuestion(id: string, subjectId: string): Question {
  return {
    id,
    subjectId,
    topic: 'Tópico',
    statement: `Enunciado ${id}`,
    alternatives: ['A', 'B', 'C', 'D', 'E'].map((letter) => ({
      id: letter,
      text: `Alternativa ${letter}`,
    })),
    correctAnswer: 'A',
    explanation: 'Explicação',
    source: 'Fonte',
    reference: 'Referência',
    verified: false,
    difficulty: 'médio',
  };
}

const questions: Question[] = [
  makeQuestion('pt_1', 'portugues'),
  makeQuestion('pt_2', 'portugues'),
  makeQuestion('mt_1', 'matematica'),
  makeQuestion('es_1', 'conhecimentos_especificos'),
  makeQuestion('es_2', 'conhecimentos_especificos'),
  makeQuestion('es_3', 'conhecimentos_especificos'),
];

function makeAttempt(
  answers: Record<string, string>,
  overrides: Partial<ExamAttempt> = {},
): ExamAttempt {
  return {
    id: 'attempt_scoring',
    configId: config.id,
    startTime: baseTime - 60_000,
    timeSpentSeconds: 0,
    answers,
    markedForReview: {},
    immediateCorrection: false,
    isCompleted: false,
    questionIds: questions.map((question) => question.id),
    durationMinutes: 10,
    timeRemainingSeconds: 600,
    lastResumedAt: baseTime,
    ...overrides,
  };
}

function finish(answers: Record<string, string>, overrides: Partial<ExamAttempt> = {}) {
  useExamStore.setState({
    config,
    questions,
    allQuestionsBank: questions,
    currentAttempt: makeAttempt(answers, overrides),
    history: [],
    view: 'exam',
    currentQuestionIndex: 0,
    settings: DEFAULT_SETTINGS,
    error: null,
    startError: null,
  });

  useExamStore.getState().finishExam();
  const attempt = useExamStore.getState().currentAttempt;
  expect(attempt?.isCompleted).toBe(true);
  expect(attempt?.scoreData).toBeDefined();
  return attempt!.scoreData!;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(baseTime);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Critérios de aprovação', () => {
  it('aprova com 100% de acerto e respeita os pesos', () => {
    const result = finish({
      pt_1: 'A',
      pt_2: 'A',
      mt_1: 'A',
      es_1: 'A',
      es_2: 'A',
      es_3: 'A',
    });

    expect(result.passed).toBe(true);
    expect(result.failureReason).toBe('');
    expect(result.percentage).toBe(100);
    expect(result.correctCount).toBe(6);
    expect(result.generalCorrect).toBe(3);
    expect(result.specificCorrect).toBe(3);
  });

  it('reprova quando os específicos ficam abaixo do mínimo de acertos e percentual', () => {
    const result = finish({
      pt_1: 'A',
      pt_2: 'A',
      mt_1: 'A',
      es_1: 'A',
      es_2: 'B',
      es_3: 'B',
    });

    expect(result.passed).toBe(false);
    expect(result.specificCorrect).toBe(1);
    expect(result.failureReason).toContain('abaixo do mínimo');
    expect(result.failureReason).toContain('mínimo de 2 acertos');
  });

  it('reprova ao zerar uma matéria quando o edital não permite', () => {
    const result = finish({
      pt_1: 'A',
      pt_2: 'A',
      es_1: 'A',
      es_2: 'A',
      es_3: 'A',
    });

    expect(result.passed).toBe(false);
    expect(result.blankCount).toBe(1);
    expect(result.subjectPerformance.matematica.correct).toBe(0);
    expect(result.failureReason).toContain('Zerou Matemática');
  });

  it('calcula o percentual ponderado pelo peso das matérias', () => {
    const result = finish({
      es_1: 'A',
      es_2: 'A',
      es_3: 'A',
    });

    // 6 pontos de 9 possíveis (português 2 + matemática 1 + específicos 3×2).
    expect(result.percentage).toBeCloseTo(66.67, 2);
    expect(result.generalCorrect).toBe(0);
    expect(result.passed).toBe(false);
  });

  it('conta erros e questões em branco separadamente', () => {
    const result = finish({
      pt_1: 'A',
      pt_2: 'B',
    });

    expect(result.correctCount).toBe(1);
    expect(result.incorrectCount).toBe(1);
    expect(result.blankCount).toBe(4);
    expect(result.subjectPerformance.portugues).toEqual({
      correct: 1,
      total: 2,
      percentage: 50,
    });
  });

  it('usa o tempo de parede decorrido no tempo gasto', () => {
    vi.advanceTimersByTime(90_000);
    const result = finish({
      pt_1: 'A',
      pt_2: 'A',
      mt_1: 'A',
      es_1: 'A',
      es_2: 'A',
      es_3: 'A',
    });

    expect(result.timeSpentSeconds).toBe(90);
  });

  it('não finaliza sem questões carregadas', () => {
    useExamStore.setState({
      config,
      questions: [],
      currentAttempt: makeAttempt({}),
      view: 'exam',
    });

    useExamStore.getState().finishExam();

    expect(useExamStore.getState().currentAttempt?.isCompleted).toBe(false);
    expect(useExamStore.getState().view).toBe('exam');
  });
});
