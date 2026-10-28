import React from 'react';
import { useExamStore } from '../store/useExamStore';
import {
  Play,
  Award,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  FastForward,
  Pause,
  Trash2,
} from 'lucide-react';

export const Home: React.FC = () => {
  const {
    config,
    history,
    setView,
    startExam,
    settings,
    allQuestionsBank,
    currentAttempt,
    questions,
    discardAttempt,
    resumeAttempt,
    startError,
    clearStartError,
  } = useExamStore();

  const completedAttempts = history.filter(
    (attempt) => attempt.isCompleted && attempt.scoreData,
  );
  const bestScore =
    completedAttempts.length > 0
      ? Math.max(...completedAttempts.map((attempt) => attempt.scoreData!.percentage))
      : 0;
  const lastResult = completedAttempts[0];

  const hasActiveExam = Boolean(currentAttempt && !currentAttempt.isCompleted);
  const canResume = hasActiveExam && questions.length > 0;

  const handleStartQuickExam = async () => {
    if (hasActiveExam && currentAttempt) {
      const confirmed = window.confirm(
        'Existe um simulado em andamento. Deseja descartá-lo e iniciar um novo?',
      );
      if (!confirmed) return;
      await discardAttempt(currentAttempt.id);
    }

    startExam({
      immediateCorrection: settings.defaultImmediateCorrection,
      durationMinutes: settings.defaultDurationMinutes,
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 text-left">
      {startError && (
        <div
          role="alert"
          className="bg-rose-500/10 border border-rose-500/30 text-rose-200 rounded-xl p-4 flex items-start justify-between gap-4 text-sm"
        >
          <span className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            {startError}
          </span>
          <button
            type="button"
            onClick={clearStartError}
            className="text-rose-300 hover:text-white font-bold"
            aria-label="Fechar aviso"
          >
            ×
          </button>
        </div>
      )}

      {/* Active Exam Resume Banner */}
      {hasActiveExam && currentAttempt && (
        <div className="bg-gradient-to-r from-amber-950/70 via-[#1c2541] to-[#0b132b] border border-amber-500/50 rounded-2xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-amber-500/20 p-3.5 rounded-2xl border border-amber-500/40 text-amber-400">
              <Pause className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">
                Simulado em Andamento
                {currentAttempt.isPaused ? ' (Pausado)' : ''}
              </h3>
              <p className="text-sm text-amber-200/80">
                {canResume
                  ? 'Seu progresso está salvo. Retome de onde parou quando quiser.'
                  : 'Não foi possível restaurar as questões desta tentativa antiga. Descarte-a para liberar um novo simulado.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canResume && (
              <button
                type="button"
                onClick={() => setView('exam')}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3.5 rounded-xl shadow-lg transition-all whitespace-nowrap"
              >
                <FastForward className="w-5 h-5 fill-current" />
                <span>Retomar Simulado</span>
              </button>
            )}
            <button
              type="button"
              onClick={async () => {
                if (
                  window.confirm(
                    'Descartar este simulado? As respostas e o progresso serão perdidos.',
                  )
                ) {
                  await discardAttempt(currentAttempt.id);
                }
              }}
              className="flex items-center gap-2 bg-[#0b132b]/70 hover:bg-rose-500/20 text-rose-200 border border-rose-500/30 font-medium px-4 py-3.5 rounded-xl transition-all whitespace-nowrap text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>Descartar</span>
            </button>
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-[#1c2541] to-[#0b132b] border border-[#3a506b]/50 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            {config?.noticeNumber || 'Edital nº 03 / 2026.3'}
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {config?.title || 'Simulado Oficial Transpetro 2026'}
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            {config?.cargo ||
              'Profissional Transpetro de Nível Médio Júnior - Administração e Controle'}{' '}
            (Banca: {config?.organizer || 'Fundação Cesgranrio'}). Prepare-se com questões
            rigorosamente selecionadas, simulando exaustivamente o padrão oficial da prova.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 items-center">
            <button
              type="button"
              onClick={() => void handleStartQuickExam()}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>
                Iniciar Novo Simulado ({config?.totalQuestions ?? 60} Questões)
              </span>
            </button>
            <button
              type="button"
              onClick={() => setView('setup')}
              className="flex items-center gap-2 bg-[#1c2541] hover:bg-[#3a506b] text-slate-200 border border-[#3a506b] font-medium px-5 py-3.5 rounded-xl transition-all"
            >
              <Clock className="w-5 h-5 text-cyan-400" />
              <span>Configurar Simulado</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1c2541]/60 border border-[#3a506b]/40 rounded-xl p-5 flex items-center gap-4">
          <div className="bg-cyan-500/10 p-3 rounded-xl text-cyan-400">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Melhor Nota</p>
            <p className="text-2xl font-bold text-white">{bestScore.toFixed(1)}%</p>
          </div>
        </div>

        <div className="bg-[#1c2541]/60 border border-[#3a506b]/40 rounded-xl p-5 flex items-center gap-4">
          <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Simulados Realizados</p>
            <p className="text-2xl font-bold text-white">{completedAttempts.length}</p>
          </div>
        </div>

        <div className="bg-[#1c2541]/60 border border-[#3a506b]/40 rounded-xl p-5 flex items-center gap-4">
          <div className="bg-purple-500/10 p-3 rounded-xl text-purple-400">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Banco de Questões</p>
            <p className="text-2xl font-bold text-white">
              {allQuestionsBank.length} Disponíveis
            </p>
          </div>
        </div>
      </div>

      {/* Last Result Preview if available */}
      {lastResult && lastResult.scoreData && (
        <div className="bg-[#1c2541]/40 border border-[#3a506b]/40 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-cyan-400" />
              <span>Último Resultado Obtido</span>
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                lastResult.scoreData.passed
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {lastResult.scoreData.passed ? 'Aprovado' : 'Reprovado'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="bg-[#0b132b]/60 p-3.5 rounded-xl border border-[#3a506b]/30">
              <p className="text-xs text-slate-400">Nota Geral</p>
              <p className="text-xl font-bold text-white">
                {lastResult.scoreData.percentage.toFixed(1)}%
              </p>
            </div>
            <div className="bg-[#0b132b]/60 p-3.5 rounded-xl border border-[#3a506b]/30">
              <p className="text-xs text-slate-400">Acertos</p>
              <p className="text-xl font-bold text-emerald-400">
                {lastResult.scoreData.correctCount} / {lastResult.scoreData.totalQuestions}
              </p>
            </div>
            <div className="bg-[#0b132b]/60 p-3.5 rounded-xl border border-[#3a506b]/30">
              <p className="text-xs text-slate-400">Específicos</p>
              <p className="text-xl font-bold text-cyan-400">
                {lastResult.scoreData.specificCorrect} / {lastResult.scoreData.specificTotal}
              </p>
            </div>
            <div className="bg-[#0b132b]/60 p-3.5 rounded-xl border border-[#3a506b]/30">
              <p className="text-xs text-slate-400">Tempo Utilizado</p>
              <p className="text-xl font-bold text-slate-200">
                {Math.floor(lastResult.scoreData.timeSpentSeconds / 60)} min
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => resumeAttempt(lastResult)}
              className="text-sm font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>Ver detalhes e gabarito comentado &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* Edital Rules Summary */}
      <div className="bg-[#1c2541]/30 border border-[#3a506b]/30 rounded-2xl p-6 space-y-3">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span>Critérios do Edital Transpetro 2026</span>
        </h3>
        <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside">
          <li>
            Simulado completo com exatamente 60 questões objetivas (10 Português, 12
            Matemática, 38 Específicos).
          </li>
          <li>Cinco alternativas por questão (A a E) com uma única resposta correta.</li>
          <li>
            Modo Pausa: o cronômetro é congelado e retomado exatamente de onde parou.
          </li>
          <li>
            Critérios de eliminação: aproveitamento mínimo em Conhecimentos Gerais e
            Específicos, sem zerar disciplinas.
          </li>
        </ul>
      </div>
    </div>
  );
};
