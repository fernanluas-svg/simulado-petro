import React, { useState, useEffect } from 'react';
import { useExamStore } from '../store/useExamStore';
import { Clock, Flag, CheckCircle, XCircle, ChevronLeft, ChevronRight, AlertTriangle, Send, Eye, EyeOff } from 'lucide-react';

export const ExamScreen: React.FC = () => {
  const {
    questions,
    currentAttempt,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    setAnswer,
    toggleMarkReview,
    setImmediateCorrection,
    finishExam,
    setView,
  } = useExamStore();

  const [timeLeft, setTimeLeft] = useState<number>(240 * 60); // default 4 hours
  const [showConfirmSubmit, setShowConfirmSubmit] = useState<boolean>(false);

  useEffect(() => {
    if (!currentAttempt) return;
    const elapsed = Math.floor((Date.now() - currentAttempt.startTime) / 1000);
    const totalSecs = 240 * 60; // 4 hours reference
    const remaining = Math.max(0, totalSecs - elapsed);
    setTimeLeft(remaining);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentAttempt]);

  if (!currentAttempt || questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-slate-300">Nenhum simulado em andamento.</p>
        <button
          onClick={() => setView('home')}
          className="bg-cyan-600 text-white px-5 py-2.5 rounded-xl font-medium"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];
  const answeredCount = Object.keys(currentAttempt.answers).length;
  const totalQCount = questions.length;

  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs > 0 ? `${hrs}:` : ''}${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const selectedAlt = currentAttempt.answers[currentQ.id];
  const isMarked = currentAttempt.markedForReview[currentQ.id] || false;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 text-left">
      {/* Top Header Bar */}
      <div className="bg-[#1c2541]/80 border border-[#3a506b]/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/20 text-cyan-400 text-xs font-bold">
            Questão {currentQuestionIndex + 1} de {totalQCount}
          </div>
          <div className="text-xs text-slate-300">
            Respondidas: <strong className="text-emerald-400">{answeredCount}</strong> / {totalQCount}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Immediate correction toggle */}
          <div className="flex items-center gap-2 bg-[#0b132b]/60 px-3 py-1.5 rounded-xl border border-[#3a506b]/40">
            <span className="text-xs text-slate-300 font-medium">Correção Imediata:</span>
            <button
              onClick={() => setImmediateCorrection(!currentAttempt.immediateCorrection)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                currentAttempt.immediateCorrection
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-[#1c2541] text-slate-400 hover:text-white'
              }`}
            >
              {currentAttempt.immediateCorrection ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{currentAttempt.immediateCorrection ? 'Ativada' : 'Desativada'}</span>
            </button>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2 bg-[#0b132b]/80 px-4 py-2 rounded-xl border border-cyan-500/30 text-cyan-400 font-mono font-bold text-sm shadow-inner">
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Question Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[#1c2541]/60 border border-[#3a506b]/50 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">
                {currentQ.subjectId === 'portugues' ? 'Língua Portuguesa' : currentQ.subjectId === 'matematica' ? 'Matemática' : 'Conhecimentos Específicos'} • {currentQ.topic}
              </span>
              <button
                onClick={() => toggleMarkReview(currentQ.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isMarked
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-[#0b132b]/60 text-slate-400 hover:text-white border border-[#3a506b]/40'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{isMarked ? 'Marcado para Revisão' : 'Marcar para Revisão'}</span>
              </button>
            </div>

            <div className="text-slate-100 text-base sm:text-lg leading-relaxed whitespace-pre-line font-medium">
              {currentQ.statement}
            </div>

            {/* Alternatives */}
            <div className="space-y-3 pt-2">
              {currentQ.alternatives.map((alt) => {
                const isSelected = selectedAlt === alt.id;
                let altStyle = 'border-[#3a506b]/50 bg-[#0b132b]/60 hover:bg-[#1c2541] text-slate-200';

                if (isSelected) {
                  altStyle = 'border-cyan-500 bg-cyan-500/10 text-white shadow-md shadow-cyan-500/10';
                }

                // Immediate correction styling (ONLY if immediateCorrection is true and question is answered)
                if (currentAttempt.immediateCorrection && selectedAlt) {
                  if (alt.id === currentQ.correctAnswer) {
                    altStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-100 font-semibold';
                  } else if (isSelected && alt.id !== currentQ.correctAnswer) {
                    altStyle = 'border-rose-500 bg-rose-500/20 text-rose-100';
                  }
                }

                return (
                  <button
                    key={alt.id}
                    onClick={() => setAnswer(currentQ.id, alt.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 group ${altStyle}`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                      isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-[#1c2541] text-slate-300 group-hover:bg-[#3a506b]'
                    }`}>
                      {alt.id}
                    </span>
                    <span className="text-sm sm:text-base leading-relaxed pt-1">{alt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Immediate explanation reveal if enabled and answered */}
            {currentAttempt.immediateCorrection && selectedAlt && (
              <div className="mt-4 p-4 rounded-xl bg-[#0b132b]/90 border border-[#3a506b]/60 space-y-2">
                <div className="flex items-center gap-2">
                  {selectedAlt === currentQ.correctAnswer ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1 text-sm">
                      <CheckCircle className="w-4 h-4" /> Resposta Correta!
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold flex items-center gap-1 text-sm">
                      <XCircle className="w-4 h-4" /> Resposta Incorreta. O gabarito é ({currentQ.correctAnswer}).
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <strong>Explicação:</strong> {currentQ.explanation}
                </p>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[#3a506b]/40">
              <button
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0b132b] border border-[#3a506b] text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <button
                onClick={() => setCurrentQuestionIndex(Math.min(totalQCount - 1, currentQuestionIndex + 1))}
                disabled={currentQuestionIndex === totalQCount - 1}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Próxima</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Question Palette / Navigation Drawer */}
        <div className="space-y-4">
          <div className="bg-[#1c2541]/60 border border-[#3a506b]/50 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Grade de Questões</h3>

            <div className="grid grid-cols-5 gap-2 max-h-[340px] overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const isAnswered = !!currentAttempt.answers[q.id];
                const isMarkedReview = !!currentAttempt.markedForReview[q.id];
                const isCurrent = idx === currentQuestionIndex;

                let btnBg = 'bg-[#0b132b]/80 border-[#3a506b]/50 text-slate-300 hover:bg-[#1c2541]';
                if (isAnswered) {
                  btnBg = 'bg-cyan-600/20 border-cyan-500/50 text-cyan-300';
                }
                if (isCurrent) {
                  btnBg += ' ring-2 ring-cyan-400 font-bold';
                }
                if (isMarkedReview) {
                  btnBg += ' border-amber-500 text-amber-300';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-10 rounded-xl border text-xs font-bold transition-all relative flex items-center justify-center ${btnBg}`}
                  >
                    <span>{idx + 1}</span>
                    {isMarkedReview && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-[#0b132b]" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#3a506b]/40 space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-cyan-600/30 border border-cyan-500/50" />
                <span>Respondida</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[#0b132b] border border-[#3a506b]" />
                <span>Não respondida</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-400" />
                <span>Marcada para revisão</span>
              </div>
            </div>

            <button
              onClick={() => setShowConfirmSubmit(true)}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Finalizar Simulado</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1c2541] border border-[#3a506b] rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl text-center">
            <div className="w-14 h-14 bg-amber-500/20 rounded-2xl border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Deseja finalizar o simulado?</h3>
              <p className="text-sm text-slate-300">
                Você respondeu <strong className="text-cyan-400">{answeredCount}</strong> de <strong className="text-white">{totalQCount}</strong> questões.
                {totalQCount - answeredCount > 0 && (
                  <span className="block text-amber-400 pt-1">Atenção: Existem {totalQCount - answeredCount} questões em branco!</span>
                )}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 bg-[#0b132b] hover:bg-[#161d31] text-slate-300 font-medium py-3 rounded-xl border border-[#3a506b] transition-all"
              >
                Continuar Prova
              </button>
              <button
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
