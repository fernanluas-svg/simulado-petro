import { create } from 'zustand';
import type {
  ExamConfig,
  Question,
  ExamAttempt,
  ExamResult,
  UserSettings,
  SubjectConfig,
} from '../types';
import {
  loadExamConfig,
  loadAllQuestions,
  saveAttempt,
  deleteAttempt,
  getAttempts,
  loadUserSettings,
  saveUserSettings,
} from '../services/storage';
import {
  clampDurationMinutes,
  getRemainingSeconds,
  getTotalSeconds,
} from '../services/timer';

export type ExamView =
  | 'home'
  | 'setup'
  | 'exam'
  | 'result'
  | 'review'
  | 'history'
  | 'bank'
  | 'settings';

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  defaultImmediateCorrection: false,
  defaultDurationMinutes: 240,
  soundEnabled: true,
};

function normalizeSettings(settings?: Partial<UserSettings> | null): UserSettings {
  return {
    theme: settings?.theme === 'light' ? 'light' : 'dark',
    defaultImmediateCorrection: Boolean(
      settings?.defaultImmediateCorrection ?? DEFAULT_SETTINGS.defaultImmediateCorrection,
    ),
    defaultDurationMinutes: clampDurationMinutes(
      settings?.defaultDurationMinutes ?? DEFAULT_SETTINGS.defaultDurationMinutes,
    ),
    soundEnabled: settings?.soundEnabled ?? DEFAULT_SETTINGS.soundEnabled,
  };
}

function sortAttempts(attempts: ExamAttempt[]): ExamAttempt[] {
  return [...attempts].sort((a, b) => b.startTime - a.startTime);
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function restoreQuestions(attempt: ExamAttempt, bank: Question[]): Question[] {
  if (!attempt.questionIds?.length) return [];
  const byId = new Map(bank.map((question) => [question.id, question]));
  return attempt.questionIds
    .map((id) => byId.get(id))
    .filter((question): question is Question => Boolean(question));
}

function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return Math.min(Math.max(0, index), length - 1);
}

function persistAttempt(attempt: ExamAttempt): void {
  void saveAttempt(attempt).catch((error) => {
    console.error('Falha ao persistir a tentativa.', error);
  });
}

interface ExamState {
  config: ExamConfig | null;
  questions: Question[];
  allQuestionsBank: Question[];
  currentAttempt: ExamAttempt | null;
  history: ExamAttempt[];
  isLoading: boolean;
  error: string | null;
  startError: string | null;
  view: ExamView;
  currentQuestionIndex: number;
  settings: UserSettings;

  // Actions
  initApp: () => Promise<void>;
  setView: (view: ExamView) => void;
  startExam: (options: {
    immediateCorrection: boolean;
    durationMinutes?: number;
    selectedSubjectIds?: string[];
  }) => boolean;
  setAnswer: (questionId: string, alternativeId: string) => void;
  toggleMarkReview: (questionId: string) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setImmediateCorrection: (enabled: boolean) => void;
  pauseExam: () => void;
  resumeExam: () => void;
  finishExam: () => void;
  loadHistory: () => Promise<void>;
  resumeAttempt: (attempt: ExamAttempt) => boolean;
  discardAttempt: (attemptId?: string) => Promise<void>;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  clearStartError: () => void;
}

