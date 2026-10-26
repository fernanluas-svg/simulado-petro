import React, { useEffect } from 'react';
import { useExamStore } from '../store/useExamStore';
import { History as HistoryIcon, Calendar, Clock, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

export const HistoryScreen: React.FC = () => {
  const { history, loadHistory, setView, resumeAttempt } = useExamStore();

  useEffect(() => {
    loadHistory();
  }, []);

  const completedHistory = history.filter((h) => h.isCompleted && h.scoreData);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-left">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setView('home')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </button>
        <h2 className="text-xl font-bold text-white">Histórico de Simulados</h2>
      </div>

      {completedHistory.length === 0 ? (
        <div className="bg-[#1c2541]/40 border border-[#3a506b]/40 rounded-2xl p-12 text-center space-y-4">
          <HistoryIcon className="w-12 h-12 text-slate-500 mx-auto" />
          <p className="text-slate-300 font-medium">Nenhum simulado concluído registrado ainda.</p>
          <button
            onClick={() => setView('setup')}
            className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all"
          >
            Fazer Primeiro Simulado
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {completedHistory.map((item) => {
            const res = item.scoreData!;
            const dateStr = new Date(item.startTime).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.id}
                className="bg-[#1c2541]/60 border border-[#3a506b]/50 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 ${
                      res.passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {res.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{res.passed ? 'Aprovado' : 'Reprovado'}</span>
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {dateStr}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm pt-1">
                    <span className="text-slate-200">
                      Nota: <strong className="text-cyan-400 text-base">{res.percentage.toFixed(1)}%</strong>
                    </span>
                    <span className="text-slate-200">
                      Acertos: <strong className="text-emerald-400">{res.correctCount} / {res.totalQuestions}</strong>
                    </span>
                    <span className="text-slate-200 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {Math.floor(res.timeSpentSeconds / 60)} min
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    resumeAttempt(item);
                    setView('result');
                  }}
                  className="bg-[#0b132b] hover:bg-[#161d31] text-cyan-400 border border-cyan-500/30 font-medium px-5 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap"
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
