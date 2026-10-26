import React, { useState } from 'react';
import { useExamStore } from '../store/useExamStore';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export const ReviewScreen: React.FC = () => {
  const { questions, currentAttempt, setView } = useExamStore();
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'blank'>('all');

  if (!currentAttempt) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-slate-300">Nenhum simulado para revisar.</p>
        <button
          onClick={() => setView('home')}
          className="bg-cyan-600 text-white px-5 py-2.5 rounded-xl font-medium"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  const filteredQuestions = questions.filter((q) => {
    const userAns = currentAttempt.answers[q.id];
    if (filter === 'correct') return userAns === q.correctAnswer;
    if (filter === 'incorrect') return userAns && userAns !== q.correctAnswer;
    if (filter === 'blank') return !userAns;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-left">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setView('result')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Resultado</span>
        </button>
        <h2 className="text-xl font-bold text-white">Revisão de Gabarito & Explicações</h2>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 bg-[#1c2541]/60 p-2 rounded-xl border border-[#3a506b]/40">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            filter === 'all' ? 'bg-cyan-600 text-slate-950' : 'text-slate-300 hover:bg-[#0b132b]'
          }`}
        >
          Todas ({questions.length})
        </button>
        <button
          onClick={() => setFilter('correct')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            filter === 'correct' ? 'bg-emerald-600 text-slate-950' : 'text-slate-300 hover:bg-[#0b132b]'
          }`}
        >
          Acertadas
        </button>
        <button
          onClick={() => setFilter('incorrect')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            filter === 'incorrect' ? 'bg-rose-600 text-slate-950' : 'text-slate-300 hover:bg-[#0b132b]'
          }`}
        >
          Erradas
        </button>
        <button
          onClick={() => setFilter('blank')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            filter === 'blank' ? 'bg-amber-600 text-slate-950' : 'text-slate-300 hover:bg-[#0b132b]'
          }`}
        >
          Em Branco
        </button>
      </div>

      {/* Questions list */}
      <div className="space-y-6">
        {filteredQuestions.map((q) => {
          const userAns = currentAttempt.answers[q.id];
          const isCorrect = userAns === q.correctAnswer;

          return (
            <div key={q.id} className="bg-[#1c2541]/60 border border-[#3a506b]/50 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">
                  Questão {questions.findIndex(item => item.id === q.id) + 1} • {q.subjectId}
                </span>

                <div className="flex items-center gap-2">
                  {!userAns ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Não Respondida
                    </span>
                  ) : isCorrect ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Correta
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Incorreta
                    </span>
                  )}
                </div>
              </div>

              <div className="text-slate-100 text-base leading-relaxed font-medium">
                {q.statement}
              </div>

              <div className="space-y-2 pt-2">
                {q.alternatives.map((alt) => {
                  const isUserSelection = userAns === alt.id;
                  const isTheCorrect = alt.id === q.correctAnswer;

                  let style = 'bg-[#0b132b]/60 border-[#3a506b]/40 text-slate-300';
                  if (isTheCorrect) {
                    style = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-100 font-semibold';
                  } else if (isUserSelection && !isCorrect) {
                    style = 'bg-rose-500/20 border-rose-500/50 text-rose-100';
                  }

                  return (
                    <div key={alt.id} className={`p-3.5 rounded-xl border flex items-start gap-3 ${style}`}>
                      <span className="w-6 h-6 rounded bg-[#1c2541] flex items-center justify-center font-bold text-xs shrink-0">
                        {alt.id}
                      </span>
                      <span className="text-sm leading-relaxed">{alt.text}</span>
                    </div>
                  );
                })}
              </div>

              {/* Explanation Box */}
              <div className="mt-4 p-5 rounded-xl bg-[#0b132b]/90 border border-[#3a506b]/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-cyan-400">
                  <span>Gabarito Oficial: ({q.correctAnswer})</span>
                  <span>{q.source}</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed pt-1">
                  <strong>Explicação Comentada:</strong> {q.explanation}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
