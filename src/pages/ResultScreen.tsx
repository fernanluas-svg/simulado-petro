import React from 'react';
import { getSubjectName, useExamStore } from '../store/useExamStore';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  RotateCcw,
  XCircle,
} from 'lucide-react';

function formatSpentTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}min` : `${hours}h`;
}

export const ResultScreen: React.FC = () => {
  const { currentAttempt, setView, config, questions } = useExamStore();

  if (!currentAttempt || !currentAttempt.scoreData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-slate-300">Nenhum resultado disponível.</p>
        <button
          type="button"
          onClick={() => setView('home')}
          className="bg-cyan-600 text-white px-5 py-2.5 rounded-xl font-medium"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  const res = currentAttempt.scoreData;
  const canReview = questions.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-left">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView('home')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </button>
        <h2 className="text-xl font-bold text-white">Resultado do Simulado</h2>
      </div>

      {/* Main Status Banner */}
      <div
        className={`border rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 ${
          res.passed
            ? 'bg-gradient-to-br from-emerald-950/60 to-[#1c2541] border-emerald-500/40'
            : 'bg-gradient-to-br from-rose-950/60 to-[#1c2541] border-rose-500/40'
        }`}
      >
        <div className="space-y-3 text-center sm:text-left">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              res.passed
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {res.passed ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            <span>{res.passed ? 'Aprovado no Simulado' : 'Reprovado no Simulado'}</span>
          </div>

          <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
            {res.percentage.toFixed(1)}%{' '}
            <span className="text-lg font-normal text-slate-300">
              de aproveitamento
            </span>
          </h3>

          {res.failureReason && (
            <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
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
            <p className="text-xs text-slate-400 text-center">
              Revisão indisponível para simulados criados antes da atualização.
            </p>
          )}
          <button
            type="button"
            onClick={() => setView('setup')}
            className="flex items-center justify-center gap-2 bg-[#1c2541] hover:bg-[#3a506b] text-slate-200 border border-[#3a506b] font-medium px-6 py-3 rounded-xl transition-all"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>Novo Simulado</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#1c2541]/60 border border-[#3a506b]/40 rounded-xl p-5 space-y-1">
          <p className="text-xs text-slate-400 font-medium">Acertos</p>
          <p className="text-2xl font-bold text-emerald-400">
            {res.correctCount}{' '}
            <span className="text-sm text-slate-400">/ {res.totalQuestions}</span>
          </p>
        </div>
        <div className="bg-[#1c2541]/60 border border-[#3a506b]/40 rounded-xl p-5 space-y-1">
          <p className="text-xs text-slate-400 font-medium">Erros</p>
          <p className="text-2xl font-bold text-rose-400">{res.incorrectCount}</p>
        </div>
        <div className="bg-[#1c2541]/60 border border-[#3a506b]/40 rounded-xl p-5 space-y-1">
          <p className="text-xs text-slate-400 font-medium">Em Branco</p>
          <p className="text-2xl font-bold text-amber-400">{res.blankCount}</p>
        </div>
        <div className="bg-[#1c2541]/60 border border-[#3a506b]/40 rounded-xl p-5 space-y-1">
          <p className="text-xs text-slate-400 font-medium">Tempo Gasto</p>
          <p className="text-2xl font-bold text-cyan-400">
            {formatSpentTime(res.timeSpentSeconds)}
          </p>
        </div>
      </div>

      {/* Subject Performance Breakdown */}
      <div className="bg-[#1c2541]/60 border border-[#3a506b]/50 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <h3 className="text-lg font-bold text-white">Desempenho por Matéria</h3>

        <div className="space-y-4">
          {Object.entries(res.subjectPerformance).map(([subjectId, data]) => (
            <div
              key={subjectId}
              className="space-y-2 bg-[#0b132b]/60 p-4 rounded-xl border border-[#3a506b]/30"
            >
              <div className="flex justify-between gap-4 text-sm font-medium">
                <span className="text-white">
                  {getSubjectName(config, subjectId)}
                </span>
                <span className="text-cyan-400 font-bold whitespace-nowrap">
                  {data.correct} / {data.total} ({data.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-[#1c2541] rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${data.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