export const useExamStore = create<ExamState>((set, get) => ({
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

  initApp: async () => {
    set({ isLoading: true, error: null });
    try {
      const [config, allQuestionsBank, storedHistory, storedSettings] = await Promise.all([
        loadExamConfig(),
        loadAllQuestions(),
        getAttempts(),
        loadUserSettings(),
      ]);

      for (const subject of config.subjects) {
        const questionCount = allQuestionsBank.filter(
          (question) => question.subjectId === subject.id,
        ).length;
        if (questionCount === 0) {
          throw new Error(`Nenhuma questão encontrada para ${subject.name}.`);
        }
      }

      const history = sortAttempts(storedHistory);
      const activeAttempt = history.find((attempt) => !attempt.isCompleted) ?? null;
      const latestCompleted = history.find((attempt) => attempt.isCompleted) ?? null;
      const attemptToOpen = activeAttempt ?? latestCompleted;

      let questions: Question[] = [];
      if (attemptToOpen) {
        const restored = restoreQuestions(attemptToOpen, allQuestionsBank);
        const expected = attemptToOpen.questionIds?.length ?? 0;
        const canUse = !activeAttempt || (expected > 0 && restored.length === expected);
        questions = canUse ? restored : [];
      }

      const index = clampIndex(attemptToOpen?.lastQuestionIndex ?? 0, questions.length);

      set({
        config,
        allQuestionsBank,
        history,
        settings: normalizeSettings(storedSettings),
        currentAttempt: attemptToOpen,
        questions,
        currentQuestionIndex: index,
        isLoading: false,
        startError: null,
      });

      // Se o prazo venceu enquanto o app estava fechado, corrige imediatamente.
      if (
        activeAttempt &&
        questions.length > 0 &&
        !activeAttempt.isPaused &&
        getRemainingSeconds(activeAttempt, config.durationMinutes) <= 0
      ) {
        get().finishExam();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao inicializar aplicativo.';
      set({ error: message, isLoading: false });
    }
  },

  setView: (view) => set({ view }),

  startExam: ({ immediateCorrection, durationMinutes, selectedSubjectIds }) => {
    const { config, allQuestionsBank, currentAttempt } = get();

    if (!config) {
      set({ startError: 'Configuração do edital não carregada.' });
      return false;
    }

    if (currentAttempt && !currentAttempt.isCompleted) {
      set({
        startError:
          'Já existe um simulado em andamento. Retome-o ou descarte-o antes de iniciar outro.',
      });
      return false;
    }

    const allSubjectIds = config.subjects.map((subject) => subject.id);
    const subjectsToUse =
      selectedSubjectIds && selectedSubjectIds.length > 0
        ? selectedSubjectIds.filter((id) => allSubjectIds.includes(id))
        : allSubjectIds;

    if (subjectsToUse.length === 0) {
      set({ startError: 'Selecione pelo menos uma matéria.' });
      return false;
    }

    const selectedQuestions: Question[] = [];
    for (const subjectId of subjectsToUse) {
      const subjectConfig = config.subjects.find((subject) => subject.id === subjectId);
      const available = allQuestionsBank.filter(
        (question) => question.subjectId === subjectId,
      );
      if (!subjectConfig || available.length === 0) continue;

      const count = Math.min(subjectConfig.questionCount, available.length);
      selectedQuestions.push(...shuffle(available).slice(0, count));
    }

    const orderedQuestions: Question[] = [];
    for (const subjectConfig of config.subjects) {
      if (!subjectsToUse.includes(subjectConfig.id)) continue;
      orderedQuestions.push(
        ...selectedQuestions.filter((question) => question.subjectId === subjectConfig.id),
      );
    }

    if (orderedQuestions.length === 0) {
      set({ startError: 'Não há questões disponíveis para as matérias selecionadas.' });
      return false;
    }

    const totalMinutes = clampDurationMinutes(
      durationMinutes ?? config.durationMinutes,
    );
    const now = Date.now();
    const newAttempt: ExamAttempt = {
      id: `attempt_${now}_${Math.random().toString(36).slice(2, 8)}`,
      configId: config.id,
      startTime: now,
      timeSpentSeconds: 0,
      answers: {},
      markedForReview: {},
      immediateCorrection,
      isCompleted: false,
      isPaused: false,
      questionIds: orderedQuestions.map((question) => question.id),
      durationMinutes: totalMinutes,
      timeRemainingSeconds: totalMinutes * 60,
      lastResumedAt: now,
      lastQuestionIndex: 0,
    };

    persistAttempt(newAttempt);

    set((state) => ({
      questions: orderedQuestions,
      currentAttempt: newAttempt,
      currentQuestionIndex: 0,
      history: [newAttempt, ...state.history.filter((item) => item.id !== newAttempt.id)],
      view: 'exam',
      startError: null,
    }));

    return true;
  },

  setAnswer: (questionId, alternativeId) => {
    const { currentAttempt } = get();
    if (!currentAttempt || currentAttempt.isCompleted || currentAttempt.isPaused) return;

    const updatedAttempt: ExamAttempt = {
      ...currentAttempt,
      answers: { ...currentAttempt.answers, [questionId]: alternativeId },
    };
    persistAttempt(updatedAttempt);
    set({ currentAttempt: updatedAttempt });
  },

  toggleMarkReview: (questionId) => {
    const { currentAttempt } = get();
    if (!currentAttempt || currentAttempt.isCompleted || currentAttempt.isPaused) return;

    const currentMarked = currentAttempt.markedForReview[questionId] || false;
    const updatedAttempt: ExamAttempt = {
      ...currentAttempt,
      markedForReview: {
        ...currentAttempt.markedForReview,
        [questionId]: !currentMarked,
      },
    };
    persistAttempt(updatedAttempt);
    set({ currentAttempt: updatedAttempt });
  },

  setCurrentQuestionIndex: (index) => {
    const { currentAttempt, questions } = get();
    const safeIndex = clampIndex(index, questions.length);
    set({ currentQuestionIndex: safeIndex });

    if (currentAttempt && !currentAttempt.isCompleted && currentAttempt.lastQuestionIndex !== safeIndex) {
      const updatedAttempt: ExamAttempt = { ...currentAttempt, lastQuestionIndex: safeIndex };
      persistAttempt(updatedAttempt);
      set({ currentAttempt: updatedAttempt });
    }
  },

  setImmediateCorrection: (enabled) => {
    const { currentAttempt } = get();
    if (!currentAttempt || currentAttempt.isCompleted) return;
    const updatedAttempt: ExamAttempt = { ...currentAttempt, immediateCorrection: enabled };
    persistAttempt(updatedAttempt);
    set({ currentAttempt: updatedAttempt });
  },

  pauseExam: () => {
    const { currentAttempt, config, currentQuestionIndex } = get();
    if (!currentAttempt || currentAttempt.isCompleted || currentAttempt.isPaused) return;

    const pausedAttempt: ExamAttempt = {
      ...currentAttempt,
      isPaused: true,
      timeRemainingSeconds: getRemainingSeconds(currentAttempt, config?.durationMinutes),
      lastResumedAt: undefined,
      lastQuestionIndex: currentQuestionIndex,
    };
    persistAttempt(pausedAttempt);
    set({ currentAttempt: pausedAttempt });
  },

  resumeExam: () => {
    const { currentAttempt, config } = get();
    if (!currentAttempt || currentAttempt.isCompleted || !currentAttempt.isPaused) return;

    const resumedAttempt: ExamAttempt = {
      ...currentAttempt,
      isPaused: false,
      timeRemainingSeconds: getRemainingSeconds(currentAttempt, config?.durationMinutes),
      lastResumedAt: Date.now(),
    };
    persistAttempt(resumedAttempt);
    set({ currentAttempt: resumedAttempt });
  },

  finishExam: () => {
    const { currentAttempt, questions, config, currentQuestionIndex } = get();
    if (!currentAttempt || !config || currentAttempt.isCompleted || questions.length === 0) {
      return;
    }

    const totalSeconds = getTotalSeconds(currentAttempt, config.durationMinutes);
    const remainingSeconds = getRemainingSeconds(currentAttempt, config.durationMinutes);
    const endTime = Date.now();
    const timeSpentSeconds = Math.max(0, totalSeconds - remainingSeconds);
    const subjectConfigById = new Map(
      config.subjects.map((subject) => [subject.id, subject] as const),
    );

    let correctCount = 0;
    let incorrectCount = 0;
    let blankCount = 0;
    let generalCorrect = 0;
    let generalTotal = 0;
    let specificCorrect = 0;
    let specificTotal = 0;
    let weightedCorrect = 0;
    let weightedTotal = 0;

    const subjectPerformance: ExamResult['subjectPerformance'] = {};

    for (const question of questions) {
      const subjectId = question.subjectId;
      if (!subjectPerformance[subjectId]) {
        subjectPerformance[subjectId] = { correct: 0, total: 0, percentage: 0 };
      }

      const subjectConfig = subjectConfigById.get(subjectId);
      const weight = subjectConfig?.weight ?? 1;
      const isGeneral = subjectId === 'portugues' || subjectId === 'matematica';
      const userAnswer = currentAttempt.answers[question.id];

      subjectPerformance[subjectId].total += 1;
      weightedTotal += weight;

      if (isGeneral) generalTotal += 1;
      else specificTotal += 1;

      if (!userAnswer) {
        blankCount += 1;
      } else if (userAnswer === question.correctAnswer) {
        correctCount += 1;
        subjectPerformance[subjectId].correct += 1;
        weightedCorrect += weight;
        if (isGeneral) generalCorrect += 1;
        else specificCorrect += 1;
      } else {
        incorrectCount += 1;
      }
    }

    for (const subjectId of Object.keys(subjectPerformance)) {
      const performance = subjectPerformance[subjectId];
      performance.percentage =
        performance.total > 0
          ? Math.round((performance.correct / performance.total) * 10000) / 100
          : 0;
    }

    const percentage =
      weightedTotal > 0
        ? Math.round((weightedCorrect / weightedTotal) * 10000) / 100
        : 0;

    const generalPct = generalTotal > 0 ? (generalCorrect / generalTotal) * 100 : null;
    const specificPct = specificTotal > 0 ? (specificCorrect / specificTotal) * 100 : null;
    const criteria = config.passingCriteria;
    const failureReasons: string[] = [];

    if (generalPct !== null) {
      if (
        criteria.minGeneralScorePercent !== undefined &&
        generalPct < criteria.minGeneralScorePercent
      ) {
        failureReasons.push(
          `Conhecimentos Gerais abaixo do mínimo (${generalPct.toFixed(1)}% < ${criteria.minGeneralScorePercent}%).`,
        );
      }
      if (
        criteria.minGeneralCorrect !== undefined &&
        generalCorrect < criteria.minGeneralCorrect
      ) {
        failureReasons.push(
          `Conhecimentos Gerais com menos de ${criteria.minGeneralCorrect} acertos (${generalCorrect}).`,
        );
      }
    }

    if (specificPct !== null) {
      if (
        criteria.minSpecificScorePercent !== undefined &&
        specificPct < criteria.minSpecificScorePercent
      ) {
        failureReasons.push(
          `Conhecimentos Específicos abaixo do mínimo (${specificPct.toFixed(1)}% < ${criteria.minSpecificScorePercent}%).`,
        );
      }
      if (
        criteria.minSpecificCorrect !== undefined &&
        specificCorrect < criteria.minSpecificCorrect
      ) {
        failureReasons.push(
          `Conhecimentos Específicos com menos de ${criteria.minSpecificCorrect} acertos (${specificCorrect}).`,
        );
      }
    }

    for (const [subjectId, performance] of Object.entries(subjectPerformance)) {
      const subjectConfig = subjectConfigById.get(subjectId);
      if (!subjectConfig) continue;

      if (
        subjectConfig.minCorrect !== undefined &&
        performance.correct < subjectConfig.minCorrect
      ) {
        failureReasons.push(
          `${subjectConfig.name}: mínimo de ${subjectConfig.minCorrect} acertos (obteve ${performance.correct}).`,
        );
      }

      if (
        !criteria.allowZeroInAnySubject &&
        performance.total > 0 &&
        performance.correct === 0
      ) {
        failureReasons.push(`Zerou ${subjectConfig.name}.`);
      }
    }

    const passed = failureReasons.length === 0;
    const result: ExamResult = {
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
    };

    const completedAttempt: ExamAttempt = {
      ...currentAttempt,
      endTime,
      timeSpentSeconds,
      isCompleted: true,
      isPaused: false,
      lastResumedAt: undefined,
      timeRemainingSeconds: remainingSeconds,
      lastQuestionIndex: currentQuestionIndex,
      scoreData: result,
    };

    persistAttempt(completedAttempt);

    set((state) => ({
      currentAttempt: completedAttempt,
      history: [
        completedAttempt,
        ...state.history.filter((item) => item.id !== completedAttempt.id),
      ],
      view: 'result',
      startError: null,
    }));
  },

  loadHistory: async () => {
    const history = sortAttempts(await getAttempts());
    set({ history });
  },

  resumeAttempt: (attempt) => {
    const { config, allQuestionsBank } = get();
    if (!config) return false;

    const restored = restoreQuestions(attempt, allQuestionsBank);
    const expected = attempt.questionIds?.length ?? 0;
    const fullyRestored = expected > 0 ? restored.length === expected : restored.length === 0;

    // Tentativas concluídas sempre podem abrir o resultado; apenas a revisão
    // depende das questões ainda estarem disponíveis no banco.
    if (attempt.isCompleted) {
      set({
        questions: fullyRestored ? restored : [],
        currentAttempt: attempt,
        currentQuestionIndex: clampIndex(attempt.lastQuestionIndex ?? 0, restored.length),
        view: 'result',
        startError: null,
      });
      return true;
    }

    if (restored.length === 0 || !fullyRestored) {
      set({
        startError:
          'Não foi possível restaurar as questões deste simulado. Descarte-o e inicie outro.',
      });
      return false;
    }

    const index = clampIndex(attempt.lastQuestionIndex ?? 0, restored.length);

    const resumedAttempt: ExamAttempt = {
      ...attempt,
      isPaused: false,
      timeRemainingSeconds: getRemainingSeconds(attempt, config.durationMinutes),
      lastResumedAt: Date.now(),
      lastQuestionIndex: index,
    };
    persistAttempt(resumedAttempt);

    set({
      questions: restored,
      currentAttempt: resumedAttempt,
      currentQuestionIndex: index,
      view: 'exam',
      startError: null,
    });
    return true;
  },

  discardAttempt: async (attemptId) => {
    const { currentAttempt } = get();
    const targetId = attemptId ?? currentAttempt?.id;
    if (!targetId) return;

    await deleteAttempt(targetId).catch((error) => {
      console.error('Falha ao descartar a tentativa.', error);
    });

    set((state) => {
      const isCurrent = state.currentAttempt?.id === targetId;
      return {
        history: state.history.filter((item) => item.id !== targetId),
        ...(isCurrent
          ? {
              currentAttempt: null,
              questions: [],
              currentQuestionIndex: 0,
              view: 'home' as const,
            }
          : {}),
        startError: null,
      };
    });
  },

  updateSettings: (newSettings) => {
    const settings = normalizeSettings({ ...get().settings, ...newSettings });
    set({ settings });
    void saveUserSettings(settings).catch((error) => {
      console.error('Falha ao salvar as preferências.', error);
    });
  },

  clearStartError: () => set({ startError: null }),
}));

export function getSubjectName(config: ExamConfig | null, subjectId: string): string {
  const subject: SubjectConfig | undefined = config?.subjects.find(
    (item) => item.id === subjectId,
  );
  return subject?.name ?? subjectId;
}
