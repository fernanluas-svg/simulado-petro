export interface Alternative {
  id: string; // 'A' | 'B' | 'C' | 'D' | 'E'
  text: string;
}

/**
 * Origem da questão:
 * - `classic`: banco original (200 questões);
 * - `new`: módulo extra de 60 questões.
 */
export type QuestionPool = 'classic' | 'new';

/** Pool usado para montar um simulado. `mixed` embaralha as duas origens. */
export type QuestionPoolSelection = QuestionPool | 'mixed';

export interface Question {
  id: string;
  subjectId: string; // 'portugues' | 'matematica' | 'conhecimentos_especificos'
  topic: string;
  statement: string;
  /** Texto-base exibido antes do enunciado (ex.: interpretação de texto). */
  supportText?: string;
  alternatives: Alternative[];
  correctAnswer: string; // 'A' | 'B' | 'C' | 'D' | 'E'
  /**
   * Respostas aceitas quando a questão admite mais de uma alternativa correta.
   * Quando ausente, apenas `correctAnswer` é aceita. O embaralhamento das
   * alternativas reatribui os rótulos e atualiza esta lista junto.
   */
  acceptedAnswers?: string[];
  explanation: string;
  source: string;
  reference: string;
  verified: boolean; // true = official verified, false = authorial/exemplary
  difficulty: 'fácil' | 'médio' | 'difícil';
  weight?: number; // peso individual opcional; se ausente, usa o peso da matéria
  /** Origem da questão. Ausente é tratado como `classic`. */
  pool?: QuestionPool;
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
    minSubjectScorePercent?: number;
    allowZeroInAnySubject: boolean;
  };
}

export type ExamStatus = 'APROVADO' | 'REPROVADO';

export interface SubjectBreakdown {
  correct: number;
  total: number;
  percentage: number;
  weight: number;
  scoreTotal: number;
  maxScore: number;
  eliminated: boolean;
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

  // Resultado no formato novo (schema 2), gravado também no topo do registro
  // para facilitar a leitura por versões antigas e pela tela de histórico.
  schemaVersion?: number;
  scoreTotal?: number;
  maxScore?: number;
  percentage?: number;
  status?: ExamStatus;
  subjectBreakdown?: Record<string, SubjectBreakdown>;

  // Sessão persistida (campos opcionais para compatibilidade com tentativas antigas)
  questionIds?: string[]; // ordem exata das questões sorteadas
  /** Pool escolhido ao iniciar o simulado (clássicas, novas ou misturadas). */
  questionPool?: QuestionPoolSelection;
  /**
   * Ordem original das alternativas de cada questão, por ID da questão.
   * Permite restaurar a mesma apresentação (rótulos A-E e gabarito) depois de
   * recarregar a página ou ao abrir o resultado/revisão.
   */
  alternativeOrder?: Record<string, string[]>;
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

  // Campos da nova regra de pontuação (schema 2)
  scoreTotal?: number;
  maxScore?: number;
  subjectBreakdown?: Record<string, SubjectBreakdown>;
  eliminatedSubjects?: string[];
  status?: ExamStatus;
}

export type ThemeName = 'atual' | 'branco' | 'preto';

export interface UserSettings {
  theme: ThemeName;
  defaultImmediateCorrection: boolean;
  defaultDurationMinutes: number;
  soundEnabled: boolean;
}
