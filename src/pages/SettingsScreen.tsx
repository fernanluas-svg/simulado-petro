import React, { useMemo, useState } from 'react';
import { getSubjectName, useExamStore } from '../store/useExamStore';
import {
  ArrowLeft,
  Check,
  CheckSquare,
  Clock,
  Flag,
  Info,
  Palette,
  Trash2,
  X,
} from 'lucide-react';
import { clearAllData } from '../services/storage';
import { THEME_OPTIONS } from '../services/theme';
import { SupportText } from '../components/SupportText';
import { getAcceptedAnswers } from '../services/answers';
import type { ExamAttempt, Question } from '../types';

const DURATION_OPTIONS = [60, 120, 180, 240, 300];

function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const SettingsScreen: React.FC = () => {
  const {
    settings,
    updateSettings,
    setView,
    config,
    history,
    currentAttempt,
    allQuestionsBank,
    removeQuestionFromReview,
  } = useExamStore();
  const [isClearing, setIsClearing] = useState(false);
  const [showApprovalInfo, setShowApprovalInfo] = useState(false);

  const reviewItems = useMemo(() => {
    const attempts = new Map<string, ExamAttempt>();
    for (const attempt of history) attempts.set(attempt.id, attempt);
    // A tentativa em andamento pode ter marcações mais novas que a cópia
    // guardada em `history`, então ela prevalece.
    if (currentAttempt) attempts.set(currentAttempt.id, currentAttempt);

    const questionsById = new Map(allQuestionsBank.map((question) => [question.id, question]));
    const byQuestion = new Map<string, { question: Question; attempt: ExamAttempt }>();

    for (const attempt of attempts.values()) {
      for (const [questionId, marked] of Object.entries(attempt.markedForReview)) {
        if (!marked) continue;

        const question = questionsById.get(questionId);
        if (!question) continue;

        const existing = byQuestion.get(questionId);
        if (!existing || attempt.startTime > existing.attempt.startTime) {
          byQuestion.set(questionId, { question, attempt });
        }
      }
    }

    return [...byQuestion.values()].sort(
      (a, b) => b.attempt.startTime - a.attempt.startTime,
    );
  }, [history, currentAttempt, allQuestionsBank]);

  const handleResetData = async () => {
    if (
      !window.confirm(
        'Deseja realmente limpar todo o histórico, preferências e dados salvos localmente?',
      )
    ) {
      return;
    }

    setIsClearing(true);
    await clearAllData();
    window.location.reload();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 text-left">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView('home')}
          className="flex items-center gap-1.5 min-h-11 py-1 text-ink-muted hover:text-ink text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </button>
        <h2 className="text-xl font-bold text-ink">Configurações e Preferências</h2>
      </div>

      <div className="bg-surface/60 border border-line/50 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <p className="text-xs text-ink-muted">
          Suas preferências são salvas automaticamente neste dispositivo.
        </p>

        <div className="space-y-4">
          <div className="p-4 bg-base/60 rounded-xl border border-line/30 space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-accent" />
              <span id="theme-label" className="text-sm font-medium text-ink">
                Tema do Aplicativo
              </span>
            </div>
            <div
              role="radiogroup"
              aria-labelledby="theme-label"
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {THEME_OPTIONS.map((option) => {
                const isSelected = settings.theme === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => updateSettings({ theme: option.id })}
                    className={`min-h-11 text-left rounded-xl border p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-line/50 bg-surface hover:bg-surface-hover'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1" aria-hidden="true">
                        <span
                          className="w-5 h-5 rounded-full border"
                          style={{
                            backgroundColor: option.preview.background,
                            borderColor: option.preview.border,
                          }}
                        />
                        <span
                          className="w-5 h-5 rounded-full border"
                          style={{
                            backgroundColor: option.preview.surface,
                            borderColor: option.preview.border,
                          }}
                        />
                        <span
                          className="w-5 h-5 rounded-full"
                          style={{ backgroundColor: option.preview.accent }}
                        />
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-accent shrink-0" />}
                    </span>
                    <span className="mt-2 block text-sm font-semibold text-ink">
                      {option.label}
                    </span>
                    <span className="block text-[11px] text-ink-muted leading-snug">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-ink-muted">
              A mudança é aplicada na hora e fica salva neste dispositivo.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 p-4 bg-base/60 rounded-xl border border-line/30">
            <div className="space-y-0.5">
              <label
                htmlFor="default-immediate-correction"
                className="text-sm font-medium text-ink flex items-center gap-2"
              >
                <CheckSquare className="w-4 h-4 text-accent" />
                <span>Correção Imediata Padrão</span>
              </label>
              <p className="text-xs text-ink-muted">
                Ativar por padrão a revelação do gabarito ao responder cada questão nos
                novos simulados.
              </p>
            </div>
            <input
              id="default-immediate-correction"
              type="checkbox"
              checked={settings.defaultImmediateCorrection}
              onChange={(event) =>
                updateSettings({ defaultImmediateCorrection: event.target.checked })
              }
              className="w-6 h-6 accent-cyan-500 rounded cursor-pointer shrink-0"
            />
          </div>

          <div className="p-4 bg-base/60 rounded-xl border border-line/30 space-y-2">
            <label
              htmlFor="default-duration"
              className="text-sm font-medium text-ink flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-accent" />
              <span>Tempo Padrão de Prova (Minutos)</span>
            </label>
            <select
              id="default-duration"
              value={settings.defaultDurationMinutes}
              onChange={(event) =>
                updateSettings({ defaultDurationMinutes: Number(event.target.value) })
              }
              className="w-full bg-surface border border-line rounded-lg p-3 text-ink text-base sm:text-sm focus:outline-none focus:border-cyan-500"
            >
              {!DURATION_OPTIONS.includes(settings.defaultDurationMinutes) && (
                <option value={settings.defaultDurationMinutes}>
                  {settings.defaultDurationMinutes} minutos
                </option>
              )}
              <option value={60}>60 minutos (1 hora)</option>
              <option value={120}>120 minutos (2 horas)</option>
              <option value={180}>180 minutos (3 horas)</option>
              <option value={240}>240 minutos (4 horas - Padrão Edital)</option>
              <option value={300}>300 minutos (5 horas)</option>
            </select>
          </div>

          <div className="p-4 bg-base/60 rounded-xl border border-line/30 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-ink">
                Critérios de Aprovação
              </span>
            </div>
            <p className="text-xs text-ink-muted">
              Entenda como o resultado do simulado é considerado aprovado ou
              reprovado e qual percentual de acertos é necessário.
            </p>
            <button
              type="button"
              onClick={() => setShowApprovalInfo(true)}
              className="min-h-11 flex items-center gap-2 bg-cyan-600/10 hover:bg-cyan-600/20 text-accent border border-cyan-500/30 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              <Info className="w-4 h-4" />
              <span>Ver explicação</span>
            </button>
          </div>

          <div className="p-4 bg-base/60 rounded-xl border border-line/30 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-ink">
                  Questões para Revisão
                </span>
              </div>
              <span className="text-xs font-bold text-accent bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                {reviewItems.length}
              </span>
            </div>
            <p className="text-xs text-ink-muted">
              Questões marcadas com a bandeira durante os simulados. Você pode
              retirá-las da revisão quando quiser.
            </p>

            {reviewItems.length === 0 ? (
              <p className="text-xs text-ink-muted bg-surface/40 border border-line/30 rounded-lg px-3 py-3">
                Nenhuma questão marcada. Durante o simulado, use o botão “Marcar
                para revisão”.
              </p>
            ) : (
              <ul className="space-y-2">
                {reviewItems.map(({ question, attempt }) => {
                  const acceptedAnswers = getAcceptedAnswers(question);
                  return (
                  <li
                    key={question.id}
                    className="bg-surface/50 border border-line/40 rounded-xl p-3 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-accent">
                        {getSubjectName(config, question.subjectId)} • {question.topic}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeQuestionFromReview(question.id)}
                        className="flex items-center gap-1.5 min-h-9 px-2.5 py-1.5 rounded-lg text-xs font-medium text-danger hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
                        aria-label={`Retirar questão ${question.id} da revisão`}
                        title="Retirar da revisão"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remover</span>
                      </button>
                    </div>

                    <p className="text-sm text-ink leading-relaxed">
                      {question.statement}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
                      <span>
                        {attempt.isCompleted
                          ? 'Simulado concluído'
                          : 'Simulado em andamento'}
                      </span>
                      <span aria-hidden="true">•</span>
                      <span>{formatDateTime(attempt.startTime)}</span>
                    </div>

                    <details className="rounded-lg border border-line/40 bg-base/40">
                      <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-accent">
                        Ver questão completa
                      </summary>
                      <div className="px-3 pb-3 space-y-3">
                        <SupportText text={question.supportText} />
                        <ul className="space-y-1.5 text-sm text-ink-soft">
                          {question.alternatives.map((alternative) => (
                            <li
                              key={alternative.id}
                              className={
                                acceptedAnswers.includes(alternative.id)
                                  ? 'text-success font-medium'
                                  : undefined
                              }
                            >
                              <strong>{alternative.id})</strong> {alternative.text}
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-ink-soft">
                          <strong className="text-ink">Gabarito:</strong>{' '}
                          {acceptedAnswers.join(' ou ')}
                        </p>
                        <p className="text-xs text-ink-soft">
                          <strong className="text-ink">Explicação:</strong>{' '}
                          {question.explanation}
                        </p>
                      </div>
                    </details>
                  </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="pt-4 border-t border-line/40 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-danger">
                Limpar Dados Locais
              </span>
              <p className="text-xs text-ink-muted">
                Apaga todo o histórico de simulados e preferências salvos no navegador.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleResetData()}
              disabled={isClearing}
              className="flex items-center gap-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-danger border border-rose-500/30 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isClearing ? 'Limpando...' : 'Limpar Dados'}</span>
            </button>
          </div>
        </div>
      </div>

      {showApprovalInfo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="approval-title"
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div className="bg-surface border border-line rounded-2xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl text-left">
            <div className="flex items-start justify-between gap-4">
              <h3
                id="approval-title"
                className="text-xl font-bold text-ink flex items-center gap-2"
              >
                <Info className="w-5 h-5 text-accent" />
                Como funciona a aprovação
              </h3>
              <button
                type="button"
                onClick={() => setShowApprovalInfo(false)}
                aria-label="Fechar"
                className="text-ink-muted hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-ink-soft">
              Para ser aprovado, o candidato precisa atender a todos os
              critérios abaixo ao mesmo tempo. Um único critério não cumprido
              resulta em reprovação.
            </p>

            <ul className="space-y-2 text-sm text-ink-soft list-disc list-inside">
              <li>
                <strong className="text-ink">Conhecimentos Gerais</strong>{' '}
                (Português + Matemática): mínimo de{' '}
                {config?.passingCriteria?.minGeneralScorePercent ?? 50}% de
                aproveitamento.
              </li>
              <li>
                <strong className="text-ink">Conhecimentos Específicos</strong>:
                mínimo de{' '}
                {config?.passingCriteria?.minSpecificScorePercent ?? 50}% de
                aproveitamento e pelo menos{' '}
                {config?.subjects.find((s) => s.id === 'conhecimentos_especificos')
                  ?.minCorrect ?? 12}{' '}
                acertos.
              </li>
              <li>
                <strong className="text-ink">Cada matéria</strong>: mínimo de{' '}
                {config?.passingCriteria?.minSubjectScorePercent ?? 50}% de
                aproveitamento.
              </li>
              <li>
                <strong className="text-ink">Não zerar</strong> nenhuma matéria.
              </li>
            </ul>

            <div className="bg-base/60 border border-line/40 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-accent">
                Pontuação ponderada (nota final)
              </p>
              <p className="text-xs text-ink-soft">
                A nota final é calculada com pesos: Português{' '}
                {config?.subjects.find((s) => s.id === 'portugues')?.weight ?? 1}x,
                Matemática{' '}
                {config?.subjects.find((s) => s.id === 'matematica')?.weight ?? 1}x
                e Conhecimentos Específicos{' '}
                {config?.subjects.find((s) => s.id === 'conhecimentos_especificos')
                  ?.weight ?? 2}x. Por isso, acertar questões de
                Conhecimentos Específicos tem impacto maior na nota final.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowApprovalInfo(false)}
                className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
