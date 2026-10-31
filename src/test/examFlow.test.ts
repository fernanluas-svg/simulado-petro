import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExamAttempt, ExamConfig, Question, UserSettings } from '../types';

const storageMock = vi.hoisted(() => ({
  loadExamConfig: vi.fn(),
  loadAllQuestions: vi.fn(),
  saveAttempt: vi.fn(async () => undefined),
  deleteAttempt: vi.fn(async () => undefined),
  getAttempts: vi.fn(async () => [] as ExamAttempt[]),
  loadUserSettings: vi.fn(
    async (): Promise<Partial<UserSettings> | null> => null,
  ),
  saveUserSettings: vi.fn(async () => undefined),
  clearAllData: vi.fn(async () => undefined),
  syncAttemptsToLocalStorage: vi.fn(),
}));

vi.mock('../services/storage', () => storageMock);

import { DEFAULT_SETTINGS, useExamStore } from '../store/useExamStore';
import { getRemainingSeconds } from '../services/timer';
import { calculateExamResult } from '../services/scoring';

const baseTime = new Date('2026-03-01T12:00:00Z').getTime();

const config: ExamConfig = {
  id: 'config_test',
  title: 'Simulado de teste',
  noticeNumber: 'Edital teste',
  cargo: 'Cargo teste',
  organizer: 'Banca teste',
  totalQuestions: 7,
  durationMinutes: 30,
  subjects: [
    { id: 'portugues', name: 'Língua Portuguesa', questionCount: 2, weight: 1, minCorrect: 0 },
    { id: 'matematica', name: 'Matemática', questionCount: 2, weight: 1, minCorrect: 0 },
    {
      id: 'conhecimentos_especificos',
      name: 'Conhecimentos Específicos',
      questionCount: 3,
      weight: 1,
      minCorrect: 2,
    },
  ],
  passingCriteria: {
    minGeneralScorePercent: 50,
    minSpecificScorePercent: 50,
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

const bank: Question[] = [
  makeQuestion('pt_1', 'portugues'),
  makeQuestion('pt_2', 'portugues'),
  makeQuestion('mt_1', 'matematica'),
  makeQuestion('mt_2', 'matematica'),
  makeQuestion('es_1', 'conhecimentos_especificos'),
  makeQuestion('es_2', 'conhecimentos_especificos'),
  makeQuestion('es_3', 'conhecimentos_especificos'),
];

function resetStore(): void {
  useExamStore.setState({
    config: null,
    questions: [],
    allQuestionsBank: [],
    currentAttempt: null,
    history: [],
    isLoading: false,
    error: null,
    startError: null,
    view: 'home',
    currentQuestionIndex: 0,
    settings: DEFAULT_SETTINGS,
    isPausingExam: false,
    regradeSummary: null,
  });
}

function startExam(): ExamAttempt {
  const started = useExamStore
    .getState()
    .startExam({ immediateCorrection: false, durationMinutes: 30 });
  expect(started).toBe(true);
  const attempt = useExamStore.getState().currentAttempt;
  expect(attempt).not.toBeNull();
  return attempt as ExamAttempt;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(baseTime);
  vi.clearAllMocks();
  storageMock.loadExamConfig.mockResolvedValue(config);
  storageMock.loadAllQuestions.mockResolvedValue(bank);
  storageMock.getAttempts.mockResolvedValue([]);
  storageMock.loadUserSettings.mockResolvedValue(null);
  storageMock.saveAttempt.mockResolvedValue(undefined);
  storageMock.deleteAttempt.mockResolvedValue(undefined);
  storageMock.saveUserSettings.mockResolvedValue(undefined);
  resetStore();
  useExamStore.setState({ config, allQuestionsBank: bank });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  resetStore();
});

describe('Sessão do simulado', () => {
  it('segue a ordem oficial das matérias e embaralha dentro de cada uma', () => {
    // Com o gerador fixo em 0, o Fisher-Yates produz uma ordem determinística.
    // As matérias seguem a ordem da prova (Português -> Matemática -> Específicos),
    // mas as questões de cada bloco são embaralhadas.
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const attempt = startExam();
    const state = useExamStore.getState();

    expect(state.view).toBe('exam');
    expect(state.questions).toHaveLength(7);
    expect(state.questions.map((question) => question.id)).toEqual([
      'pt_2',
      'pt_1',
      'mt_2',
      'mt_1',
      'es_2',
      'es_3',
      'es_1',
    ]);
    expect(state.questions.map((question) => question.subjectId)).toEqual([
      'portugues',
      'portugues',
      'matematica',
      'matematica',
      'conhecimentos_especificos',
      'conhecimentos_especificos',
      'conhecimentos_especificos',
    ]);
    expect(state.questions.filter((q) => q.subjectId === 'portugues')).toHaveLength(2);
    expect(state.questions.filter((q) => q.subjectId === 'matematica')).toHaveLength(2);
    expect(
      state.questions.filter((q) => q.subjectId === 'conhecimentos_especificos'),
    ).toHaveLength(3);
    expect(attempt.questionIds).toHaveLength(7);
    expect(attempt.durationMinutes).toBe(30);
    expect(attempt.timeRemainingSeconds).toBe(1800);
    expect(attempt.isPaused).toBe(false);
    expect(storageMock.saveAttempt).toHaveBeenCalled();
  });

  it('sorteia um subconjunto aleatório quando o banco tem mais questões que o edital', () => {
    const largerBank: Question[] = [
      ...bank,
      makeQuestion('pt_3', 'portugues'),
      makeQuestion('pt_4', 'portugues'),
      makeQuestion('mt_3', 'matematica'),
      makeQuestion('mt_4', 'matematica'),
      makeQuestion('es_4', 'conhecimentos_especificos'),
      makeQuestion('es_5', 'conhecimentos_especificos'),
    ];
    useExamStore.setState({ allQuestionsBank: largerBank });

    startExam();
    const state = useExamStore.getState();

    expect(state.questions).toHaveLength(7);
    expect(new Set(state.questions.map((q) => q.id)).size).toBe(7);
    expect(state.questions.filter((q) => q.subjectId === 'portugues')).toHaveLength(2);
    expect(state.questions.filter((q) => q.subjectId === 'matematica')).toHaveLength(2);
    expect(
      state.questions.filter((q) => q.subjectId === 'conhecimentos_especificos'),
    ).toHaveLength(3);
    expect(state.questions.length).toBeLessThan(largerBank.length);
  });

  it('filtra e embaralha apenas as questões da matéria selecionada', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const started = useExamStore.getState().startExam({
      immediateCorrection: false,
      durationMinutes: 30,
      selectedSubjectIds: ['portugues'],
    });
    const state = useExamStore.getState();

    expect(started).toBe(true);
    expect(state.questions).toHaveLength(2);
    expect(state.questions.every((q) => q.subjectId === 'portugues')).toBe(true);
    expect(state.questions.map((q) => q.id)).toEqual(['pt_2', 'pt_1']);
  });

  it('recusa iniciar outro simulado enquanto um está em andamento', () => {
    startExam();
    const started = useExamStore
      .getState()
      .startExam({ immediateCorrection: true, durationMinutes: 60 });
    const state = useExamStore.getState();

    expect(started).toBe(false);
    expect(state.startError).toMatch(/em andamento/i);
    expect(state.currentAttempt?.durationMinutes).toBe(30);
  });

  it('congela o cronômetro ao pausar e continua de onde parou', async () => {
    startExam();
    vi.advanceTimersByTime(60_000);

    await useExamStore.getState().pauseExam();
    let state = useExamStore.getState();
    expect(state.currentAttempt?.isPaused).toBe(true);
    expect(state.currentAttempt?.lastResumedAt).toBeUndefined();
    const frozen = getRemainingSeconds(state.currentAttempt, 30);
    expect(frozen).toBe(1740);

    // Pausar novamente não pode alterar o saldo congelado.
    vi.advanceTimersByTime(300_000);
    await useExamStore.getState().pauseExam();
    state = useExamStore.getState();
    expect(getRemainingSeconds(state.currentAttempt, 30)).toBe(1740);

    useExamStore.getState().resumeExam();
    expect(useExamStore.getState().currentAttempt?.isPaused).toBe(false);

    vi.advanceTimersByTime(30_000);
    await useExamStore.getState().pauseExam();
    expect(getRemainingSeconds(useExamStore.getState().currentAttempt, 30)).toBe(1710);
  });

  it('mantém a pausa e o tempo congelado após recarregar a página', async () => {
    startExam();
    vi.advanceTimersByTime(90_000);
    await useExamStore.getState().pauseExam();

    const savedCalls = storageMock.saveAttempt.mock.calls as unknown as Array<
      [ExamAttempt]
    >;
    const persisted = savedCalls.at(-1)?.[0] as ExamAttempt;
    expect(persisted.isPaused).toBe(true);
    expect(persisted.lastResumedAt).toBeUndefined();
    expect(persisted.timeRemainingSeconds).toBe(1710);

    // Simula um recarregamento: o store nasce em "home" e reidrata do storage.
    useExamStore.setState({ view: 'home' });
    storageMock.getAttempts.mockResolvedValue([persisted]);
    vi.advanceTimersByTime(600_000); // tempo com a página fechada/atualizada
    await useExamStore.getState().initApp();

    const restored = useExamStore.getState().currentAttempt;
    expect(restored?.isPaused).toBe(true);
    expect(restored?.isCompleted).toBe(false);
    expect(getRemainingSeconds(restored, 30)).toBe(1710);
    expect(useExamStore.getState().questions).toHaveLength(7);
    expect(useExamStore.getState().view).toBe('home');

    // Ao continuar, o relógio retoma do saldo congelado.
    useExamStore.getState().resumeExam();
    vi.advanceTimersByTime(30_000);
    expect(getRemainingSeconds(useExamStore.getState().currentAttempt, 30)).toBe(1680);
  });

  it('só conclui a pausa após gravar e ignora cliques repetidos', async () => {
    startExam();

    let finishSave: (() => void) | undefined;
    storageMock.saveAttempt.mockImplementationOnce(
      () =>
        new Promise<undefined>((resolve) => {
          finishSave = () => resolve(undefined);
        }),
    );

    const firstPause = useExamStore.getState().pauseExam();
    expect(useExamStore.getState().isPausingExam).toBe(true);
    expect(useExamStore.getState().currentAttempt?.isPaused).toBe(false);

    // Um segundo clique enquanto a gravação está em curso não inicia outra.
    await useExamStore.getState().pauseExam();
    expect(useExamStore.getState().isPausingExam).toBe(true);

    finishSave?.();
    await firstPause;

    expect(useExamStore.getState().isPausingExam).toBe(false);
    expect(useExamStore.getState().currentAttempt?.isPaused).toBe(true);
  });

  it('bloqueia respostas e marcações enquanto pausado', async () => {
    startExam();
    const questionId = useExamStore.getState().questions[0].id;

    await useExamStore.getState().pauseExam();
    useExamStore.getState().setAnswer(questionId, 'B');
    useExamStore.getState().toggleMarkReview(questionId);

    const attempt = useExamStore.getState().currentAttempt;
    expect(attempt?.answers[questionId]).toBeUndefined();
    expect(attempt?.markedForReview[questionId]).toBeUndefined();

    useExamStore.getState().resumeExam();
    useExamStore.getState().setAnswer(questionId, 'B');
    expect(useExamStore.getState().currentAttempt?.answers[questionId]).toBe('B');
  });

  it('persiste o índice da questão navegada', () => {
    startExam();
    useExamStore.getState().setCurrentQuestionIndex(4);

    expect(useExamStore.getState().currentQuestionIndex).toBe(4);
    expect(useExamStore.getState().currentAttempt?.lastQuestionIndex).toBe(4);

    useExamStore.getState().setCurrentQuestionIndex(999);
    expect(useExamStore.getState().currentQuestionIndex).toBe(6);
  });

  it('descarta o simulado e limpa o estado atual', async () => {
    const attempt = startExam();
    useExamStore.setState({ view: 'exam' });

    await useExamStore.getState().discardAttempt();

    const state = useExamStore.getState();
    expect(storageMock.deleteAttempt).toHaveBeenCalledWith(attempt.id);
    expect(state.currentAttempt).toBeNull();
    expect(state.history).toHaveLength(0);
    expect(state.questions).toHaveLength(0);
    expect(state.view).toBe('home');
  });

  it('remove um simulado concluído do histórico sem sair da tela', async () => {
    const completed = expiredAttemptFixture('history_delete', baseTime - 15_000);
    useExamStore.setState({
      history: [completed],
      currentAttempt: completed,
      view: 'history',
    });

    await useExamStore.getState().discardAttempt(completed.id);

    const state = useExamStore.getState();
    expect(storageMock.deleteAttempt).toHaveBeenCalledWith(completed.id);
    expect(state.history).toHaveLength(0);
    expect(state.currentAttempt).toBeNull();
    expect(state.questions).toHaveLength(0);
    expect(state.view).toBe('history');
  });

  it('abre o resultado de tentativa concluída mesmo sem questões salvas', () => {
    const legacyCompleted = {
      ...expiredAttemptFixture('legacy_completed', baseTime - 30_000),
      questionIds: undefined,
    };

    expect(useExamStore.getState().resumeAttempt(legacyCompleted)).toBe(true);
    const state = useExamStore.getState();

    expect(state.view).toBe('result');
    expect(state.currentAttempt?.id).toBe('legacy_completed');
    expect(state.questions).toHaveLength(0);
    expect(state.startError).toBeNull();
  });

  it('recusa retomar tentativas antigas sem questões salvas', () => {
    const legacy: ExamAttempt = {
      id: 'legacy',
      configId: config.id,
      startTime: baseTime - 60_000,
      timeSpentSeconds: 0,
      answers: {},
      markedForReview: {},
      immediateCorrection: false,
      isCompleted: false,
    };

    expect(useExamStore.getState().resumeAttempt(legacy)).toBe(false);
    expect(useExamStore.getState().startError).toMatch(/restaurar as questões/i);
  });
});

