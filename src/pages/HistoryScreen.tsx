import React, { useEffect } from 'react';
import { getSubjectName, useExamStore } from '../store/useExamStore';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  History as HistoryIcon,
  Play,
  RefreshCw,
  ShieldAlert,
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
    recalculateHistory,
    setView,
    resumeAttempt,
    discardAttempt,
    startError,
    clearStartError,
    regradeSummary,
  } = useExamStore();

  useEffect(() => {
    void recalculateHistory();
  }, [recalculateHistory]);

  const activeHistory = history.filter((item) => !item.isCompleted);
  const completedHistory = history.filter((item) => item.isCompleted && item.scoreData);
  const availableQuestionIds = new Set(allQuestionsBank.map((question) => question.id));
  const regradeById = new Map(
    (regradeSummary?.changes ?? []).map((change) => [change.attemptId, change]),
  );

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
          className="flex items-center gap-1.5 min-h-11 py-1 text-ink-muted hover:text-ink text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </button>
        <h2 className="text-xl font-bold text-ink">Histórico de Simulados</h2>
      </div>

      {startError && (
        <div
          role="alert"
          className="bg-rose-500/10 border border-rose-500/30 text-danger rounded-xl p-4 flex items-start justify-between gap-4 text-sm"
        >
          <span className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            {startError}
          </span>
          <button
            type="button"
            onClick={clearStartError}
            className="text-danger hover:text-ink font-bold"
            aria-label="Fechar aviso"
          >
            ×
          </button>
        </div>
      )}

      {regradeSummary && (
        <div
          role="status"
          className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 space-y-2 text-sm"
        >
          <p className="flex items-start gap-2 text-accent font-semibold">
            <RefreshCw className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              {regradeSummary.migratedCount > 0
                ? `${regradeSummary.migratedCount} ${
                    regradeSummary.migratedCount === 1
                      ? 'simulado do histórico foi migrado'
                      : 'simulados do histórico foram migrados'
                  } para a regra ponderada da Cesgranrio`
                : `${regradeSummary.count} ${
                    regradeSummary.count === 1
                      ? 'simulado foi recalculado'
                      : 'simulados foram recalculados'
                  } com o gabarito corrigido`}
              {regradeSummary.count !== regradeSummary.migratedCount &&
                regradeSummary.migratedCount > 0 && (
                  <>
                    {' '}
                    e {regradeSummary.count - regradeSummary.migratedCount}{' '}
                    {regradeSummary.count - regradeSummary.migratedCount === 1
                      ? 'recalculado'
                      : 'recalculados'}{' '}
                    com o gabarito atual
                  </>
                )}
              .
            </span>
          </p>
          <ul className="space-y-1 pl-6 text-ink-soft">
            {regradeSummary.changes.map((change) => {
              const attempt = history.find((item) => item.id === change.attemptId);
              return (
                <li key={change.attemptId} className="flex flex-wrap items-center gap-1.5">
                  <span className="text-ink-muted">
                    {attempt ? formatDate(attempt.startTime) : change.attemptId}:
                  </span>
                  {change.previousPercentage !== undefined && (
                    <>
                      <span>{change.previousPercentage.toFixed(1)}%</span>
                      <span aria-hidden="true">→</span>
                    </>
                  )}
                  <strong className="text-accent">
                    {change.newPercentage.toFixed(1)}%
                  </strong>
                  {change.previousPassed !== undefined &&
                    change.previousPassed !== change.newPassed && (
                      <span
                        className={
                          change.newPassed
                            ? 'text-success font-medium'
                            : 'text-danger font-medium'
                        }
                      >
                        ({change.newPassed ? 'passou a aprovado' : 'passou a reprovado'})
                      </span>
                    )}
                  {change.migrated && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-accent border border-cyan-500/30">
                      migrado
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {activeHistory.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-warning uppercase tracking-wider">
            Em andamento
          </h3>
          {activeHistory.map((item) => {
            const canResume = canRestore(item);
            const remaining = getRemainingSeconds(item, config?.durationMinutes);
            return (
              <div
                key={item.id}
                className="bg-warning/10 border border-amber-500/40 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-500/20 text-warning border border-amber-500/30">
                      {item.isPaused ? 'Pausado' : 'Em andamento'}
                    </span>
                    <span className="text-xs text-ink-muted flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {formatDate(item.startTime)}
                    </span>
                  </div>
                  <p className="text-sm text-ink-soft">
                    {Object.keys(item.answers).length} resposta(s) salva(s) •{' '}
                    {item.isPaused ? 'Tempo congelado em ' : 'Tempo restante: '}
                    <strong className="text-warning">{formatSeconds(remaining)}</strong>
                  </p>
                  {!canResume && (
                    <p className="text-xs text-danger">
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
                    className="min-h-11 flex items-center gap-1.5 bg-base/70 hover:bg-rose-500/20 text-danger border border-rose-500/30 px-4 py-2.5 rounded-xl text-sm transition-all"
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
        <div className="bg-surface/40 border border-line/40 rounded-2xl p-12 text-center space-y-4">
          <HistoryIcon className="w-12 h-12 text-ink-muted mx-auto" />
          <p className="text-ink-soft font-medium">
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
          <h3 className="text-sm font-bold text-ink-soft uppercase tracking-wider">
            Concluídos
          </h3>
          {completedHistory.map((item) => {
            const result = item.scoreData!;
            const regrade = regradeById.get(item.id);
            const status =
              item.status ?? result.status ?? (result.passed ? 'APROVADO' : 'REPROVADO');
            const approved = status === 'APROVADO';
            const eliminated = result.eliminatedSubjects ?? [];
            return (
              <div
                key={item.id}
                className="relative bg-surface/60 border border-line/50 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl"
              >
                <button
                  type="button"
                  onClick={async () => {
                    if (
                      window.confirm(
                        'Apagar este simulado do histórico? Esta ação não pode ser desfeita.',
                      )
                    ) {
                      await discardAttempt(item.id);
                    }
                  }}
                  className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-lg text-ink-muted hover:text-danger hover:bg-rose-500/10 transition-colors"
                  aria-label={`Apagar simulado de ${formatDate(item.startTime)} do histórico`}
                  title="Apagar do histórico"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="space-y-2 pr-10">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 ${
                        approved
                          ? 'bg-emerald-500/20 text-success border border-emerald-500/30'
                          : 'bg-rose-500/20 text-danger border border-rose-500/30'
                      }`}
                    >
                      {approved ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{approved ? 'Aprovado' : 'Reprovado'}</span>
                    </span>
                    <span className="text-xs text-ink-muted flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {formatDate(item.startTime)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm pt-1">
                    <span className="text-ink-soft">
                      Aproveitamento:{' '}
                      <strong className="text-accent text-base">
                        {result.percentage.toFixed(1)}%
                      </strong>
                    </span>
                    {result.scoreTotal !== undefined && result.maxScore !== undefined && (
                      <span className="text-ink-soft">
                        Pontos:{' '}
                        <strong className="text-ink">
                          {result.scoreTotal.toFixed(1)} / {result.maxScore.toFixed(1)}
                        </strong>
                      </span>
                    )}
                    <span className="text-ink-soft">
                      Acertos:{' '}
                      <strong className="text-success">
                        {result.correctCount} / {result.totalQuestions}
                      </strong>
                    </span>
                    <span className="text-ink-soft flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-ink-muted" />{' '}
                      {Math.floor(result.timeSpentSeconds / 60)} min
                    </span>
                  </div>

                  {eliminated.length > 0 && (
                    <p className="text-xs text-danger flex items-start gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>
                        Eliminado por aproveitamento insuficiente em:{' '}
                        {eliminated
                          .map((subjectId) => getSubjectName(config, subjectId))
                          .join(', ')}
                        .
                      </span>
                    </p>
                  )}

                  {regrade && (
                    <p className="text-xs text-accent flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />
                      {regrade.previousPercentage !== undefined ? (
                        <>
                          Nota anterior: {regrade.previousPercentage.toFixed(1)}% →{' '}
                          <strong>{regrade.newPercentage.toFixed(1)}%</strong>
                        </>
                      ) : (
                        <>
                          Migrado para a regra ponderada:{' '}
                          <strong>{regrade.newPercentage.toFixed(1)}%</strong>
                        </>
                      )}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => resumeAttempt(item)}
                  className="min-h-11 bg-base hover:bg-surface-hover text-accent border border-cyan-500/30 font-medium px-5 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap"
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
