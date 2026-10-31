import React, { useEffect, useState } from 'react';
import { useExamStore } from '../store/useExamStore';
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  Flag,
  Loader2,
  Pause,
  Play,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react';
import { formatSeconds, getRemainingSeconds } from '../services/timer';
import { getPaletteStatus } from '../services/palette';
import { SupportText } from '../components/SupportText';

export const ExamScreen: React.FC = () => {
  const {
    config,
    questions,
    currentAttempt,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    setAnswer,
    toggleMarkReview,
    setImmediateCorrection,
    pauseExam,
    resumeExam,
    finishExam,
    discardAttempt,
    setView,
    isPausingExam,
  } = useExamStore();

  const [timeLeft, setTimeLeft] = useState<number>(() =>
    getRemainingSeconds(currentAttempt, config?.durationMinutes),
  );
  const [showConfirmSubmit, setShowConfirmSubmit] = useState<boolean>(false);

  const attemptId = currentAttempt?.id;
  const isPaused = currentAttempt?.isPaused ?? false;
  const isCompleted = currentAttempt?.isCompleted ?? false;
  const durationMinutes = currentAttempt?.durationMinutes ?? config?.durationMinutes;

  useEffect(() => {
    if (!attemptId || isPaused || isCompleted) return;

    const updateClock = () => {
      const state = useExamStore.getState();
      return getRemainingSeconds(state.currentAttempt, state.config?.durationMinutes);
    };

    // O estado inicial do cronômetro já é calculado no useState; aqui só
    // sincronizamos os ticks do relógio e cobrimos o caso de prazo vencido.
    if (updateClock() <= 0) {
      useExamStore.getState().finishExam();
      return;
    }

    const timer = window.setInterval(() => {
      const currentRemaining = updateClock();
      setTimeLeft(currentRemaining);

      if (currentRemaining <= 0) {
        window.clearInterval(timer);
        useExamStore.getState().finishExam();
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [attemptId, isPaused, isCompleted, durationMinutes]);

  if (!currentAttempt || currentAttempt.isCompleted || questions.length === 0) {
    const hasResult = Boolean(currentAttempt?.isCompleted && currentAttempt.scoreData);
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-ink-soft">
          {hasResult
            ? 'Este simulado já foi finalizado.'
            : 'Nenhum simulado em andamento ou questões não puderam ser restauradas.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setView(hasResult ? 'result' : 'home')}
            className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 px-5 py-2.5 rounded-xl font-medium"
          >
            {hasResult ? 'Ver Resultado' : 'Voltar ao Início'}
          </button>
          {!hasResult && currentAttempt && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Descartar este simulado que não pôde ser restaurado?')) {
                  void discardAttempt(currentAttempt.id);
                }
              }}
              className="flex items-center gap-2 bg-rose-600/20 hover:bg-rose-600/30 text-danger border border-rose-500/30 px-5 py-2.5 rounded-xl font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Descartar
            </button>
          )}
        </div>
      </div>
    );
  }

  const safeIndex = Math.min(currentQuestionIndex, questions.length - 1);
  const currentQ = questions[safeIndex];
  const answeredCount = questions.reduce(
    (total, question) => total + (currentAttempt.answers[question.id] ? 1 : 0),
    0,
  );
  const totalQCount = questions.length;
  const selectedAlt = currentAttempt.answers[currentQ.id];
  const isMarked = currentAttempt.markedForReview[currentQ.id] || false;

  const handlePause = async () => {
    await pauseExam();
    const state = useExamStore.getState();
    setTimeLeft(
      getRemainingSeconds(state.currentAttempt, state.config?.durationMinutes),
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-28 lg:pb-6 space-y-6 text-left relative">
      {/* Top Header Bar */}
      <div className="bg-surface/80 border border-line/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/20 text-accent text-xs font-bold">
            Questão {safeIndex + 1} de {totalQCount}
          </div>
          <div className="text-xs text-ink-soft">
            Respondidas: <strong className="text-success">{answeredCount}</strong> /{' '}
            {totalQCount}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {/* Pause Button */}
          <button
            type="button"
            onClick={() => void handlePause()}
            disabled={isPausingExam}
            aria-busy={isPausingExam}
            className="hidden lg:flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-warning border border-amber-500/40 text-xs font-bold transition-all disabled:opacity-60 disabled:cursor-wait"
          >
            {isPausingExam ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Pause className="w-3.5 h-3.5" />
            )}
            <span>{isPausingExam ? 'Salvando pausa...' : 'Pausar Simulado'}</span>
          </button>

          {/* Immediate correction toggle */}
          <div className="flex items-center gap-2 bg-base/60 px-3 py-1.5 rounded-xl border border-line/40">
            <span className="text-xs text-ink-soft font-medium">Correção:</span>
            <button
              type="button"
              onClick={() => setImmediateCorrection(!currentAttempt.immediateCorrection)}
              aria-pressed={currentAttempt.immediateCorrection}
              className={`min-h-11 px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                currentAttempt.immediateCorrection
                  ? 'bg-emerald-500/20 text-success border border-emerald-500/40'
                  : 'bg-surface text-ink-muted hover:text-ink'
              }`}
            >
              {currentAttempt.immediateCorrection ? (
                <Eye className="w-3.5 h-3.5" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" />
              )}
              <span>{currentAttempt.immediateCorrection ? 'Ativada' : 'Desativada'}</span>
            </button>
          </div>

          {/* Timer */}
          <div
            role="timer"
            aria-label={`Tempo restante: ${formatSeconds(timeLeft)}`}
            className="flex items-center gap-2 bg-base/80 px-4 py-2 rounded-xl border border-cyan-500/30 text-accent font-mono font-bold text-sm shadow-inner"
          >
            <Clock className="w-4 h-4" />
            <span>{formatSeconds(timeLeft)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Question Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-surface/60 border border-line/50 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cyan-500/10 text-accent border border-cyan-500/20 uppercase">
                {currentQ.subjectId === 'portugues'
                  ? 'Língua Portuguesa'
                  : currentQ.subjectId === 'matematica'
                    ? 'Matemática'
                    : 'Conhecimentos Específicos'}{' '}
                • {currentQ.topic}
              </span>
              <button
                type="button"
                onClick={() => toggleMarkReview(currentQ.id)}
                aria-pressed={isMarked}
                className={`flex items-center gap-1.5 min-h-11 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isMarked
                    ? 'bg-amber-500/20 text-warning border border-amber-500/40'
                    : 'bg-base/60 text-ink-muted hover:text-ink border border-line/40'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{isMarked ? 'Marcado para Revisão' : 'Marcar para Revisão'}</span>
              </button>
            </div>

            <SupportText text={currentQ.supportText} />

            <div className="text-ink text-base sm:text-lg leading-relaxed whitespace-pre-line font-medium">
              {currentQ.statement}
            </div>

            {/* Alternatives */}
            <div className="space-y-3 pt-2">
              {currentQ.alternatives.map((alt) => {
                const isSelected = selectedAlt === alt.id;
                let altStyle =
                  'border-line/50 bg-base/60 hover:bg-surface text-ink-soft';

                if (isSelected) {
                  altStyle =
                    'border-cyan-500 bg-cyan-500/10 text-ink shadow-md shadow-cyan-500/10';
                }

                if (currentAttempt.immediateCorrection && selectedAlt) {
                  if (alt.id === currentQ.correctAnswer) {
                    altStyle =
                      'border-emerald-500 bg-emerald-500/20 text-success font-semibold';
                  } else if (isSelected && alt.id !== currentQ.correctAnswer) {
                    altStyle = 'border-rose-500 bg-rose-500/20 text-danger';
                  }
                }

                return (
                  <button
                    type="button"
                    key={alt.id}
                    onClick={() => setAnswer(currentQ.id, alt.id)}
                    aria-pressed={isSelected}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 group ${altStyle}`}
                  >
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-surface text-ink-soft group-hover:bg-surface-hover'
                      }`}
                    >
                      {alt.id}
                    </span>
                    <span className="text-sm sm:text-base leading-relaxed pt-1">
                      {alt.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Immediate explanation reveal */}
            {currentAttempt.immediateCorrection && selectedAlt && (
              <div className="mt-4 p-4 rounded-xl bg-base/90 border border-line/60 space-y-2">
                <div className="flex items-center gap-2">
                  {selectedAlt === currentQ.correctAnswer ? (
                    <span className="text-success font-bold flex items-center gap-1 text-sm">
                      <CheckCircle className="w-4 h-4" /> Resposta Correta!
                    </span>
                  ) : (
                    <span className="text-danger font-bold flex items-center gap-1 text-sm">
                      <XCircle className="w-4 h-4" /> Resposta Incorreta. O gabarito é (
                      {currentQ.correctAnswer}).
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                  <strong>Explicação:</strong> {currentQ.explanation}
                </p>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-line/40">
              <button
                type="button"
                onClick={() => setCurrentQuestionIndex(Math.max(0, safeIndex - 1))}
                disabled={safeIndex === 0}
                className="flex items-center gap-1.5 min-h-11 px-4 py-2.5 rounded-xl bg-base border border-line text-ink-soft hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setCurrentQuestionIndex(Math.min(totalQCount - 1, safeIndex + 1))
                }
                disabled={safeIndex === totalQCount - 1}
                className="flex items-center gap-1.5 min-h-11 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Próxima</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Question Palette / Navigation Drawer */}
        <div className="space-y-4">
          <div className="bg-surface/60 border border-line/50 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
              Grade de Questões
            </h3>

            <div className="grid grid-cols-5 gap-2 max-h-[340px] overflow-y-auto p-1">
              {questions.map((question, index) => {
                const answer = currentAttempt.answers[question.id];
                const status = getPaletteStatus(
                  answer,
                  question.correctAnswer,
                  currentAttempt.immediateCorrection,
                );
                const isMarkedReview = !!currentAttempt.markedForReview[question.id];
                const isCurrent = index === safeIndex;

                let btnBg =
                  'bg-base/80 border-line/50 text-ink-soft hover:bg-surface';
                if (status === 'correct') {
                  btnBg = 'bg-success/15 border-success/60 text-success';
                } else if (status === 'incorrect') {
                  btnBg = 'bg-danger/15 border-danger/60 text-danger';
                } else if (status === 'answered') {
                  btnBg = 'bg-cyan-600/20 border-cyan-500/50 text-accent';
                }
                if (isCurrent) {
                  btnBg += ' ring-2 ring-cyan-400 font-bold';
                }
                if (isMarkedReview && status !== 'correct' && status !== 'incorrect') {
                  btnBg += ' border-warning text-warning';
                }

                const statusLabel =
                  status === 'correct'
                    ? ', respondida corretamente'
                    : status === 'incorrect'
                      ? ', respondida incorretamente'
                      : status === 'answered'
                        ? ', respondida'
                        : ', em branco';

                return (
                  <button
                    type="button"
                    key={question.id}
                    onClick={() => setCurrentQuestionIndex(index)}
                    title={`Questão ${index + 1}${statusLabel}${
                      isMarkedReview ? ', marcada para revisão' : ''
                    }`}
                    aria-label={`Ir para a questão ${index + 1}${statusLabel}${
                      isMarkedReview ? ', marcada para revisão' : ''
                    }`}
                    aria-current={isCurrent ? 'true' : undefined}
                    className={`h-11 sm:h-10 rounded-xl border text-xs font-bold transition-all relative flex items-center justify-center ${btnBg}`}
                  >
                    <span>{index + 1}</span>
                    {isMarkedReview && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-base" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-ink-muted">
              {currentAttempt.immediateCorrection ? (
                <>
                  <span className="flex items-center gap-1">
                    <span
                      aria-hidden="true"
                      className="w-3 h-3 rounded border border-success/60 bg-success/15"
                    />
                    Correta
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      aria-hidden="true"
                      className="w-3 h-3 rounded border border-danger/60 bg-danger/15"
                    />
                    Incorreta
                  </span>
                </>
              ) : (
                <span className="flex items-center gap-1">
                  <span
                    aria-hidden="true"
                    className="w-3 h-3 rounded border border-cyan-500/50 bg-cyan-600/20"
                  />
                  Respondida
                </span>
              )}
              <span className="flex items-center gap-1">
                <span
                  aria-hidden="true"
                  className="w-3 h-3 rounded border border-amber-500 bg-amber-400"
                />
                Revisão
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowConfirmSubmit(true)}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Finalizar Simulado</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra de ações fixa no mobile */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-line/60 bg-base/95 backdrop-blur-md px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="shrink-0 text-left">
            <div className="flex items-center gap-1.5 text-accent font-mono font-bold text-sm">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatSeconds(timeLeft)}</span>
            </div>
            <p className="text-[11px] text-ink-muted">
              {answeredCount}/{totalQCount} respondidas
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handlePause()}
            disabled={isPausingExam}
            aria-busy={isPausingExam}
            className="flex-1 min-h-11 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500/20 text-warning border border-amber-500/40 text-xs font-bold active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-wait"
          >
            {isPausingExam ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
            <span>{isPausingExam ? 'Salvando...' : 'Pausar'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowConfirmSubmit(true)}
            className="flex-1 min-h-11 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-slate-950 text-xs font-bold active:scale-[0.98] transition-transform"
          >
            <Send className="w-4 h-4" />
            <span>Finalizar</span>
          </button>
        </div>
      </div>

      {/* Pause Modal Overlay */}
      {isPaused && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-title"
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div className="bg-surface border border-line rounded-2xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl text-center">
            <div className="w-16 h-16 bg-amber-500/20 rounded-2xl border border-amber-500/40 text-warning flex items-center justify-center mx-auto">
              <Pause className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 id="pause-title" className="text-2xl font-bold text-ink">
                Simulado Pausado
              </h3>
              <p className="text-sm text-ink-soft">
                Seu progresso, respostas e cronômetro foram congelados. O tempo restante é{' '}
                <strong className="text-warning">{formatSeconds(timeLeft)}</strong>.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                onClick={resumeExam}
                className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold py-3.5 rounded-xl shadow-lg transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Continuar Simulado</span>
              </button>
              <button
                type="button"
                onClick={() => setView('home')}
                className="bg-base hover:bg-surface-hover text-ink-soft font-medium py-3 rounded-xl border border-line transition-all text-sm"
              >
                Ir para a Página Inicial
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      'Descartar este simulado? As respostas e o progresso serão perdidos.',
                    )
                  ) {
                    void discardAttempt(currentAttempt.id);
                  }
                }}
                className="flex items-center justify-center gap-2 text-danger hover:text-danger text-xs font-medium py-2 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Descartar simulado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmSubmit && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-title"
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div className="bg-surface border border-line rounded-2xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl text-center">
            <div className="w-14 h-14 bg-amber-500/20 rounded-2xl border border-amber-500/40 text-warning flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 id="submit-title" className="text-xl font-bold text-ink">
                Deseja finalizar o simulado?
              </h3>
              <p className="text-sm text-ink-soft">
                Você respondeu <strong className="text-accent">{answeredCount}</strong> de{' '}
                <strong className="text-ink">{totalQCount}</strong> questões.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 bg-base hover:bg-surface-hover text-ink-soft font-medium py-3 rounded-xl border border-line transition-all"
              >
                Continuar Prova
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmSubmit(false);
                  finishExam();
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-3 rounded-xl shadow-lg transition-all"
              >
                Sim, Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
