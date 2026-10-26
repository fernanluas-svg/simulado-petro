import { create } from 'zustand';
import type { ExamConfig, Question, ExamAttempt, ExamResult, UserSettings } from '../types';
import { loadExamConfig, loadAllQuestions, saveAttempt, getAttempts } from '../services/storage';

interface ExamState {
  config: ExamConfig | null;
  questions: Question[];
  allQuestionsBank: Question[];
  currentAttempt: ExamAttempt | null;
  history: ExamAttempt[];
  isLoading: boolean;
  error: string | null;
  view: 'home' | 'setup' | 'exam' | 'result' | 'review' | 'history' | 'bank' | 'settings';
  currentQuestionIndex: number;
  settings: UserSettings;

  // Actions
  initApp: () => Promise<void>;
  setView: (view: ExamState['view']) => void;
  startExam: (options: { immediateCorrection: boolean; durationMinutes?: number }) => void;
  setAnswer: (questionId: string, alternativeId: string) => void;
  toggleMarkReview: (questionId: string) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setImmediateCorrection: (enabled: boolean) => void;
  finishExam: () => void;
  loadHistory: () => Promise<void>;
  resumeAttempt: (attempt: ExamAttempt) => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
}

export const useExamStore = create<ExamState>((set, get) => ({
  config: null,
  questions: [],
  allQuestionsBank: [],
  currentAttempt: null,
  history: [],
  isLoading: false,
  error: null,
  view: 'home',
  currentQuestionIndex: 0,
  settings: {
    theme: 'dark',
    defaultImmediateCorrection: false,
    defaultDurationMinutes: 240,
    soundEnabled: true,
  },

  initApp: async () => {
    set({ isLoading: true, error: null });
    try {
      const config = await loadExamConfig();
      const allQuestionsBank = await loadAllQuestions();
      const history = await getAttempts();
      set({ config, allQuestionsBank, history, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Erro ao inicializar aplicativo.', isLoading: false });
    }
  },

  setView: (view) => set({ view }),

  startExam: ({ immediateCorrection }) => {
    const { config, allQuestionsBank } = get();
    if (!config) return;

    // Select questions according to config distribution
    const selectedQuestions: Question[] = [];
    for (const subCfg of config.subjects) {
      const subQs = allQuestionsBank.filter((q) => q.subjectId === subCfg.id);
      const shuffled = [...subQs].sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, subCfg.questionCount);
      selectedQuestions.push(...picked);
    }

    const finalQuestions = selectedQuestions.sort(() => Math.random() - 0.5);

    const newAttempt: ExamAttempt = {
      id: 'attempt_' + Date.now(),
      configId: config.id,
      startTime: Date.now(),
      timeSpentSeconds: 0,
      answers: {},
      markedForReview: {},
      immediateCorrection,
      isCompleted: false,
    };

    set({
      questions: finalQuestions,
      currentAttempt: newAttempt,
      currentQuestionIndex: 0,
      view: 'exam',
    });
  },

  setAnswer: (questionId, alternativeId) => {
    const { currentAttempt } = get();
    if (!currentAttempt || currentAttempt.isCompleted) return;

    const updatedAnswers = { ...currentAttempt.answers, [questionId]: alternativeId };
    set({
      currentAttempt: {
        ...currentAttempt,
        answers: updatedAnswers,
      },
    });
  },

  toggleMarkReview: (questionId) => {
    const { currentAttempt } = get();
    if (!currentAttempt) return;

    const currentMarked = currentAttempt.markedForReview[questionId] || false;
    const updatedMarked = { ...currentAttempt.markedForReview, [questionId]: !currentMarked };
    set({
      currentAttempt: {
        ...currentAttempt,
        markedForReview: updatedMarked,
      },
    });
  },

  setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),

  setImmediateCorrection: (enabled) => {
    const { currentAttempt } = get();
    if (!currentAttempt) return;
    set({
      currentAttempt: {
        ...currentAttempt,
        immediateCorrection: enabled,
      },
    });
  },

  finishExam: () => {
    const { currentAttempt, questions, config } = get();
    if (!currentAttempt || !config) return;

    const endTime = Date.now();
    const timeSpentSeconds = Math.floor((endTime - currentAttempt.startTime) / 1000);

    let correctCount = 0;
    let incorrectCount = 0;
    let blankCount = 0;
    let generalCorrect = 0;
    let generalTotal = 0;
    let specificCorrect = 0;
    let specificTotal = 0;

    const subjectPerformance: Record<string, { correct: number; total: number; percentage: number }> = {};

    for (const sub of config.subjects) {
      subjectPerformance[sub.id] = { correct: 0, total: sub.questionCount, percentage: 0 };
    }

    for (const q of questions) {
      const userAns = currentAttempt.answers[q.id];
      const subId = q.subjectId;
      const isGeneral = subId === 'portugues' || subId === 'matematica';

      if (isGeneral) {
        generalTotal++;
      } else {
        specificTotal++;
      }

      if (!userAns) {
        blankCount++;
      } else if (userAns === q.correctAnswer) {
        correctCount++;
        if (isGeneral) generalCorrect++;
        else specificCorrect++;
        if (subjectPerformance[subId]) subjectPerformance[subId].correct++;
      } else {
        incorrectCount++;
      }
    }

    for (const subId in subjectPerformance) {
      const sp = subjectPerformance[subId];
      sp.percentage = sp.total > 0 ? Math.round((sp.correct / sp.total) * 10000) / 100 : 0;
    }

    const percentage = Math.round((correctCount / questions.length) * 10000) / 100;

    const pc = config.passingCriteria;
    let passed = true;
    let failureReason = '';

    const generalPct = generalTotal > 0 ? (generalCorrect / generalTotal) * 100 : 0;
    const specificPct = specificTotal > 0 ? (specificCorrect / specificTotal) * 100 : 0;

    if (pc.minGeneralScorePercent && generalPct < pc.minGeneralScorePercent) {
      passed = false;
      failureReason = `Reprovado por aproveitamento em Conhecimentos Gerais abaixo do mínimo (${generalPct.toFixed(1)}% < ${pc.minGeneralScorePercent}%).`;
    } else if (pc.minSpecificScorePercent && specificPct < pc.minSpecificScorePercent) {
      passed = false;
      failureReason = `Reprovado por aproveitamento em Conhecimentos Específicos abaixo do mínimo (${specificPct.toFixed(1)}% < ${pc.minSpecificScorePercent}%).`;
    } else if (!pc.allowZeroInAnySubject) {
      for (const subId in subjectPerformance) {
        if (subjectPerformance[subId].correct === 0 && subjectPerformance[subId].total > 0) {
          passed = false;
          failureReason = `Reprovado por zerar a matéria ${subId}.`;
          break;
        }
      }
    }

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
      failureReason,
      timeSpentSeconds,
    };

    const completedAttempt: ExamAttempt = {
      ...currentAttempt,
      endTime,
      timeSpentSeconds,
      isCompleted: true,
      scoreData: result,
    };

    saveAttempt(completedAttempt);

    set((state) => ({
      currentAttempt: completedAttempt,
      history: [completedAttempt, ...state.history.filter((a) => a.id !== completedAttempt.id)],
      view: 'result',
    }));
  },

  loadHistory: async () => {
    const history = await getAttempts();
    set({ history });
  },

  resumeAttempt: () => {
    const { config } = get();
    if (!config) return;
  },

  updateSettings: (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }));
  },
}));
