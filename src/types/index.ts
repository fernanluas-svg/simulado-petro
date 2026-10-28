export interface Alternative {
  id: string; // 'A' | 'B' | 'C' | 'D' | 'E'
  text: string;
}

export interface Question {
  id: string;
  subjectId: string; // 'portugues' | 'matematica' | 'conhecimentos_especificos'
  topic: string;
  statement: string;
  alternatives: Alternative[];
  correctAnswer: string; // 'A' | 'B' | 'C' | 'D' | 'E'
  explanation: string;
  source: string;
  reference: string;
  verified: boolean; // true = official verified, false = authorial/exemplary
  difficulty: 'fácil' | 'médio' | 'difícil';
}

export interface SubjectConfig {
  id: string;
  name: string;
  questionCount: number;
  weight: number;
  minCorrect?: number;
}

export interface ExamConfig {
  id: string;
  title: string;
  noticeNumber: string; // Edital nº 03 — TRANSPETRO/PSP/TERRA/NÍVEL MÉDIO — 2026.3
  cargo: string;
  organizer: string;
  totalQuestions: number;
  durationMinutes: number;
  subjects: SubjectConfig[];
  passingCriteria: {
    minGeneralScorePercent?: number;
    minSpecificScorePercent?: number;
    minGeneralCorrect?: number;
    minSpecificCorrect?: number;
    allowZeroInAnySubject: boolean;
  };
}

export interface ExamAttempt {
  id: string;
  configId: string;
  startTime: number;
  endTime?: number;
  timeSpentSeconds: number;
  answers: Record<string, string>; // questionId -> alternativeId ('A'-'E')
  markedForReview: Record<string, boolean>; // questionId -> boolean
  immediateCorrection: boolean;
  isCompleted: boolean;
  isPaused?: boolean;
  scoreData?: ExamResult;

  // Sessão persistida (campos opcionais para compatibilidade com tentativas antigas)
  questionIds?: string[]; // ordem exata das questões sorteadas
  durationMinutes?: number; // tempo limite escolhido
  timeRemainingSeconds?: number; // saldo congelado no início/pausa
  lastResumedAt?: number; // timestamp em que o relógio voltou a correr
  lastQuestionIndex?: number; // última questão aberta
}

export interface ExamResult {
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  blankCount: number;
  generalCorrect: number;
  generalTotal: number;
  specificCorrect: number;
  specificTotal: number;
  subjectPerformance: Record<string, { correct: number; total: number; percentage: number }>;
  percentage: number;
  passed: boolean;
  failureReason?: string;
  timeSpentSeconds: number;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  defaultImmediateCorrection: boolean;
  defaultDurationMinutes: number;
  soundEnabled: boolean;
}