describe('Inicialização e restauração', () => {
  it('restaura simulado pausado, última questão e preferências salvas', async () => {
    const pausedAttempt: ExamAttempt = {
      id: 'paused',
      configId: config.id,
      startTime: baseTime - 600_000,
      timeSpentSeconds: 0,
      answers: { pt_1: 'B' },
      markedForReview: { pt_2: true },
      immediateCorrection: true,
      isCompleted: false,
      isPaused: true,
      questionIds: bank.map((question) => question.id),
      durationMinutes: 30,
      timeRemainingSeconds: 900,
      lastQuestionIndex: 4,
    };

    storageMock.getAttempts.mockResolvedValue([pausedAttempt]);
    storageMock.loadUserSettings.mockResolvedValue({
      defaultDurationMinutes: 90,
      defaultImmediateCorrection: true,
    });

    await useExamStore.getState().initApp();
    const state = useExamStore.getState();

    expect(state.error).toBeNull();
    expect(state.currentAttempt?.id).toBe('paused');
    expect(state.questions).toHaveLength(7);
    expect(state.currentQuestionIndex).toBe(4);
    expect(state.settings.defaultDurationMinutes).toBe(90);
    expect(state.settings.defaultImmediateCorrection).toBe(true);
    expect(getRemainingSeconds(state.currentAttempt, 30)).toBe(900);
  });

  it('finaliza automaticamente quando o prazo venceu com o app fechado', async () => {
    const expiredAttempt: ExamAttempt = {
      id: 'expired',
      configId: config.id,
      startTime: baseTime - 120_000,
      timeSpentSeconds: 0,
      answers: { pt_1: 'A', pt_2: 'B' },
      markedForReview: {},
      immediateCorrection: false,
      isCompleted: false,
      isPaused: false,
      questionIds: bank.map((question) => question.id),
      durationMinutes: 1,
      timeRemainingSeconds: 60,
      lastResumedAt: baseTime - 120_000,
    };

    storageMock.getAttempts.mockResolvedValue([expiredAttempt]);
    await useExamStore.getState().initApp();

    const state = useExamStore.getState();
    expect(state.currentAttempt?.isCompleted).toBe(true);
    expect(state.currentAttempt?.scoreData).toBeDefined();
    expect(state.view).toBe('result');
    expect(state.history[0].id).toBe('expired');
  });

  it('ordena o histórico do mais recente para o mais antigo', async () => {
    const older = { ...expiredAttemptFixture('older', baseTime - 10_000) };
    const newer = { ...expiredAttemptFixture('newer', baseTime - 5_000) };

    storageMock.getAttempts.mockResolvedValue([older, newer]);
    await useExamStore.getState().initApp();

    expect(useExamStore.getState().history.map((item) => item.id)).toEqual([
      'newer',
      'older',
    ]);
  });

  it('recalcula a nota de tentativas concluídas com o gabarito corrigido', async () => {
    const attempt: ExamAttempt = {
      id: 'regrade_me',
      configId: config.id,
      startTime: baseTime - 60_000,
      endTime: baseTime - 30_000,
      timeSpentSeconds: 60,
      answers: {
        pt_1: 'B',
        pt_2: 'A',
        mt_1: 'A',
        mt_2: 'A',
        es_1: 'A',
        es_2: 'A',
        es_3: 'A',
      },
      markedForReview: {},
      immediateCorrection: false,
      isCompleted: true,
      questionIds: bank.map((question) => question.id),
      durationMinutes: 30,
      timeRemainingSeconds: 1740,
      lastQuestionIndex: 0,
    };

    // Nota antiga: pt_1 tinha gabarito A, então a resposta B era considerada erro.
    const oldScore = calculateExamResult(attempt, bank, config, 60);
    storageMock.getAttempts.mockResolvedValue([{ ...attempt, scoreData: oldScore }]);
    storageMock.loadAllQuestions.mockResolvedValue(
      bank.map((question) =>
        question.id === 'pt_1' ? { ...question, correctAnswer: 'B' } : question,
      ),
    );

    await useExamStore.getState().initApp();
    const state = useExamStore.getState();

    expect(state.regradeSummary?.count).toBe(1);
    expect(state.regradeSummary?.changes[0]).toMatchObject({
      attemptId: 'regrade_me',
      previousPercentage: oldScore.percentage,
      newPercentage: 100,
    });
    expect(state.history[0].scoreData?.correctCount).toBe(7);
    expect(state.history[0].scoreData?.percentage).toBe(100);
    expect(state.history[0].schemaVersion).toBe(2);
    expect(state.history[0].status).toBe('APROVADO');
    expect(state.history[0].scoreTotal).toBeDefined();
    expect(storageMock.saveAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'regrade_me',
        schemaVersion: 2,
        scoreData: expect.objectContaining({ percentage: 100, correctCount: 7 }),
      }),
    );
  });

  it('migra tentativa antiga sem questionIds usando o scoreData salvo', async () => {
    const fixture = expiredAttemptFixture('legacy_migrated', baseTime - 10_000);
    const legacy: ExamAttempt = {
      ...fixture,
      questionIds: undefined,
      scoreData: {
        ...fixture.scoreData!,
        correctCount: 4,
        incorrectCount: 0,
        blankCount: 3,
        generalCorrect: 2,
        specificCorrect: 2,
        subjectPerformance: {
          portugues: { correct: 2, total: 2, percentage: 100 },
          matematica: { correct: 0, total: 2, percentage: 0 },
          conhecimentos_especificos: { correct: 2, total: 3, percentage: 66.67 },
        },
        percentage: 100,
        passed: true,
        failureReason: '',
      },
    };

    storageMock.getAttempts.mockResolvedValue([legacy]);
    await useExamStore.getState().initApp();
    const state = useExamStore.getState();
    const migrated = state.history[0];

    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.status).toBe('REPROVADO');
    expect(migrated.percentage).toBe(57.14);
    expect(migrated.scoreTotal).toBe(4);
    expect(migrated.maxScore).toBe(7);
    expect(migrated.subjectBreakdown?.matematica.eliminated).toBe(true);
    expect(migrated.subjectBreakdown?.portugues.eliminated).toBe(false);
    expect(state.regradeSummary?.migratedCount).toBe(1);
    expect(state.regradeSummary?.changes[0]).toMatchObject({
      attemptId: 'legacy_migrated',
      previousPercentage: 100,
      newPercentage: 57.14,
      previousPassed: true,
      newPassed: false,
      migrated: true,
    });
    expect(storageMock.saveAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'legacy_migrated',
        schemaVersion: 2,
        status: 'REPROVADO',
      }),
    );
  });

  it('migra o histórico quando a tela de histórico é aberta', async () => {
    const fixture = expiredAttemptFixture('legacy_on_history', baseTime - 20_000);
    const legacy: ExamAttempt = {
      ...fixture,
      questionIds: undefined,
      scoreData: {
        ...fixture.scoreData!,
        subjectPerformance: {
          portugues: { correct: 2, total: 2, percentage: 100 },
          matematica: { correct: 2, total: 2, percentage: 100 },
          conhecimentos_especificos: { correct: 3, total: 3, percentage: 100 },
        },
        correctCount: 7,
        blankCount: 0,
        generalCorrect: 4,
        specificCorrect: 3,
        percentage: 100,
        passed: true,
        failureReason: '',
      },
    };

    storageMock.getAttempts.mockResolvedValue([legacy]);
    await useExamStore.getState().recalculateHistory();

    const state = useExamStore.getState();
    expect(state.history[0].schemaVersion).toBe(2);
    expect(state.history[0].status).toBe('APROVADO');
    expect(state.regradeSummary?.migratedCount).toBe(1);
    expect(storageMock.saveAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'legacy_on_history', schemaVersion: 2 }),
    );
  });

  it('não migra tentativa antiga sem dados suficientes', async () => {
    const legacy = {
      ...expiredAttemptFixture('legacy_regrade', baseTime - 10_000),
      questionIds: undefined,
    };

    storageMock.getAttempts.mockResolvedValue([legacy]);
    await useExamStore.getState().initApp();

    expect(useExamStore.getState().regradeSummary).toBeNull();
    expect(useExamStore.getState().history[0].scoreData?.percentage).toBe(0);
    expect(useExamStore.getState().history[0].schemaVersion).toBeUndefined();
    expect(storageMock.saveAttempt).not.toHaveBeenCalled();
  });
});

function expiredAttemptFixture(id: string, startTime: number): ExamAttempt {
  return {
    id,
    configId: config.id,
    startTime,
    timeSpentSeconds: 60,
    answers: {},
    markedForReview: {},
    immediateCorrection: false,
    isCompleted: true,
    questionIds: bank.map((question) => question.id),
    durationMinutes: 30,
    timeRemainingSeconds: 1200,
    scoreData: {
      totalQuestions: 7,
      correctCount: 0,
      incorrectCount: 0,
      blankCount: 7,
      generalCorrect: 0,
      generalTotal: 4,
      specificCorrect: 0,
      specificTotal: 3,
      subjectPerformance: {},
      percentage: 0,
      passed: false,
      failureReason: 'Teste',
      timeSpentSeconds: 60,
    },
  };
}
