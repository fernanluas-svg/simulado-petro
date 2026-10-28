import React, { useEffect } from 'react';
import { useExamStore } from '../store/useExamStore';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  History as HistoryIcon,
  Play,
  Trash2,
  XCircle,
} from 'lucide-react';
import { formatSeconds, getRemainingSeconds } from '../services/timer';

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const HistoryScreen: React.FC = () => {
  const {
    config,
    history,
    allQuestionsBank,
    loadHistory,
    setView,
    resumeAttempt,
    discardAttempt,
    startError,
    clearStartError,
  } = useExamStore();

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const activeHistory = history.filter((item) => !item.isCompleted);
  const completedHistory = history.filter((item) => item.isCompleted && item.scoreData);
  const availableQuestionIds = new Set(allQuestionsBank.map((question) => question.id));

  const canRestore = (item: (typeof history)[number]) =>
    Boolean(
      item.questionIds?.length &&
        item.questionIds.every((questionId) => availableQuestionIds.has(questionId)),
    );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-left">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView('home')}
          className="flex items-center gap-1.5 min-h-11 py-1 text-slate-400 hover:text-white text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </button>
        <h2 className="text-xl font-bold text-white">Histórico de Simulados</h2>
      </div>

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

      {activeHistory.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
            Em andamento
          </h3>
          {activeHistory.map((item) => {
            const canResume = canRestore(item);
            const remaining = getRemainingSeconds(item, config?.durationMinutes);
            return (
              <div
                key={item.id}
                className="bg-amber-950/20 border border-amber-500/40 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {item.isPaused ? 'Pausado' : 'Em andamento'}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {formatDate(item.startTime)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">
                    {Object.keys(item.answers).length} resposta(s) salva(s) •{' '}
                    {item.isPaused ? 'Tempo congelado em ' : 'Tempo restante: '}
                    <strong className="text-amber-300">{formatSeconds(remaining)}</strong>
                  </p>
                  {!canResume && (
                    <p className="text-xs text-rose-300">
                      Tentativa antiga sem questões salvas — descarte para liberar o app.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {canResume && (
                    <button
                      type="button"
                      onClick={() => resumeAttempt(item)}
                      className="min-h-11 flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition-all"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Retomar
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
                        await discardAttempt(item.id);
                      }
                    }}
                    className="min-h-11 flex items-center gap-1.5 bg-[#0b132b]/70 hover:bg-rose-500/20 text-rose-200 border border-rose-500/30 px-4 py-2.5 rounded-xl text-sm transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Descartar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {completedHistory.length === 0 ? (
        <div className="bg-[#1c2541]/40 border border-[#3a506b]/40 rounded-2xl p-12 text-center space-y-4">
          <HistoryIcon className="w-12 h-12 text-slate-500 mx-auto" />
          <p className="text-slate-300 font-medium">
            Nenhum simulado concluído registrado ainda.
          </p>
          <button
            type="button"
            onClick={() => setView('setup')}
            className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all"
          >
            Fazer Primeiro Simulado
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Concluídos
          </h3>
          {completedHistory.map((item) => {
            const result = item.scoreData!;
            return (
              <div
                key={item.id}
                className="bg-[#1c2541]/60 border border-[#3a506b]/50 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 ${
                        result.passed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {result.passed ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{result.passed ? 'Aprovado' : 'Reprovado'}</span>
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {formatDate(item.startTime)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm pt-1">
                    <span className="text-slate-200">
                      Nota:{' '}
                      <strong className="text-cyan-400 text-base">
                        {result.percentage.toFixed(1)}%
                      </strong>
                    </span>
                    <span className="text-slate-200">
                      Acertos:{' '}
                      <strong className="text-emerald-400">
                        {result.correctCount} / {result.totalQuestions}
                      </strong>
                    </span>
                    <span className="text-slate-200 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />{' '}
                      {Math.floor(result.timeSpentSeconds / 60)} min
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => resumeAttempt(item)}
                  className="min-h-11 bg-[#0b132b] hover:bg-[#161d31] text-cyan-400 border border-cyan-500/30 font-medium px-5 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap"
                >
                  Ver Detalhes
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
