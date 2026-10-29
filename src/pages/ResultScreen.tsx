import React from 'react';
import { getSubjectName, useExamStore } from '../store/useExamStore';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import type { ExamConfig, ExamResult, SubjectBreakdown } from '../types';
import { getMinSubjectScorePercent, getSubjectWeight } from '../services/scoring';

function formatSpentTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}min` : `${hours}h`;
}

/**
 * Resultados antigos não têm `subjectBreakdown`; monta uma tabela equivalente
 * a partir de `subjectPerformance` para que a tela continue funcionando.
 */
function resolveBreakdown(
  result: ExamResult,
  config: ExamConfig | null,
): Record<string, SubjectBreakdown> {
  if (result.subjectBreakdown) return result.subjectBreakdown;

  const minPercent = config ? getMinSubjectScorePercent(config) : 50;
  const entries = Object.entries(result.subjectPerformance ?? {}).map(
    ([subjectId, performance]) => {
      const weight = getSubjectWeight(subjectId, config);
      const breakdown: SubjectBreakdown = {
        correct: performance.correct,
        total: performance.total,
        percentage: performance.percentage,
        weight,
        scoreTotal: Math.round(performance.correct * weight * 100) / 100,
        maxScore: Math.round(performance.total * weight * 100) / 100,
        eliminated:
          performance.total > 0 && performance.percentage < minPercent,
      };
      return [subjectId, breakdown] as const;
    },
  );

  return Object.fromEntries(entries);
}

export const ResultScreen: React.FC = () => {
  const { currentAttempt, setView, config, questions, regradeSummary } =
    useExamStore();

  if (!currentAttempt || !currentAttempt.scoreData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-ink-soft">Nenhum resultado disponível.</p>
        <button
          type="button"
          onClick={() => setView('home')}
          className="bg-cyan-600 text-slate-950 px-5 py-2.5 rounded-xl font-medium"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  const res = currentAttempt.scoreData;
  const canReview = questions.length > 0;
  const regrade = regradeSummary?.changes.find(
    (change) => change.attemptId === currentAttempt.id,
  );
  const status = res.status ?? (res.passed ? 'APROVADO' : 'REPROVADO');
  const approved = status === 'APROVADO';
  const breakdown = resolveBreakdown(res, config);
  const breakdownEntries = Object.entries(breakdown);
  const minSubjectPercent = config ? getMinSubjectScorePercent(config) : 50;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-left">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView('home')}
          className="flex items-center gap-1.5 min-h-11 py-1 text-ink-muted hover:text-ink text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </button>
        <h2 className="text-xl font-bold text-ink">Resultado do Simulado</h2>
      </div>

      {regrade && (
        <div
          role="status"
          className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 flex items-start gap-2 text-sm"
        >
          <RefreshCw className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
          <div className="space-y-1">
            <p className="font-semibold text-accent">
              {regrade.migrated
                ? 'Simulado migrado para a regra ponderada da Cesgranrio'
                : 'Nota recalculada com o gabarito corrigido'}
            </p>
            <p className="text-ink-soft">
              {regrade.previousPercentage !== undefined && (
                <>Nota anterior: {regrade.previousPercentage.toFixed(1)}% → </>
              )}
              nota atual:{' '}
              <strong className="text-ink">{regrade.newPercentage.toFixed(1)}%</strong>
              {regrade.previousPassed !== undefined &&
                regrade.previousPassed !== regrade.newPassed && (
                  <span className={regrade.newPassed ? 'text-success' : 'text-danger'}>
                    {' '}
                    ({regrade.newPassed ? 'passou a aprovado' : 'passou a reprovado'})
                  </span>
                )}
            </p>
          </div>
        </div>
      )}

      {/* Main Status Banner */}
      <div
        className={`border rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 ${
          approved
            ? 'bg-gradient-to-br from-success/20 to-surface border-emerald-500/40'
            : 'bg-gradient-to-br from-danger/20 to-surface border-rose-500/40'
        }`}
      >
        <div className="space-y-3 text-center sm:text-left">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              approved
                ? 'bg-emerald-500/20 text-success border border-emerald-500/30'
                : 'bg-rose-500/20 text-danger border border-rose-500/30'
            }`}
          >
            {approved ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            <span>{approved ? 'Aprovado no Simulado' : 'Reprovado no Simulado'}</span>
          </div>

          <h3 className="text-3xl sm:text-4xl font-extrabold text-ink">
            {res.percentage.toFixed(1)}%{' '}
            <span className="text-lg font-normal text-ink-soft">
              de aproveitamento
            </span>
          </h3>

          {res.scoreTotal !== undefined && res.maxScore !== undefined && (
            <p className="text-sm text-ink-soft">
              Pontuação ponderada:{' '}
              <strong className="text-ink">
                {res.scoreTotal.toFixed(1)} / {res.maxScore.toFixed(1)} pontos
              </strong>
            </p>
          )}

          {res.failureReason && (
            <p className="text-sm text-danger bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
              {res.failureReason}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 min-w-[220px]">
          <button
            type="button"
            onClick={() => setView('review')}
            disabled={!canReview}
            title={
              canReview
                ? 'Rever questões e explicações'
                : 'As questões deste simulado antigo não estão mais disponíveis.'
            }
            className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <BookOpen className="w-4 h-4" />
            <span>Rever Gabarito & Questões</span>
          </button>
          {!canReview && (
            <p className="text-xs text-ink-muted text-center">
              Revisão indisponível para simulados criados antes da atualização.
            </p>
          )}
          <button
            type="button"
            onClick={() => setView('setup')}
            className="flex items-center justify-center gap-2 bg-surface hover:bg-surface-hover text-ink-soft border border-line font-medium px-6 py-3 rounded-xl transition-all"
          >
            <RotateCcw className="w-4 h-4 text-accent" />
            <span>Novo Simulado</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface/60 border border-line/40 rounded-xl p-5 space-y-1">
          <p className="text-xs text-ink-muted font-medium">Acertos</p>
          <p className="text-2xl font-bold text-success">
            {res.correctCount}{' '}
            <span className="text-sm text-ink-muted">/ {res.totalQuestions}</span>
          </p>
        </div>
        <div className="bg-surface/60 border border-line/40 rounded-xl p-5 space-y-1">
          <p className="text-xs text-ink-muted font-medium">Erros</p>
          <p className="text-2xl font-bold text-danger">{res.incorrectCount}</p>
        </div>
        <div className="bg-surface/60 border border-line/40 rounded-xl p-5 space-y-1">
          <p className="text-xs text-ink-muted font-medium">Em Branco</p>
          <p className="text-2xl font-bold text-warning">{res.blankCount}</p>
        </div>
        <div className="bg-surface/60 border border-line/40 rounded-xl p-5 space-y-1">
          <p className="text-xs text-ink-muted font-medium">Tempo Gasto</p>
          <p className="text-2xl font-bold text-accent">
            {formatSpentTime(res.timeSpentSeconds)}
          </p>
        </div>
      </div>

      {/* Subject Performance Breakdown */}
      <div className="bg-surface/60 border border-line/50 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-bold text-ink">Pontuação por Matéria</h3>
          <span className="text-xs text-ink-muted">
            Eliminação: aproveitamento abaixo de {minSubjectPercent}% em qualquer matéria
          </span>
        </div>

        {breakdownEntries.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Este simulado antigo não possui detalhamento por matéria.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-ink-muted border-b border-line/50">
                  <th className="py-2 pr-3 font-semibold">Matéria</th>
                  <th className="py-2 px-3 font-semibold text-center">Acertos</th>
                  <th className="py-2 px-3 font-semibold">Aproveitamento</th>
                  <th className="py-2 px-3 font-semibold text-center">Peso</th>
                  <th className="py-2 px-3 font-semibold text-center">Pontos</th>
                  <th className="py-2 pl-3 font-semibold text-center">Situação</th>
                </tr>
              </thead>
              <tbody>
                {breakdownEntries.map(([subjectId, data]) => (
                  <tr
                    key={subjectId}
                    className={`border-b border-line/30 last:border-0 ${
                      data.eliminated ? 'bg-rose-500/5' : ''
                    }`}
                  >
                    <td className="py-3 pr-3 text-ink font-medium">
                      {getSubjectName(config, subjectId)}
                    </td>
                    <td className="py-3 px-3 text-center text-ink-soft whitespace-nowrap">
                      {data.correct} / {data.total}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2 min-w-[130px]">
                        <span
                          className={`font-bold whitespace-nowrap ${
                            data.eliminated ? 'text-danger' : 'text-accent'
                          }`}
                        >
                          {data.percentage.toFixed(1)}%
                        </span>
                        <div className="flex-1 bg-surface rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              data.eliminated
                                ? 'bg-rose-500'
                                : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                            }`}
                            style={{ width: `${Math.min(100, data.percentage)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center text-ink-soft whitespace-nowrap">
                      {data.weight}x
                    </td>
                    <td className="py-3 px-3 text-center text-ink whitespace-nowrap">
                      {data.scoreTotal.toFixed(1)} / {data.maxScore.toFixed(1)}
                    </td>
                    <td className="py-3 pl-3 text-center">
                      {data.eliminated ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-danger border border-rose-500/30 whitespace-nowrap">
                          <ShieldAlert className="w-3 h-3" />
                          Eliminado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-success border border-emerald-500/30 whitespace-nowrap">
                          <CheckCircle2 className="w-3 h-3" />
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
